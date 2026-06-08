import test from 'node:test';
import assert from 'node:assert';
import queueWorker from '../workers/queue/src/index.js';
import { buildQueueTaskEnvelope, buildPullRequestPreview } from '../packages/core/src/index.js';

const mockCtx = {};

function createMockTask(input = {}, options = {}) {
  const preview = buildPullRequestPreview(input, options);
  return buildQueueTaskEnvelope({
    type: 'draft_publish',
    stage: '4-release-candidate',
    created_at: new Date().toISOString(),
    idempotency_key: 'test-id-1234',
    publish_target: input.publish_target || null,
    preview
  });
}

test('Queue Worker: draft_publish success flow', async () => {
  let createdBranch = false;
  let committedFile = false;
  let createdPr = false;
  let ackCalled = false;
  let d1Updates = [];
  let auditLogs = [];

  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    console.log('mockGithubFetch URL:', url, 'PATH:', path);

    if (path.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: 'base-sha' } }), { status: 200 });
    }
    if (path.includes('/git/refs') && init.method === 'POST') {
      createdBranch = true;
      return new Response(JSON.stringify({ ref: 'refs/heads/draft/post-title' }), { status: 201 });
    }
    if (path.includes('/contents/') && (!init.method || init.method === 'GET')) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    if (path.includes('/contents/') && init.method === 'PUT') {
      committedFile = true;
      return new Response(JSON.stringify({ content: { path: 'content/posts/post-title.md' }, commit: { sha: 'commit-sha' } }), { status: 201 });
    }
    if (path.includes('/pulls') && init.method === 'POST') {
      createdPr = true;
      return new Response(JSON.stringify({ number: 42, html_url: 'https://github.com/example/xhalo-blog/pull/42' }), { status: 201 });
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => {
        if (sql.includes('UPDATE tasks')) {
          d1Updates.push({ status: args[0], payload: JSON.parse(args[1]), error: args[2], id: args[4] });
        } else if (sql.includes('INSERT INTO audit_logs')) {
          auditLogs.push({ action: args[2], resource: args[4], resource_id: args[5], error: args[13] });
        } else if (sql.includes('INSERT INTO posts_index')) {
          d1Updates.push({ type: 'posts_index', slug: args[1], status: args[4] });
        }
        return {
          run: async () => ({ success: true })
        };
      }
    })
  };

  const task = createMockTask({ title: 'Post Title', slug: 'post-title' });
  const batch = {
    messages: [
      {
        body: task,
        attempts: 1,
        ack() { ackCalled = true; }
      }
    ]
  };

  const env = {
    DB: mockDb,
    GITHUB_TOKEN: 'mock-github-token',
    GITHUB_FETCH: mockGithubFetch
  };

  await queueWorker.queue(batch, env, mockCtx);

  assert.ok(ackCalled);
  assert.ok(createdBranch);
  assert.ok(committedFile);
  assert.ok(createdPr);

  // Check state transitions in D1
  const processingTask = d1Updates.find(u => u.status === 'processing');
  const completedTask = d1Updates.find(u => u.status === 'completed');
  assert.ok(processingTask);
  assert.ok(completedTask);

  const postsIndexUpdate = d1Updates.find(u => u.type === 'posts_index');
  assert.equal(postsIndexUpdate.status, 'preview-ready');

  // Check audit log
  const completeAudit = auditLogs.find(a => a.action === 'draft_publish_completed');
  assert.ok(completeAudit);
  assert.equal(completeAudit.resource_id, 'post-title');
});

test('Queue Worker: draft_publish idempotency (branch and PR exist)', async () => {
  let branchAttempt = false;
  let fetchedExistingPr = false;
  let ackCalled = false;
  let d1Updates = [];

  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;

    if (path.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: 'base-sha' } }), { status: 200 });
    }
    if (path.includes('/git/refs') && init.method === 'POST') {
      branchAttempt = true;
      const errorResponse = {
        message: 'Validation Failed',
        errors: [{ resource: 'Reference', code: 'already_exists' }]
      };
      return new Response(JSON.stringify(errorResponse), { status: 422 });
    }
    if (path.includes('/contents/') && (!init.method || init.method === 'GET')) {
      return new Response(JSON.stringify({ sha: 'existing-file-sha' }), { status: 200 });
    }
    if (path.includes('/contents/') && init.method === 'PUT') {
      return new Response(JSON.stringify({ content: { path: 'content/posts/post-title.md' }, commit: { sha: 'commit-sha' } }), { status: 200 });
    }
    if (path.includes('/pulls') && init.method === 'POST') {
      return new Response(JSON.stringify({ message: 'Validation Failed' }), { status: 422 });
    }
    if (path.includes('/pulls') && (!init.method || init.method === 'GET')) {
      fetchedExistingPr = true;
      return new Response(JSON.stringify([
        { number: 42, html_url: 'https://github.com/example/xhalo-blog/pull/42' }
      ]), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => {
        if (sql.includes('UPDATE tasks')) {
          d1Updates.push({ status: args[0], error: args[2] });
        } else if (sql.includes('INSERT INTO posts_index')) {
          d1Updates.push({ type: 'posts_index', slug: args[1], status: args[4] });
        }
        return {
          run: async () => ({ success: true })
        };
      }
    })
  };

  const task = createMockTask({ title: 'Post Title', slug: 'post-title' });
  const batch = {
    messages: [
      {
        body: task,
        attempts: 1,
        ack() { ackCalled = true; }
      }
    ]
  };

  const env = {
    DB: mockDb,
    GITHUB_TOKEN: 'mock-github-token',
    GITHUB_FETCH: mockGithubFetch
  };

  await queueWorker.queue(batch, env, mockCtx);

  assert.ok(ackCalled);
  assert.ok(branchAttempt);
  assert.ok(fetchedExistingPr);

  const completedTask = d1Updates.find(u => u.status === 'completed');
  assert.ok(completedTask);

  const postsIndexUpdate = d1Updates.find(u => u.type === 'posts_index');
  assert.equal(postsIndexUpdate.status, 'preview-ready');
});

test('Queue Worker: draft_publish commit conflict (409)', async () => {
  let ackCalled = false;
  let d1Updates = [];
  let auditLogs = [];

  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;

    if (path.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: 'base-sha' } }), { status: 200 });
    }
    if (path.includes('/git/refs') && init.method === 'POST') {
      return new Response(JSON.stringify({ ref: 'refs/heads/draft/post-title' }), { status: 201 });
    }
    if (path.includes('/contents/') && (!init.method || init.method === 'GET')) {
      return new Response(JSON.stringify({ sha: 'old-sha' }), { status: 200 });
    }
    if (path.includes('/contents/') && init.method === 'PUT') {
      return new Response(JSON.stringify({ message: 'conflict' }), { status: 409 });
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => {
        if (sql.includes('UPDATE tasks')) {
          d1Updates.push({ status: args[0], error: args[2] });
        } else if (sql.includes('INSERT INTO audit_logs')) {
          auditLogs.push({ action: args[2], error: args[13] });
        } else if (sql.includes('INSERT INTO posts_index')) {
          d1Updates.push({ type: 'posts_index', slug: args[1], status: args[4] });
        }
        return {
          run: async () => ({ success: true })
        };
      }
    })
  };

  const task = createMockTask({ title: 'Post Title', slug: 'post-title' });
  const batch = {
    messages: [
      {
        body: task,
        attempts: 1,
        ack() { ackCalled = true; }
      }
    ]
  };

  const env = {
    DB: mockDb,
    GITHUB_TOKEN: 'mock-github-token',
    GITHUB_FETCH: mockGithubFetch
  };

  await queueWorker.queue(batch, env, mockCtx);

  // The worker must STILL ack the message (since we handle retries via Cloudflare's queue/D1 status,
  // or catch and tag it as failed in D1, keeping the system non-blocking).
  assert.ok(ackCalled);
  const failedTask = d1Updates.find(u => u.status === 'failed' && u.type !== 'posts_index');
  assert.ok(failedTask);
  assert.match(failedTask.error, /conflict/);

  const postsIndexUpdate = d1Updates.find(u => u.type === 'posts_index');
  assert.equal(postsIndexUpdate.status, 'failed');

  const failedAudit = auditLogs.find(a => a.action === 'draft_publish_failed');
  assert.ok(failedAudit);
  assert.match(failedAudit.error, /conflict/);
});

test('Queue Worker: draft_publish missing configuration', async () => {
  let d1Updates = [];
  let auditLogs = [];

  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => {
        if (sql.includes('UPDATE tasks')) {
          d1Updates.push({ status: args[0], error: args[2] });
        } else if (sql.includes('INSERT INTO audit_logs')) {
          auditLogs.push({ action: args[2], error: args[13] });
        }
        return {
          run: async () => ({ success: true })
        };
      }
    })
  };

  const task = createMockTask({ title: 'Post Title', slug: 'post-title' });
  const batch = {
    messages: [
      {
        body: task,
        attempts: 1,
        ack() { }
      }
    ]
  };

  // Missing GITHUB_TOKEN and App config
  const env = {
    DB: mockDb
  };

  await queueWorker.queue(batch, env, mockCtx);

  const failedTask = d1Updates.find(u => u.status === 'failed' && u.type !== 'posts_index');
  assert.ok(failedTask);
  assert.match(failedTask.error, /required for the draft publish task/);

  const failedAudit = auditLogs.find(a => a.action === 'draft_publish_failed');
  assert.ok(failedAudit);
  assert.match(failedAudit.error, /required for the draft publish task/);
});
