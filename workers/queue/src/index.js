import {
  buildQueueTaskEnvelope,
  buildDraftMarkdownDocument,
  getGitHubRepository,
  hasGitHubAppConfig,
  getGitHubAuthorization,
  githubApiRequest,
  getBranchHeadSha,
  createBranchIfMissing,
  createDraftFileCommit,
  createPullRequest,
  nowIso
} from '../../../packages/core/src/index.js';

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

async function upsertPostIndexRecord(env, record) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  await env.DB.prepare(
    `INSERT INTO posts_index
    (id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, preview_url, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      path = excluded.path,
      status = excluded.status,
      updated_at = excluded.updated_at,
      published_at = COALESCE(excluded.published_at, posts_index.published_at),
      github_branch = COALESCE(excluded.github_branch, posts_index.github_branch),
      github_pr_url = COALESCE(excluded.github_pr_url, posts_index.github_pr_url),
      preview_url = COALESCE(excluded.preview_url, posts_index.preview_url),
      content = COALESCE(excluded.content, posts_index.content)`
  ).bind(
    record.id,
    record.slug,
    record.title,
    record.path,
    record.status,
    record.created_at,
    record.updated_at,
    record.published_at || null,
    record.github_branch || null,
    record.github_pr_url || null,
    record.preview_url || null,
    record.content || null
  ).run();

  return true;
}

async function insertAuditLog(env, entry) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, timestamp, action, actor, resource, resource_id, method, path, status_code, detail, ip, user_agent, duration_ms, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      entry.id || crypto.randomUUID(),
      entry.timestamp || new Date().toISOString(),
      entry.action,
      entry.actor || 'queue-worker',
      entry.resource || null,
      entry.resource_id || null,
      entry.method || null,
      entry.path || null,
      entry.status_code || null,
      typeof entry.detail === 'object' ? JSON.stringify(entry.detail) : (entry.detail || null),
      entry.ip || null,
      entry.user_agent || null,
      entry.duration_ms || null,
      entry.error || null
    ).run();
    return true;
  } catch (err) {
    console.error('Audit log write failed in Queue Worker:', err.message);
    return false;
  }
}

async function handleDraftPublishTask(task, env, taskId, retryCount) {
  const payload = task.payload?.payload ? task.payload.payload : (task.payload || {});
  const preview = payload.preview || {};
  const draft = preview.draft || {};
  const markdown = buildDraftMarkdownDocument(draft);
  const publishTarget = payload.publish_target;

  let pullRequest = null;
  let branchResult = { created: false };
  let commitResult = null;
  let authMode = 'd1';

  const useGitHub = publishTarget !== 'd1';
  const startTime = Date.now();

  if (useGitHub) {
    const hasGitHub = hasGitHubAppConfig(env) || Boolean(env.GITHUB_TOKEN);
    if (!hasGitHub) {
      const errMsg = 'GitHub App env or GITHUB_TOKEN is required for the draft publish task.';
      await upsertPostIndexRecord(env, {
        id: draft.slug,
        slug: draft.slug,
        title: draft.title || draft.slug,
        path: preview.filePath,
        status: 'failed',
        created_at: task.created_at || nowIso(),
        updated_at: nowIso(),
        github_branch: preview.branchName,
        github_pr_url: null,
        content: markdown
      });

      await insertAuditLog(env, {
        action: 'draft_publish_failed',
        resource: 'post',
        resource_id: draft.slug,
        status_code: 533, // Configuration missing error code
        duration_ms: Date.now() - startTime,
        error: errMsg,
        detail: { mode: 'live', auth_mode: 'none' }
      });
      throw new Error(errMsg);
    }

    const authorization = await getGitHubAuthorization(env);
    if (!authorization.header) {
      const errMsg = 'GitHub App env or GITHUB_TOKEN is required for the draft publish task.';
      await upsertPostIndexRecord(env, {
        id: draft.slug,
        slug: draft.slug,
        title: draft.title || draft.slug,
        path: preview.filePath,
        status: 'failed',
        created_at: task.created_at || nowIso(),
        updated_at: nowIso(),
        github_branch: preview.branchName,
        github_pr_url: null,
        content: markdown
      });

      await insertAuditLog(env, {
        action: 'draft_publish_failed',
        resource: 'post',
        resource_id: draft.slug,
        status_code: 503,
        duration_ms: Date.now() - startTime,
        error: errMsg,
        detail: { mode: 'live', auth_mode: 'none' }
      });
      throw new Error(errMsg);
    }
    authMode = authorization.mode;

    try {
      const baseSha = await getBranchHeadSha(env, preview.baseBranch);
      branchResult = await createBranchIfMissing(env, preview.branchName, baseSha);
      commitResult = await createDraftFileCommit(
        env,
        preview.filePath,
        preview.branchName,
        markdown,
        preview.commitMessage
      );
      pullRequest = await createPullRequest(env, preview);
    } catch (error) {
      const errMsg = error.message || String(error);
      const statusCode = error.status || 500;

      // Update D1 posts_index status to 'failed' on GitHub error
      await upsertPostIndexRecord(env, {
        id: draft.slug,
        slug: draft.slug,
        title: draft.title || draft.slug,
        path: preview.filePath,
        status: 'failed',
        created_at: task.created_at || nowIso(),
        updated_at: nowIso(),
        github_branch: preview.branchName,
        github_pr_url: null,
        content: markdown
      });

      await insertAuditLog(env, {
        action: 'draft_publish_failed',
        resource: 'post',
        resource_id: draft.slug,
        status_code: statusCode,
        duration_ms: Date.now() - startTime,
        error: errMsg,
        detail: { mode: 'live', auth_mode: authMode }
      });

      throw error;
    }
  }

  // Update D1 posts_index status to 'preview-ready' (or 'draft' if write to D1 target only)
  const finalStatus = pullRequest ? 'preview-ready' : 'draft';
  await upsertPostIndexRecord(env, {
    id: draft.slug,
    slug: draft.slug,
    title: draft.title || draft.slug,
    path: preview.filePath,
    status: finalStatus,
    created_at: task.created_at || nowIso(),
    updated_at: nowIso(),
    github_branch: pullRequest ? preview.branchName : null,
    github_pr_url: pullRequest ? pullRequest.html_url : null,
    content: markdown
  });

  await insertAuditLog(env, {
    action: 'draft_publish_completed',
    resource: 'post',
    resource_id: draft.slug,
    status_code: 200,
    duration_ms: Date.now() - startTime,
    detail: {
      mode: 'live',
      auth_mode: authMode,
      branch_created: branchResult.created,
      has_pr: !!pullRequest,
      pr_url: pullRequest?.html_url || null
    }
  });

  return {
    outcome: 'completed',
    auth_mode: authMode,
    branch_created: branchResult.created,
    content_path: commitResult?.content?.path || preview.filePath,
    commit_sha: commitResult?.commit?.sha || null,
    pull_request: pullRequest ? {
      number: pullRequest.number,
      url: pullRequest.html_url
    } : null
  };
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

        let summary;
        if (task.type === 'draft_publish') {
          summary = await handleDraftPublishTask(task, env, taskId, retryCount);
        } else {
          summary = buildTaskSummary(task);
        }

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
