import { createJsonResponse } from '../../../../packages/core/src/index.js';
import { insertAuditLog, extractRequestMeta } from './logger.js';
import { insertTaskRecord } from './models.js';
import { waitBeforePagesDeployHook, triggerPagesDeployHook } from './deploy-hooks.js';

/**
 * Shared guard for test-direct-publish endpoints.
 * Checks isTestDirectPublishEnabled and isForbiddenProductionContentTarget.
 * Returns { allowed, response, repository }.
 */
export async function guardTestDirectPublish(env, request, requestStart, actionName, actor, { isTestDirectPublishEnabled, isForbiddenProductionContentTarget, getGitHubRepository }) {
  if (!isTestDirectPublishEnabled(env)) {
    await insertAuditLog(env, {
      action: actionName + '_failed',
      ...extractRequestMeta(request),
      actor,
      status_code: 403,
      duration_ms: Date.now() - requestStart,
      error: `Test direct ${actionName.replace(/_/g, ' ')} is disabled.`,
      detail: {
        code: `TEST_DIRECT_${actionName.toUpperCase()}_DISABLED`,
        deployment_env: env.DEPLOYMENT_ENV || null,
        publish_mode: env.PUBLISH_MODE || null
      }
    });
    return {
      allowed: false,
      repository: null,
      response: createJsonResponse({
        error: `Test direct ${actionName.replace(/_/g, ' ')} is disabled.`,
        code: `TEST_DIRECT_${actionName.toUpperCase()}_DISABLED`,
        required_env: [
          'DEPLOYMENT_ENV=test',
          'PUBLISH_MODE=test_direct',
          'TEST_DIRECT_PUBLISH_ENABLED=true'
        ]
      }, { status: 403 })
    };
  }

  const repository = getGitHubRepository(env);
  if (isForbiddenProductionContentTarget(repository)) {
    return {
      allowed: false,
      repository,
      response: createJsonResponse({
        error: `Refusing to write to production content branch from test ${actionName.replace(/_/g, ' ')}.`,
        code: 'PRODUCTION_BRANCH_FORBIDDEN'
      }, { status: 403 })
    };
  }

  return { allowed: true, response: null, repository };
}

/**
 * Trigger Pages deploy hook after a commit.
 */
export async function triggerDeployAfterCommit(env, reason, commitResult, repository, extraMeta = {}) {
  await waitBeforePagesDeployHook(env);
  return triggerPagesDeployHook(env, {
    reason,
    commitSha: commitResult.commitSha,
    targetRepo: `${repository.owner}/${repository.repo}`,
    targetBranch: repository.baseBranch,
    ...extraMeta
  });
}

/**
 * Enqueue a task to the queue and persist the task record.
 * Returns { error, persisted } where error is a Response or null.
 */
export async function enqueueTask(env, prototype) {
  if (!env.TASK_QUEUE) {
    return { error: createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 }), persisted: null };
  }
  await env.TASK_QUEUE.send(prototype.queuedTask);
  const persisted = await insertTaskRecord(env, prototype.taskRecord);
  return { error: null, persisted };
}
