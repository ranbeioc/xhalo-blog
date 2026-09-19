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

test('POST /api/tasks/:taskId/retry rejects unauthenticated requests with 401', async () => {
  const { response, json } = await requestJson('/api/tasks/task-123/retry', {
    method: 'POST'
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 401);
  assert.match(json.error, /Unauthorized/);
});

test('POST /api/tasks/:taskId/retry returns 503 when DB is unavailable', async () => {
  const { response, json } = await requestJson('/api/tasks/task-123/retry', {
    method: 'POST',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    DB: null
  });

  assert.equal(response.status, 503);
  assert.equal(json.code, 'DB_UNAVAILABLE');
});

test('POST /api/tasks/:taskId/retry returns 404 when task is not found', async () => {
  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () => null,
        run: async () => ({ success: true })
      })
    })
  };

  const { response, json } = await requestJson('/api/tasks/task-missing/retry', {
    method: 'POST',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    DB: mockDb
  });

  assert.equal(response.status, 404);
  assert.equal(json.code, 'TASK_NOT_FOUND');
});

test('POST /api/tasks/:taskId/retry returns 400 when task is already completed', async () => {
  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => ({
        first: async () => ({
          id: 'task-done',
          type: 'draft_pr',
          status: 'completed',
          payload: JSON.stringify({ action: 'publish' }),
          error: null,
          created_at: '2026-09-09T00:00:00Z',
          updated_at: '2026-09-09T00:00:00Z'
        }),
        run: async () => ({ success: true })
      })
    })
  };

  const { response, json } = await requestJson('/api/tasks/task-done/retry', {
    method: 'POST',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    DB: mockDb
  });

  assert.equal(response.status, 400);
  assert.equal(json.code, 'TASK_ALREADY_COMPLETED');
});

test('POST /api/tasks/:taskId/retry successfully enqueues failed task and resets status to queued', async () => {
  let enqueuedPayload = null;
  let updatedTaskRow = null;
  let auditRow = null;

  const initialTask = {
    id: 'task-failed-1',
    type: 'draft_pr',
    status: 'failed',
    payload: JSON.stringify({
      slug: 'test-article',
      reconciliation: {
        last_error: 'Network timeout',
        retry_count: 1
      }
    }),
    error: 'Network timeout connecting to GitHub',
    created_at: '2026-09-09T00:00:00Z',
    updated_at: '2026-09-09T00:01:00Z'
  };

  const mockQueue = {
    send: async (payload) => {
      enqueuedPayload = payload;
    }
  };

  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => {
        if (sql.includes('UPDATE tasks SET')) {
          updatedTaskRow = args;
        } else if (sql.includes('INSERT INTO audit_logs')) {
          auditRow = args;
        }
        return {
          first: async () => initialTask,
          run: async () => ({ success: true })
        };
      }
    })
  };

  const { response, json } = await requestJson('/api/tasks/task-failed-1/retry', {
    method: 'POST',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    TASK_QUEUE: mockQueue,
    DB: mockDb
  });

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.retried, true);
  assert.equal(json.task_id, 'task-failed-1');
  assert.equal(json.retry_count, 2);
  assert.equal(json.task.status, 'queued');
  assert.equal(json.task.last_error, null);

  // Verify queue payload was dispatched
  assert.ok(enqueuedPayload);
  assert.equal(enqueuedPayload.reconciliation.retry_count, 2);
  assert.ok(enqueuedPayload.reconciliation.retried_at);

  // Verify DB update parameters: status='queued', error=null, payload, updated_at, id
  assert.ok(updatedTaskRow);
  assert.equal(updatedTaskRow[0], 'queued');
  assert.equal(updatedTaskRow[3], 'task-failed-1');

  // Verify audit log
  assert.ok(auditRow);
  assert.equal(auditRow[2], 'task_retry');
  assert.equal(auditRow[4], 'task');
  assert.equal(auditRow[5], 'task-failed-1');
});

// Same shape as the draft_publish rows the queue consumer writes back on failure (checked against staging D1).
function failedDraftPublishRow(publishTarget = 'github') {
  const envelope = {
    type: 'draft_publish',
    stage: '4-release-candidate',
    created_at: '2026-06-09T08:35:00.000Z',
    idempotency_key: 'task-publish-1',
    payload: {
      type: 'draft_publish',
      stage: '4-release-candidate',
      created_at: '2026-06-09T08:35:00.000Z',
      idempotency_key: 'task-publish-1',
      publish_target: publishTarget,
      preview: { branchName: 'draft/example', baseBranch: 'main', filePath: 'source/_posts/example.md', draft: { title: 'Example', slug: 'example' } }
    }
  };
  return {
    id: 'task-publish-1',
    type: 'draft_publish',
    status: 'failed',
    payload: JSON.stringify({ ...envelope, reconciliation: { phase: 'failed', retry_count: 0, last_error: 'GitHub API 502' } }),
    error: 'GitHub API 502',
    created_at: '2026-06-09T08:35:00.000Z',
    updated_at: '2026-06-09T08:36:00.000Z'
  };
}

async function retryDraftPublish(row, extraEnv = {}) {
  const sent = [];
  const writes = [];
  const db = {
    prepare: (sql) => ({
      bind: (...args) => {
        writes.push({ sql, args });
        return { first: async () => row, run: async () => ({ success: true }) };
      }
    })
  };
  const { response, json } = await requestJson(`/api/tasks/${row.id}/retry`, {
    method: 'POST',
    headers: { 'x-xhalo-admin-secret': adminSecret }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    TASK_QUEUE: { send: async (payload) => { sent.push(payload); } },
    DB: db,
    ...extraEnv
  });
  return { response, json, sent, writes };
}

test('POST /api/tasks/:taskId/retry refuses a GitHub draft_publish while LIVE_WRITES_ENABLED is off', async () => {
  const { response, json, sent, writes } = await retryDraftPublish(failedDraftPublishRow());
  assert.equal(response.status, 403);
  assert.equal(json.code, 'LIVE_WRITES_DISABLED');
  assert.equal(sent.length, 0);
  assert.equal(writes.some((w) => w.sql.includes('UPDATE tasks')), false);
  const audit = writes.find((w) => w.sql.includes('INSERT INTO audit_logs'));
  assert.ok(audit);
  assert.ok(audit.args.includes('task_retry_rejected'));
});

test('POST /api/tasks/:taskId/retry allows a GitHub draft_publish when LIVE_WRITES_ENABLED=true', async () => {
  const { response, json, sent } = await retryDraftPublish(failedDraftPublishRow(), { LIVE_WRITES_ENABLED: 'true' });
  assert.equal(response.status, 200);
  assert.equal(json.retried, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, 'draft_publish');
});

test('POST /api/tasks/:taskId/retry still allows a D1-only draft_publish while live writes are off', async () => {
  const { response, sent } = await retryDraftPublish(failedDraftPublishRow('d1'));
  assert.equal(response.status, 200);
  assert.equal(sent.length, 1);
});

test('retryPerformsLiveWrite treats a draft_publish row as live even if its payload lost the type', async () => {
  const { retryPerformsLiveWrite } = await import('../workers/api/src/routes/tasks.js');
  assert.equal(retryPerformsLiveWrite({ type: 'draft_publish' }, { slug: 'x' }), true);
  assert.equal(retryPerformsLiveWrite({ type: 'draft_pr' }, { slug: 'x' }), false);
  assert.equal(retryPerformsLiveWrite({ type: 'draft_preview' }, { type: 'draft_preview' }), false);
});
