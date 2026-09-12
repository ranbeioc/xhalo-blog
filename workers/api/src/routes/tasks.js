import {
  createJsonResponse,
  createFallbackTasks,
  buildQueueTaskEnvelope,
  nowIso
} from '../../../../packages/core/src/index.js';
import {
  extractRequestMeta,
  insertAuditLog
} from '../lib/logger.js';
import {
  selectRows
} from '../lib/auth.js';
import {
  insertTaskRecord,
  parseJsonSafe,
  summarizeTaskRecord
} from '../lib/models.js';
import { enqueueTask } from '../lib/routes-shared.js';

export async function handleTaskRoutes(request, env, url, method, requestStart) {
  if (url.pathname === '/api/tasks') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    const items = await selectRows(
      env,
      'SELECT id, type, status, payload, error, created_at, updated_at FROM tasks ORDER BY updated_at DESC LIMIT 10'
    );

    return createJsonResponse({
      items: items ? items.map(summarizeTaskRecord) : createFallbackTasks().map(summarizeTaskRecord),
      backend: items ? 'd1' : 'fallback',
      note: items ? 'Read-only tasks prototype.' : 'D1 task status integration pending; showing fallback examples.'
    });
  }

  if (url.pathname.startsWith('/api/tasks/') && url.pathname.endsWith('/retry') && method === 'POST') {
    const taskId = url.pathname.slice('/api/tasks/'.length, -'/retry'.length);
    if (!taskId) {
      return createJsonResponse({ error: 'Task ID is required.', code: 'TASK_ID_REQUIRED' }, { status: 400 });
    }

    if (!env.DB || typeof env.DB.prepare !== 'function') {
      return createJsonResponse({
        error: 'Database is unavailable for task retry.',
        code: 'DB_UNAVAILABLE'
      }, { status: 503 });
    }

    const task = await env.DB.prepare(
      'SELECT id, type, status, payload, error, created_at, updated_at FROM tasks WHERE id = ?'
    ).bind(taskId).first();

    if (!task) {
      return createJsonResponse({ error: 'Task not found.', code: 'TASK_NOT_FOUND' }, { status: 404 });
    }

    if (task.status === 'completed') {
      return createJsonResponse({
        error: 'Cannot retry a completed task.',
        code: 'TASK_ALREADY_COMPLETED'
      }, { status: 400 });
    }

    const payload = parseJsonSafe(task.payload) || {};
    payload.reconciliation = payload.reconciliation || {};
    const retryCount = (payload.reconciliation.retry_count || 0) + 1;
    payload.reconciliation.retry_count = retryCount;
    payload.reconciliation.retried_at = nowIso();
    payload.reconciliation.last_error = null;

    if (env.TASK_QUEUE && typeof env.TASK_QUEUE.send === 'function') {
      await env.TASK_QUEUE.send(payload);
    }

    const now = nowIso();
    await env.DB.prepare(
      'UPDATE tasks SET status = ?, error = NULL, payload = ?, updated_at = ? WHERE id = ?'
    ).bind('queued', JSON.stringify(payload), now, taskId).run();

    await insertAuditLog(env, {
      action: 'task_retry',
      ...extractRequestMeta(request),
      resource: 'task',
      resource_id: taskId,
      status_code: 200,
      duration_ms: Date.now() - requestStart,
      detail: { retry_count: retryCount, previous_status: task.status }
    });

    return createJsonResponse({
      ok: true,
      retried: true,
      task_id: taskId,
      retry_count: retryCount,
      task: summarizeTaskRecord({
        ...task,
        status: 'queued',
        error: null,
        payload: JSON.stringify(payload),
        updated_at: now
      })
    });
  }

  if (url.pathname.startsWith('/api/tasks/') && method === 'GET') {
    const taskId = url.pathname.slice('/api/tasks/'.length);
    if (!taskId) {
      return createJsonResponse({ error: 'Task ID is required.', code: 'TASK_ID_REQUIRED' }, { status: 400 });
    }

    if (env.DB && typeof env.DB.prepare === 'function') {
      try {
        const row = await env.DB.prepare(
          'SELECT id, type, status, payload, error, created_at, updated_at FROM tasks WHERE id = ?'
        ).bind(taskId).first();

        if (row) {
          return createJsonResponse({
            ok: true,
            task: summarizeTaskRecord(row)
          });
        }
      } catch (err) {
        return createJsonResponse({
          error: 'Failed to query task status.',
          code: 'DB_QUERY_FAILED',
          detail: err.message
        }, { status: 500 });
      }
    }

    const fallback = createFallbackTasks().find((item) => item.id === taskId);
    if (fallback) {
      return createJsonResponse({
        ok: true,
        task: summarizeTaskRecord(fallback),
        backend: 'fallback'
      });
    }

    return createJsonResponse({
      error: `Task ${taskId} not found.`,
      code: 'TASK_NOT_FOUND'
    }, { status: 404 });
  }

  if (url.pathname === '/api/audit-logs') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    const items = await selectRows(
      env,
      'SELECT id, timestamp, action, actor, resource, resource_id, method, path, status_code, duration_ms, error FROM audit_logs ORDER BY timestamp DESC LIMIT 50'
    );

    return createJsonResponse({
      items: items || [],
      backend: items ? 'd1' : 'unavailable',
      note: 'Read-only audit log viewer.'
    });
  }

  if (url.pathname === '/api/audit-logs/summary') {
    if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
    const rows = await selectRows(
      env,
      'SELECT action, status_code FROM audit_logs ORDER BY timestamp DESC LIMIT 500'
    );
    const items = rows || [];
    const byAction = {};
    let failed = 0;
    for (const item of items) {
      const action = item.action || 'unknown';
      byAction[action] = (byAction[action] || 0) + 1;
      const statusCode = Number(item.status_code || 0);
      if (statusCode >= 400 || item.error) failed += 1;
    }

    return createJsonResponse({
      ok: true,
      total: items.length,
      failed,
      byAction,
      backend: rows ? 'd1' : 'unavailable',
      note: 'Read-only audit summary.'
    });
  }

  if (url.pathname === '/api/tasks/example' && method === 'POST') {
    const prototype = {
      queuedTask: buildQueueTaskEnvelope({
        type: 'build_status_poll',
        target_repo: 'ranbeioc/xhalo-blog',
        target_branch: 'draft/example-post',
        stage: '3-prototype'
      }),
      taskRecord: {
        id: crypto.randomUUID(),
        type: 'build_status_poll',
        status: 'pending',
        payload: {
          reconciliation: {
            summary: {
              provider: 'cloudflare-pages',
              outcome: 'polling'
            }
          }
        },
        created_at: nowIso(),
        updated_at: nowIso()
      }
    };

    const { error: queueError, persisted } = await enqueueTask(env, prototype);
    if (queueError) return queueError;

    return createJsonResponse({
      queued: true,
      persisted,
      task_id: prototype.taskRecord.id,
      note: 'Example queue message and tasks row prototype.'
    }, { status: 201 });
  }

  return null;
}
