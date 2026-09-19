import test from 'node:test';
import assert from 'node:assert/strict';

import queueWorker from '../workers/queue/src/index.js';
import { buildQueueTaskEnvelope, buildPullRequestPreview } from '../packages/core/src/index.js';

function draftTask(slug, key) {
  const preview = buildPullRequestPreview({ title: `Post ${slug}`, slug, body: 'Body.', category: 'notes' }, {});
  return buildQueueTaskEnvelope({
    type: 'draft_publish',
    stage: '4-release-candidate',
    created_at: '2026-09-19T00:00:00.000Z',
    idempotency_key: key,
    publish_target: 'github',
    preview
  });
}

function message(body, attempts = 1) {
  return {
    body,
    attempts,
    outcome: null,
    delaySeconds: null,
    ack() { this.outcome ??= 'ack'; },
    retry(options = {}) { this.outcome ??= 'retry'; this.delaySeconds = options.delaySeconds ?? null; }
  };
}

// Stateful GitHub: a file PUT without the current sha is rejected, as the real contents API does.
function fakeGithub({ failPullRequests = 0 } = {}) {
  const files = new Map();
  const state = { puts: 0, pulls: [] };
  let pullFailures = failPullRequests;
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
  const fetch = async (url, init = {}) => {
    const { pathname, searchParams } = new URL(url);
    const path = decodeURIComponent(pathname);
    const method = init.method || 'GET';
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (path.includes('/git/ref/heads/')) return json({ object: { sha: 'base-sha' } });
    if (path.endsWith('/git/refs') && method === 'POST') return json({ ref: 'created' }, 201);
    const file = path.match(/\/contents\/(.+)$/);
    if (file && method === 'GET') {
      const key = `${searchParams.get('ref')}:${file[1]}`;
      return files.has(key) ? json({ sha: files.get(key) }) : json({ message: 'Not Found' }, 404);
    }
    if (file && method === 'PUT') {
      const body = JSON.parse(init.body);
      const key = `${body.branch}:${file[1]}`;
      if (files.has(key) && body.sha !== files.get(key)) return json({ message: 'sha mismatch' }, 409);
      state.puts += 1;
      files.set(key, `blob-${state.puts}`);
      return json({ commit: { sha: `commit-${state.puts}` } }, 201);
    }
    if (path.endsWith('/pulls') && method === 'POST') {
      if (pullFailures > 0) {
        pullFailures -= 1;
        return json({ message: 'Bad Gateway' }, 502);
      }
      const body = JSON.parse(init.body);
      const existing = state.pulls.find((pull) => pull.head === body.head);
      if (existing) return json({ message: 'A pull request already exists' }, 422);
      const pull = { number: state.pulls.length + 1, head: body.head, html_url: `https://github.com/o/r/pull/${state.pulls.length + 1}` };
      state.pulls.push(pull);
      return json(pull, 201);
    }
    if (path.endsWith('/pulls') && method === 'GET') {
      const head = (searchParams.get('head') || '').split(':').pop();
      return json(state.pulls.filter((pull) => pull.head === head));
    }
    return json({ message: 'Not Found' }, 404);
  };
  return { fetch, state };
}

// Records task status writes; `failTaskStatus` lists statuses whose UPDATE throws.
function fakeDb({ failTaskStatus = [] } = {}) {
  const statuses = new Map();
  return {
    statuses,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.includes('UPDATE tasks')) {
                if (failTaskStatus.includes(args[0])) throw new Error('D1_ERROR: storage unavailable');
                statuses.set(args[args.length - 1], args[0]);
              }
              return { success: true };
            }
          };
        }
      };
    }
  };
}

function env(github, db) {
  return { DB: db, GITHUB_TOKEN: 'token', GITHUB_FETCH: github.fetch, GITHUB_OWNER: 'o', GITHUB_REPO: 'r', GITHUB_BRANCH: 'main' };
}

test('queue: two publishes of the same draft in one batch both complete (same branch runs sequentially)', async () => {
  const github = fakeGithub();
  const db = fakeDb();
  const messages = [message(draftTask('alpha', 'k1')), message(draftTask('alpha', 'k2'))];
  await queueWorker.queue({ messages }, env(github, db), {});
  assert.deepEqual(messages.map((m) => m.outcome), ['ack', 'ack']);
  assert.equal(db.statuses.get('k1'), 'completed');
  assert.equal(db.statuses.get('k2'), 'completed');
  assert.equal(github.state.puts, 2);
  assert.equal(github.state.pulls.length, 1);
});

test('queue: a transient GitHub error is retried with backoff instead of failing the task', async () => {
  const github = fakeGithub({ failPullRequests: 1 });
  const db = fakeDb();
  const first = message(draftTask('beta', 'k3'));
  await queueWorker.queue({ messages: [first] }, env(github, db), {});
  assert.equal(first.outcome, 'retry');
  assert.equal(first.delaySeconds, 20);
  assert.notEqual(db.statuses.get('k3'), 'failed');

  const second = message(draftTask('beta', 'k3'), 2);
  await queueWorker.queue({ messages: [second] }, env(github, db), {});
  assert.equal(second.outcome, 'ack');
  assert.equal(db.statuses.get('k3'), 'completed');
  assert.equal(github.state.pulls.length, 1);
});

test('queue: a failed "completed" write redelivers the task instead of marking a published draft failed', async () => {
  const github = fakeGithub();
  const db = fakeDb({ failTaskStatus: ['completed'] });
  const m = message(draftTask('gamma', 'k4'));
  await queueWorker.queue({ messages: [m] }, env(github, db), {});
  assert.equal(m.outcome, 'retry');
  assert.notEqual(db.statuses.get('k4'), 'failed');
  assert.equal(github.state.pulls.length, 1);
});

test('queue: when the failure itself cannot be recorded, the message is redelivered, not acknowledged', async () => {
  const github = fakeGithub();
  const db = fakeDb({ failTaskStatus: ['processing', 'failed'] });
  const m = message(draftTask('delta', 'k5'));
  await queueWorker.queue({ messages: [m] }, env(github, db), {});
  assert.equal(m.outcome, 'retry');
  assert.equal(github.state.puts, 0);
});
