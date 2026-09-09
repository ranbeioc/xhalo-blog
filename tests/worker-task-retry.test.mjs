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
