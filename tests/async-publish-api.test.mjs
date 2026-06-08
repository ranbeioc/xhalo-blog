import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../workers/api/src/index.js';

const adminSecret = 'test-admin-secret';

async function requestJson(pathname, init = {}, env = {}) {
  const request = new Request(`https://example.com${pathname}`, init);
  const response = await worker.fetch(request, env);
  const json = await response.json();
  return { response, json };
}

test('Async Publish API: rejects with 403 when LIVE_WRITES_ENABLED=false', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Staging Post',
      slug: 'staging-post',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'false'
  });

  assert.equal(response.status, 403);
  assert.equal(json.required_env, 'LIVE_WRITES_ENABLED=true');
});

test('Async Publish API: rejects with 500 when TASK_QUEUE is not bound', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Staging Post',
      slug: 'staging-post',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'true'
    // TASK_QUEUE is deliberately omitted
  });

  assert.equal(response.status, 500);
  assert.match(json.error, /TASK_QUEUE is not bound/);
});

test('Async Publish API: enqueues task, inserts D1 queued records, logs audit, and returns 202 Accepted', async () => {
  let enqueued = false;
  let taskPayload = null;
  let d1SqlCalls = [];
  let d1Binds = {};

  const mockQueue = {
    send: async (payload) => {
      enqueued = true;
      taskPayload = payload;
    }
  };

  const mockDb = {
    prepare: (sql) => {
      d1SqlCalls.push(sql);
      return {
        bind: (...args) => {
          if (sql.includes('INSERT INTO tasks')) {
            d1Binds.tasks = args;
          } else if (sql.includes('INSERT INTO posts_index')) {
            d1Binds.posts_index = args;
          } else if (sql.includes('INSERT INTO audit_logs')) {
            d1Binds.audit_logs = args;
          }
          return {
            run: async () => ({ success: true })
          };
        }
      };
    }
  };

  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Staging Post',
      slug: 'staging-post',
      body: 'This is body content',
      mode: 'live',
      publish_target: 'github'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'true',
    TASK_QUEUE: mockQueue,
    DB: mockDb
  });

  // 1. Verify response status and JSON envelope
  assert.equal(response.status, 202);
  assert.equal(json.mode, 'live');
  assert.equal(json.status, 'queued');
  assert.ok(json.task_id);
  assert.ok(json.persisted);

  // 2. Verify queue payload enqueued
  assert.ok(enqueued);
  assert.equal(taskPayload.type, 'draft_publish');
  assert.equal(taskPayload.payload.publish_target, 'github');
  assert.equal(taskPayload.payload.preview.draft.slug, 'staging-post');

  // 3. Verify D1 tasks insert
  assert.ok(d1Binds.tasks);
  assert.equal(d1Binds.tasks[0], json.task_id); // task ID
  assert.equal(d1Binds.tasks[1], 'draft_publish'); // type
  assert.equal(d1Binds.tasks[2], 'queued'); // initial status

  // 4. Verify D1 posts_index insert
  assert.ok(d1Binds.posts_index);
  assert.equal(d1Binds.posts_index[0], 'staging-post'); // id/slug
  assert.equal(d1Binds.posts_index[1], 'staging-post'); // slug
  assert.equal(d1Binds.posts_index[2], 'Staging Post'); // title
  assert.equal(d1Binds.posts_index[4], 'queued'); // status is 'queued'

  // 5. Verify D1 audit_logs insert
  assert.ok(d1Binds.audit_logs);
  assert.equal(d1Binds.audit_logs[2], 'draft_publish_queued'); // action
  assert.equal(d1Binds.audit_logs[4], 'post'); // resource
  assert.equal(d1Binds.audit_logs[5], 'staging-post'); // resource_id
  assert.equal(d1Binds.audit_logs[8], 202); // status_code
});
