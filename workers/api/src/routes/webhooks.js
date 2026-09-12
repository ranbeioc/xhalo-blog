import {
  createJsonResponse,
  nowIso
} from '../../../../packages/core/src/index.js';
import {
  logSecurity,
  extractRequestMeta,
  insertAuditLog
} from '../lib/logger.js';
import {
  insertTaskRecord,
  updatePostByBranchOrSlug
} from '../lib/models.js';

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  if (crypto.subtle && crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(aBuf, bBuf);
  let result = 0;
  for (let i = 0; i < aBuf.byteLength; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

async function recordWebhookTask(env, type, payload) {
  return insertTaskRecord(env, {
    id: crypto.randomUUID(),
    type,
    status: 'completed',
    payload,
    created_at: nowIso(),
    updated_at: nowIso()
  });
}

async function verifyGithubWebhookSignature(env, request, rawBody) {
  if (!env.GITHUB_WEBHOOK_SECRET) {
    throw new Error('GITHUB_WEBHOOK_SECRET is required for GitHub webhooks.');
  }

  const signatureHeader = request.headers.get('x-hub-signature-256') || '';
  if (!signatureHeader.startsWith('sha256=')) {
    throw new Error('Missing GitHub webhook signature.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.GITHUB_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  );
  const expected = `sha256=${Array.from(signature).map((value) => value.toString(16).padStart(2, '0')).join('')}`;

  if (!timingSafeEqual(expected, signatureHeader)) {
    throw new Error('GitHub webhook signature mismatch.');
  }
}

function mapPullRequestWebhookStatus(action, merged) {
  if (action === 'closed') return merged ? 'merged' : 'pr-closed';
  if (action === 'ready_for_review') return 'review-ready';
  return 'draft-pr-open';
}

async function verifyPreviewWebhookSecret(env, request) {
  if (!env.PREVIEW_WEBHOOK_SECRET) {
    throw new Error('PREVIEW_WEBHOOK_SECRET is required for preview deployment webhooks.');
  }

  const secret = request.headers.get('x-preview-webhook-secret') || '';
  if (!timingSafeEqual(secret, env.PREVIEW_WEBHOOK_SECRET)) {
    throw new Error('Preview deployment webhook secret mismatch.');
  }
}

export async function handleWebhookRoutes(request, env, url, method, requestStart, { readJsonBody }) {
  if (url.pathname === '/webhooks/github' && method === 'POST') {
    const rawBody = await request.text();

    try {
      await verifyGithubWebhookSignature(env, request, rawBody);
    } catch (error) {
      logSecurity('webhook_auth_failed', { ...extractRequestMeta(request), webhook: 'github' });
      await insertAuditLog(env, {
        action: 'webhook_auth_failed',
        ...extractRequestMeta(request),
        resource: 'webhook',
        resource_id: 'github',
        status_code: 403,
        duration_ms: Date.now() - requestStart
      });
      return createJsonResponse({ error: error.message || 'Invalid GitHub webhook.' }, { status: 403 });
    }

    const eventName = request.headers.get('x-github-event') || 'unknown';
    const payload = JSON.parse(rawBody || '{}');

    if (eventName === 'pull_request' && payload.pull_request) {
      const pullRequest = payload.pull_request;
      const action = payload.action || 'unknown';
      const branchName = pullRequest.head?.ref || null;
      const prUrl = pullRequest.html_url || null;
      const merged = Boolean(pullRequest.merged);
      const status = mapPullRequestWebhookStatus(action, merged);
      const updatedAt = nowIso();
      const persistedPost = await updatePostByBranchOrSlug(env, { github_branch: branchName }, {
        status,
        updated_at: updatedAt,
        github_pr_url: prUrl,
        published_at: merged ? updatedAt : null
      });
      const persistedTask = await recordWebhookTask(env, 'github_webhook', {
        event: eventName,
        action,
        branchName,
        pullRequestUrl: prUrl,
        reconciliation: {
          phase: 'completed',
          summary: {
            outcome: status,
            branch: branchName,
            pullRequestUrl: prUrl
          }
        }
      });

      await insertAuditLog(env, {
        action: 'github_webhook',
        ...extractRequestMeta(request),
        resource: 'webhook',
        resource_id: branchName,
        status_code: 200,
        duration_ms: Date.now() - requestStart,
        detail: { event: eventName, action, status, branch: branchName }
      });

      return createJsonResponse({
        accepted: true,
        event: eventName,
        action,
        branch_name: branchName,
        post_status: status,
        persisted_post: persistedPost,
        persisted_task: persistedTask
      });
    }

    const persistedTask = await recordWebhookTask(env, 'github_webhook', {
      event: eventName,
      action: payload.action || 'ignored',
      reconciliation: {
        phase: 'completed',
        summary: {
          outcome: 'ignored-event',
          event: eventName
        }
      }
    });

    return createJsonResponse({
      accepted: true,
      event: eventName,
      ignored: true,
      persisted_task: persistedTask
    });
  }

  if (url.pathname === '/webhooks/deployments/preview' && method === 'POST') {
    try {
      await verifyPreviewWebhookSecret(env, request);
    } catch (error) {
      logSecurity('webhook_auth_failed', { ...extractRequestMeta(request), webhook: 'preview' });
      await insertAuditLog(env, {
        action: 'webhook_auth_failed',
        ...extractRequestMeta(request),
        resource: 'webhook',
        resource_id: 'preview',
        status_code: 403,
        duration_ms: Date.now() - requestStart
      });
      return createJsonResponse({ error: error.message || 'Invalid preview deployment webhook.' }, { status: 403 });
    }

    const { input: payload, error: jsonError } = await readJsonBody(request);
    if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
    const branchName = String(payload.branchName || '').trim() || null;
    const postSlug = String(payload.postSlug || '').trim() || null;
    const previewUrl = String(payload.previewUrl || '').trim() || null;
    const provider = String(payload.provider || 'cloudflare-pages').trim() || 'cloudflare-pages';
    const status = String(payload.status || 'preview-ready').trim() || 'preview-ready';
    const updatedAt = nowIso();
    const persistedPost = await updatePostByBranchOrSlug(env, {
      github_branch: branchName,
      slug: postSlug
    }, {
      status,
      preview_url: previewUrl,
      updated_at: updatedAt
    });
    const persistedTask = await recordWebhookTask(env, 'preview_deployment_webhook', {
      provider,
      branchName,
      postSlug,
      previewUrl,
      status,
      reconciliation: {
        phase: 'completed',
        summary: {
          outcome: status,
          previewUrl,
          postSlug,
          branch: branchName
        }
      }
    });

    await insertAuditLog(env, {
      action: 'preview_deployment',
      ...extractRequestMeta(request),
      resource: 'deployment',
      resource_id: postSlug || branchName,
      status_code: 200,
      duration_ms: Date.now() - requestStart,
      detail: { provider, previewUrl, status, branch: branchName }
    });

    return createJsonResponse({
      accepted: true,
      provider,
      branch_name: branchName,
      post_slug: postSlug,
      preview_url: previewUrl,
      status,
      persisted_post: persistedPost,
      persisted_task: persistedTask
    });
  }

  return null;
}
