import { buildQueueTaskEnvelope } from '../../../packages/core/src/index.js';

async function updateTaskStatus(env, taskId, patch = {}) {
  if (!env.DB || typeof env.DB.prepare !== 'function' || !taskId) return false;

  await env.DB.prepare(
    'UPDATE tasks SET status = ?, payload = ?, error = ?, updated_at = ? WHERE id = ?'
  ).bind(
    patch.status || 'completed',
    JSON.stringify(patch.payload || {}),
    patch.error || null,
    new Date().toISOString(),
    taskId
  ).run();

  return true;
}

function buildTaskSummary(task) {
  const preview = task.payload?.preview || task.payload?.payload?.preview || {};

  switch (task.type) {
    case 'example':
      return {
        type: task.type,
        outcome: 'acknowledged',
        note: 'Example queue task consumed by scaffold worker.'
      };
    case 'draft_preview':
      return {
        type: task.type,
        outcome: 'preview-logged',
        branch: preview.branchName || null,
        file: preview.filePath || null,
        repository: preview.repository || null
      };
    case 'r2_upload_preview':
      return {
        type: task.type,
        outcome: 'preview-logged',
        bucket: preview.bucketName || null,
        key: preview.objectKey || null,
        contentType: preview.contentType || null
      };
    case 'publish_notification_preview':
      return {
        type: task.type,
        outcome: 'preview-logged',
        channel: preview.channel || null,
        previewUrl: preview.previewUrl || null,
        postSlug: preview.postSlug || null
      };
    case 'moderation_preview':
      return {
        type: task.type,
        outcome: 'preview-logged',
        provider: preview.provider || null,
        action: preview.action || null,
        commentId: preview.commentId || null
      };
    default:
      return {
        type: task.type || 'unknown',
        outcome: 'unknown-task',
        note: 'No typed scaffold handler exists for this queue task yet.'
      };
  }
}

export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      const task = buildQueueTaskEnvelope(message.body);
      const taskId = task.idempotency_key || task.payload?.idempotency_key || null;
      const retryCount = Math.max((message.attempts || 1) - 1, 0);

      try {
        await updateTaskStatus(env, taskId, {
          status: 'processing',
          payload: {
            ...task,
            reconciliation: {
              phase: 'processing',
              retry_count: retryCount
            }
          }
        });

        const summary = buildTaskSummary(task);

        if (summary.outcome === 'unknown-task') {
          console.warn('xhalo-blog queue unknown task type', JSON.stringify(summary));
        } else {
          console.log(`xhalo-blog queue ${task.type} task`, JSON.stringify(summary));
        }

        await updateTaskStatus(env, taskId, {
          status: 'completed',
          payload: {
            ...task,
            reconciliation: {
              phase: 'completed',
              retry_count: retryCount,
              summary
            }
          }
        });

        message.ack();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateTaskStatus(env, taskId, {
          status: 'failed',
          error: errorMessage,
          payload: {
            ...task,
            reconciliation: {
              phase: 'failed',
              retry_count: retryCount,
              last_error: errorMessage
            }
          }
        });
        console.error('xhalo-blog queue task failed', JSON.stringify({
          taskId,
          type: task.type,
          error: errorMessage
        }));
        message.ack();
      }
    }
  }
};
