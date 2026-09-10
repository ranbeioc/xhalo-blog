import {
  buildProviderReadinessSnapshot,
  buildDraftMarkdownDocument,
  buildDraftTaskPrototype,
  buildDraftPublishTaskPrototype,
  buildGitHubWritePlan,
  buildModerationPreview,
  buildModerationTaskPrototype,
  buildPublishNotificationPreview,
  buildPublishNotificationTaskPrototype,
  buildPullRequestPreview,
  buildQueueTaskEnvelope,
  buildR2UploadPreview,
  buildR2SignedUploadPlan,
  buildR2UploadTaskPrototype,
  buildR2UploadWritePlan,
  defaultDraftTemplate,
  firstTestArticleTemplate,
  defaultModerationTemplate,
  defaultPublishNotificationTemplate,
  defaultR2UploadTemplate,
  createFallbackPosts,
  createFallbackTasks,
  createJsonResponse,
  getScaffoldMetadata,
  nowIso,
  getGitHubFetch,
  getGitHubRepository,
  hasGitHubAppConfig,
  getGitHubAuthorization,
  githubApiRequest,
  getBranchHeadSha,
  createBranchIfMissing,
  createDraftFileCommit,
  createDirectMainCommit,
  createDirectMainUpsertCommit,
  createDirectMainUpdateCommit,
  createDirectMultiFileUpdateCommit,
  getFileContentFromBranch,
  getPostFileFromMain,
  listPostFilesFromMain,
  generateUnifiedDiff,
  createPullRequest,
  decodeBase64ToBytes,
  encodeBase64Url,
  validateDraftInput,
  validateDraftPath,
  validateDraftSlug,
  verifySessionCookie,
  validateMediaUpload,
  sanitizeFilename,
  generateMediaSnippet,
  validateMenuList,
  validateSocialLinkList,
  getConfigFromMain,
  getNextRuntimeMenuConfigsFromMain,
  normalizeMenuFromConfig,
  parseNextThemeMenu,
  parseNextThemeSocialLinks,
  updateConfigWithMenu,
  updateNextThemeConfigWithMenu,
  updateNextThemeConfigWithSocialLinks
} from '../../../packages/core/src/index.js';
import {
  createStructuredLog,
  logInfo,
  logWarn,
  logError,
  logSecurity,
  extractRequestMeta,
  insertAuditLog
} from './lib/logger.js';
import { handleCors } from './lib/cors.js';
import {
  triggerPagesDeployHook,
  waitBeforePagesDeployHook,
  buildHexoPostUrl,
  buildHexoNextPluginCatalog
} from './lib/deploy-hooks.js';
import {
  ALLOWED_MIME_TYPES,
  validateR2UploadInput,
  buildR2UploadBody,
  encodeJsonBase64Url,
  decodeBase64UrlToText,
  decodeBase64UrlToBytes,
  getAssetsSigningKey,
  signUploadToken,
  verifyUploadToken,
  putAssetObject,
  buildSignedUploadUrl,
  isTestMediaUploadEnabled,
  isTestTurnstileBypassEnabled,
  getTestMediaUploadPrefix,
  applyTestMediaUploadPrefix
} from './lib/r2.js';
import {
  selectRows,
  isFirstGithubLoginAdminEnabled,
  getAllowedGithubLogins,
  dbFirst,
  dbRun,
  countAdminUsers,
  getAdminUser,
  touchAdminLogin,
  createFirstAdminUser,
  resolveGithubAdminIdentity,
  hasAdminRequestSecret,
  verifyAccessJwt,
  verifyAdminRequest,
  verifyTurnstileToken
} from './lib/auth.js';
import {
  insertTaskRecord,
  upsertPostIndexRecord,
  updatePostByBranchOrSlug,
  parseJsonSafe,
  summarizeTaskRecord,
  summarizePostRecord
} from './lib/models.js';

let blogStatsCache = null;

function getBlogStatsCacheTtlMs(env) {
  const configured = Number(env.BLOG_STATS_CACHE_TTL_MS || env.ADMIN_STATS_CACHE_TTL_MS || 60000);
  if (!Number.isFinite(configured) || configured < 0) return 60000;
  return Math.min(configured, 300000);
}

function getBlogStatsCacheKey(env) {
  const repository = getGitHubRepository(env);
  return [
    repository.owner,
    repository.repo,
    repository.baseBranch,
    Boolean(env.DB),
    Boolean(env.GITHUB_TOKEN || (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_INSTALLATION_ID))
  ].join(':');
}
function isTestDirectPublishEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' &&
    env.PUBLISH_MODE === 'test_direct' &&
    String(env.TEST_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';
}

function isForbiddenProductionContentTarget(repository) {
  return repository.owner.toLowerCase() === 'ranbeioc' &&
    repository.repo.toLowerCase() === 'hexo-blog' &&
    repository.baseBranch.toLowerCase() === 'main';
}

async function getRuntimeMenuSnapshot(env) {
  const repository = getGitHubRepository(env);
  const nextThemeConfigs = await getNextRuntimeMenuConfigsFromMain(env, repository.baseBranch);
  for (const config of nextThemeConfigs) {
    const menu = parseNextThemeMenu(config.raw);
    const socialLinks = parseNextThemeSocialLinks(config.raw);
    if (menu.length > 0 || socialLinks.length > 0) {
      return {
        ok: true,
        source: config.filePath,
        sourceType: 'next-runtime',
        sha: config.sha,
        raw: config.raw,
        menu,
        socialLinks
      };
    }
  }

  const configData = await getConfigFromMain(env);
  const config = JSON.parse(configData.raw);
  return {
    ok: true,
    source: configData.filename,
    sourceType: 'rb-blog-config',
    sha: configData.sha,
    raw: configData.raw,
    menu: normalizeMenuFromConfig(config),
    socialLinks: []
  };
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

function isLiveWritesEnabled(env) {
  return String(env.LIVE_WRITES_ENABLED || '').toLowerCase() === 'true';
}
function rejectLiveWriteDisabled() {
  return createJsonResponse({
    error: 'Live writes are disabled.',
    code: 'LIVE_WRITES_DISABLED',
    required_env: 'LIVE_WRITES_ENABLED=true'
  }, { status: 403 });
}
async function readJsonBody(request) {
  try {
    const input = await request.json();
    if (input === null || typeof input !== 'object') {
      return { input: null, error: 'Invalid JSON request body.' };
    }
    return { input, error: null };
  } catch {
    return { input: null, error: 'Invalid JSON request body.' };
  }
}

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

function validatePublishInput(input) {
  return validateDraftInput(input);
}

function rejectUnauthorized() {
  return createJsonResponse({
    error: 'Unauthorized admin API request.',
    note: 'Protect this route with Cloudflare Access and an application-level admin secret before production use.'
  }, { status: 401 });
}

function isProtectedAdminRoute(pathname) {
  if (
    pathname.startsWith('/api/posts') ||
    pathname === '/api/readiness' ||
    pathname === '/api/tasks' ||
    pathname === '/api/tasks/example' ||
    pathname === '/api/audit-logs' ||
    pathname === '/api/audit-logs/summary' ||
    pathname === '/api/blog/stats' ||
    pathname.startsWith('/api/tasks/') ||
    pathname.startsWith('/api/integrations/')
  ) {
    return true;
  }

  return [
    '/api/drafts/',
    '/api/assets/',
    '/api/publish/',
    '/api/moderation/',
    '/api/site/',
    '/api/auth/'
  ].some((prefix) => pathname.startsWith(prefix));
}

async function handleRequest(request, env, requestStart) {
    try {
    const url = new URL(request.url);
    const method = request.method;

    if (url.pathname === '/api/health') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse({ ok: true, service: 'xhalo-blog-api', stage: '3-prototype', mode: 'scaffold' });
    }

    if (url.pathname === '/api/scaffold') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse(getScaffoldMetadata());
    }

    // ── OAuth Routes (public, not behind admin gate) ────────────────────────
    if (url.pathname === '/auth/github/start' && request.method === 'GET') {
      const clientId = env.GITHUB_OAUTH_CLIENT_ID;
      const baseUrl = env.ADMIN_AUTH_BASE_URL || url.origin;
      if (!clientId || !env.GITHUB_OAUTH_CLIENT_SECRET || !env.ADMIN_SESSION_SECRET) {
        return createJsonResponse({ error: 'OAuth is not configured.' }, { status: 400 });
      }
      const state = crypto.randomUUID();
      const redirectUri = `${baseUrl}/auth/github/callback`;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=read:user`;
      const cookieName = env.ADMIN_SESSION_COOKIE_NAME || 'xhalo_admin_session';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': githubAuthUrl,
          'Set-Cookie': `xhalo_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
        }
      });
    }

    if (url.pathname === '/auth/github/callback' && request.method === 'GET') {
      const clientId = env.GITHUB_OAUTH_CLIENT_ID;
      const clientSecret = env.GITHUB_OAUTH_CLIENT_SECRET;
      const sessionSecret = env.ADMIN_SESSION_SECRET;
      const baseUrl = env.ADMIN_AUTH_BASE_URL || url.origin;
      if (!clientId || !clientSecret || !sessionSecret) {
        return createJsonResponse({ error: 'OAuth is not configured.' }, { status: 400 });
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || !state) {
        return createJsonResponse({ error: 'Missing code or state parameter.' }, { status: 400 });
      }

      // Verify state cookie
      const { parseCookies: parseCk } = await import('../../../packages/core/src/auth-github-oauth.js');
      const cookieHeader = request.headers.get('Cookie') || '';
      const cookies = parseCk(cookieHeader);
      const expectedState = cookies['xhalo_oauth_state'];
      if (!expectedState || expectedState !== state) {
        logSecurity('oauth_state_mismatch', extractRequestMeta(request));
        return createJsonResponse({ error: 'Invalid OAuth state.' }, { status: 403 });
      }

      // Exchange code for token
      const ghFetch = env.GITHUB_FETCH || fetch;
      let accessToken;
      try {
        const tokenRes = await ghFetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'xhalo-blog-api'
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${baseUrl}/auth/github/callback`
          })
        });
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
        if (!accessToken) {
          logSecurity('oauth_token_exchange_failed', extractRequestMeta(request));
          return createJsonResponse({ error: 'Failed to exchange OAuth code.' }, { status: 403 });
        }
      } catch (err) {
        logSecurity('oauth_token_exchange_error', { ...extractRequestMeta(request), error: err.message });
        return createJsonResponse({ error: 'OAuth token exchange failed.' }, { status: 500 });
      }

      // Fetch GitHub user
      let ghUser;
      try {
        const userRes = await ghFetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'xhalo-blog-api'
          }
        });
        ghUser = await userRes.json();
      } catch (err) {
        return createJsonResponse({ error: 'Failed to fetch GitHub user.' }, { status: 500 });
      }

      const adminIdentity = await resolveGithubAdminIdentity(env, ghUser);
      if (!adminIdentity.allowed) {
        logSecurity('oauth_unauthorized_login', { ...extractRequestMeta(request), login: ghUser.login || 'unknown' });
        await insertAuditLog(env, {
          action: 'oauth_unauthorized_login',
          ...extractRequestMeta(request),
          resource: 'auth',
          resource_id: ghUser.login || 'unknown',
          status_code: 403,
          duration_ms: Date.now() - requestStart
        });
        return createJsonResponse({ error: 'Unauthorized GitHub login.' }, { status: 403 });
      }

      // Sign session cookie
      const { signSessionPayload, appendSetCookie } = await import('../../../packages/core/src/auth-github-oauth.js');
      const ttl = parseInt(env.ADMIN_SESSION_TTL_SECONDS || '86400', 10);
      const sessionPayload = {
        login: ghUser.login,
        id: ghUser.id,
        avatarUrl: ghUser.avatar_url || '',
        name: ghUser.name || ghUser.login,
        role: adminIdentity.role,
        isAdmin: adminIdentity.isAdmin,
        expiresAt: Date.now() + (ttl * 1000)
      };
      const signedSession = await signSessionPayload(sessionPayload, sessionSecret);
      const cookieName = env.ADMIN_SESSION_COOKIE_NAME || 'xhalo_admin_session';

      logInfo('oauth_login_success', { login: ghUser.login, role: adminIdentity.role, source: adminIdentity.source });
      await insertAuditLog(env, {
        action: 'oauth_login_success',
        ...extractRequestMeta(request),
        resource: 'auth',
        resource_id: ghUser.login,
        status_code: 302,
        duration_ms: Date.now() - requestStart,
        detail: { role: adminIdentity.role, source: adminIdentity.source }
      });

      const responseHeaders = new Headers();
      const frontendBaseUrl = env.ADMIN_FRONTEND_BASE_URL || baseUrl;
      const frontendPath = env.ADMIN_FRONTEND_PATH || '/admin';
      responseHeaders.set('Location', `${frontendBaseUrl}${frontendPath}`);
      appendSetCookie(responseHeaders, `${cookieName}=${encodeURIComponent(signedSession)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${ttl}`);
      appendSetCookie(responseHeaders, `xhalo_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);

      return new Response(null, {
        status: 302,
        headers: responseHeaders
      });
    }

    if (url.pathname === '/api/auth/session' && request.method === 'GET') {
      const isOAuthConfigured = Boolean(env.GITHUB_OAUTH_CLIENT_ID) && Boolean(env.GITHUB_OAUTH_CLIENT_SECRET) && Boolean(env.ADMIN_SESSION_SECRET);
      if (!isOAuthConfigured) {
        if (!(await verifyAdminRequest(request, env))) {
          logSecurity('auth_rejected', extractRequestMeta(request));
          await insertAuditLog(env, {
            action: 'auth_rejected',
            ...extractRequestMeta(request),
            status_code: 401,
            duration_ms: Date.now() - requestStart
          });
          return rejectUnauthorized();
        }
      }
      const session = await verifySessionCookie(request, env);
      if (!session) {
        return createJsonResponse({ authenticated: false });
      }
      return createJsonResponse({
        authenticated: true,
        user: {
          login: session.login,
          id: session.id,
          avatarUrl: session.avatarUrl,
          name: session.name,
          role: session.role || null,
          isAdmin: session.isAdmin === true || session.role === 'admin'
        }
      });
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const cookieName = env.ADMIN_SESSION_COOKIE_NAME || 'xhalo_admin_session';
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': `${cookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
        }
      });
    }

    if (url.pathname === '/webhooks/github' && request.method === 'POST') {
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

    if (url.pathname === '/webhooks/deployments/preview' && request.method === 'POST') {
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

    if (isProtectedAdminRoute(url.pathname)) {
      if (!(await verifyAdminRequest(request, env))) {
        logSecurity('auth_rejected', extractRequestMeta(request));
        await insertAuditLog(env, {
          action: 'auth_rejected',
          ...extractRequestMeta(request),
          status_code: 401,
          duration_ms: Date.now() - requestStart
        });
        return rejectUnauthorized();
      }
      if ((request.method === 'POST' || request.method === 'PUT') && !isTestTurnstileBypassEnabled(env)) {
        const isTurnstileValid = await verifyTurnstileToken(request, env);
        if (!isTurnstileValid) {
          logSecurity('turnstile_rejected', extractRequestMeta(request));
          await insertAuditLog(env, {
            action: 'turnstile_rejected',
            ...extractRequestMeta(request),
            status_code: 403,
            duration_ms: Date.now() - requestStart
          });
          return createJsonResponse({
            error: 'Turnstile verification failed.',
            note: 'Verify your Turnstile token in headers (x-xhalo-turnstile-token or cf-turnstile-token).'
          }, { status: 403 });
        }
      }
    }

    if (url.pathname === '/api/readiness') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse(buildProviderReadinessSnapshot(env));
    }

    if (url.pathname === '/api/posts') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      const requestedLimit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 20, 100));
      const requestedPage = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const offset = (requestedPage - 1) * requestedLimit;
      try {
        const gitItems = await listPostFilesFromMain(env, { branch: getGitHubRepository(env).baseBranch, limit: 500 });
        if (gitItems.length > 0) {
          const pagedItems = gitItems.slice(offset, offset + requestedLimit);
          return createJsonResponse({
            items: pagedItems.map(summarizePostRecord),
            backend: 'github',
            source_of_truth: 'git',
            count: pagedItems.length,
            page: requestedPage,
            pageSize: requestedLimit,
            total: gitItems.length,
            totalPages: Math.max(1, Math.ceil(gitItems.length / requestedLimit)),
            note: 'GitHub source/_posts listing from the configured test repository.'
          });
        }
      } catch (err) {
        logWarn('posts_git_listing_failed', { error: err.message, status: err.status || null });
      }

      let items = null;
      if (env.DB && typeof env.DB.prepare === 'function') {
        try {
          const result = await env.DB.prepare(
            'SELECT id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, preview_url, content FROM posts_index ORDER BY COALESCE(updated_at, created_at) DESC LIMIT ? OFFSET ?'
          ).bind(requestedLimit, offset).all();
          items = result.results || null;
        } catch { items = null; }
      }

      const d1Items = Array.isArray(items) && items.length > 0 ? items : null;
      const fallbackItems = createFallbackPosts();
      return createJsonResponse({
        items: d1Items ? d1Items.map(summarizePostRecord) : fallbackItems.slice(offset, offset + requestedLimit).map(summarizePostRecord),
        backend: d1Items ? 'd1' : 'fallback',
        source_of_truth: 'git',
        page: requestedPage,
        pageSize: requestedLimit,
        total: d1Items ? null : fallbackItems.length,
        totalPages: d1Items ? null : Math.max(1, Math.ceil(fallbackItems.length / requestedLimit)),
        note: d1Items ? 'Read-only posts_index prototype.' : 'GitHub listing and D1 posts_index unavailable; showing fallback examples.'
      });
    }

    if (url.pathname === '/api/posts/source' && request.method === 'GET') {
      const slug = url.searchParams.get('slug');
      const slugErrors = validateDraftSlug(slug);
      if (slugErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: slugErrors }, { status: 400 });
      }

      try {
        const targetPath = url.searchParams.get('targetPath') || undefined;
        const postData = await getPostFileFromMain(env, { slug, filePath: targetPath });
        const repository = getGitHubRepository(env);
        return createJsonResponse({
          ok: true,
          slug: postData.slug,
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: postData.filePath,
          sha: postData.sha,
          frontmatter: postData.frontmatter,
          body: postData.body,
          raw: postData.raw
        });
      } catch (err) {
        if (err.status === 404) {
          return createJsonResponse({
            error: 'Target post not found.',
            code: 'TARGET_NOT_FOUND'
          }, { status: 404 });
        }
        if (err.status === 400 && err.code === 'OWNER_DIRECT_MAIN_REQUIRED') {
          return createJsonResponse({
            error: err.message,
            code: err.code
          }, { status: 400 });
        }
        return createJsonResponse({
          error: `Failed to fetch file from GitHub: ${err.message}`,
          code: 'GITHUB_FETCH_FAILED'
        }, { status: 500 });
      }
    }

    if (url.pathname === '/api/drafts/direct-update-preview' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }

      const slugErrors = validateDraftSlug(input.slug);
      if (slugErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: slugErrors }, { status: 400 });
      }

      const pathErrors = validateDraftPath(input);
      if (pathErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: pathErrors }, { status: 400 });
      }

      if (!input.body || String(input.body).trim().length === 0) {
        return createJsonResponse({ error: 'Validation failed.', details: ['Missing required field: body'] }, { status: 400 });
      }

      if (Array.isArray(input)) {
        return createJsonResponse({ error: 'Validation failed.', details: ['Batch payload is not allowed'] }, { status: 400 });
      }

      try {
        const postData = await getPostFileFromMain(env, { slug: input.slug, filePath: input.targetPath || input.filePath });
        const updatedMarkdown = buildDraftMarkdownDocument(input);
        const diff = generateUnifiedDiff(postData.raw, updatedMarkdown, `${input.slug}.md`);

        const previewHtml = updatedMarkdown.split('\n\n').map(p => {
          let text = p.trim();
          if (!text) return '';
          if (text.startsWith('#')) {
            const level = text.match(/^#+/)[0].length;
            const cleanText = text.replace(/^#+\s*/, '');
            return `<h${level}>${cleanText}</h${level}>`;
          }
          text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
          text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
          return `<p>${text}</p>`;
        }).filter(Boolean).join('\n');

        return createJsonResponse({
          ok: true,
          mode: 'owner_direct_update_preview',
          targetPath: postData.filePath,
          baseSha: postData.sha,
          diffSummary: {
            addedLines: diff.addedLines,
            removedLines: diff.removedLines,
            frontmatterChanged: diff.frontmatterChanged,
            bodyChanged: diff.bodyChanged
          },
          diffText: diff.diffText,
          previewHtml
        });
      } catch (err) {
        if (err.status === 404) {
          return createJsonResponse({
            error: 'Target post not found.',
            code: 'TARGET_NOT_FOUND'
          }, { status: 404 });
        }
        return createJsonResponse({
          error: `Failed to fetch file from GitHub: ${err.message}`,
          code: 'GITHUB_FETCH_FAILED'
        }, { status: 500 });
      }
    }

    if (url.pathname === '/api/drafts/direct-update' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }

      const publishMode = env.PUBLISH_MODE || 'pr_only';
      const ownerDirectPublishEnabled = String(env.OWNER_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';
      const ownerDirectUpdateEnabled = String(env.OWNER_DIRECT_UPDATE_ENABLED || '').toLowerCase() === 'true';

      if (publishMode !== 'owner_direct' || !ownerDirectPublishEnabled || !ownerDirectUpdateEnabled) {
        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: 403,
          duration_ms: Date.now() - requestStart,
          error: 'Owner direct update is disabled.',
          detail: { code: 'OWNER_DIRECT_UPDATE_DISABLED' }
        });
        return createJsonResponse({
          error: 'Owner direct update is disabled.',
          code: 'OWNER_DIRECT_UPDATE_DISABLED'
        }, { status: 403 });
      }

      const expectedPhrase = env.OWNER_DIRECT_UPDATE_CONFIRMATION_PHRASE || 'DIRECT UPDATE EXISTING POST';
      if (!input.confirmationPhrase || input.confirmationPhrase !== expectedPhrase) {
        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Invalid confirmation phrase.',
          detail: { code: 'INVALID_CONFIRMATION' }
        });
        return createJsonResponse({
          error: 'Invalid confirmation phrase.',
          code: 'INVALID_CONFIRMATION'
        }, { status: 400 });
      }

      if (!input.baseSha) {
        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Missing required field: baseSha',
          detail: { code: 'MISSING_BASE_SHA' }
        });
        return createJsonResponse({
          error: 'Missing required field: baseSha',
          code: 'MISSING_BASE_SHA'
        }, { status: 400 });
      }

      const slugErrors = validateDraftSlug(input.slug);
      if (slugErrors.length > 0) {
        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Validation failed.',
          detail: { code: 'VALIDATION_FAILED', errors: slugErrors }
        });
        return createJsonResponse({ error: 'Validation failed.', details: slugErrors }, { status: 400 });
      }

      const pathErrors = validateDraftPath(input);
      if (pathErrors.length > 0) {
        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Validation failed.',
          detail: { code: 'PATH_VALIDATION_FAILED', errors: pathErrors }
        });
        return createJsonResponse({ error: 'Validation failed.', details: pathErrors }, { status: 400 });
      }

      if (!input.body || String(input.body).trim().length === 0) {
        return createJsonResponse({ error: 'Validation failed.', details: ['Missing required field: body'] }, { status: 400 });
      }

      if (Array.isArray(input)) {
        return createJsonResponse({ error: 'Validation failed.', details: ['Batch payload is not allowed'] }, { status: 400 });
      }

      const repository = getGitHubRepository(env);
      if (repository.baseBranch !== 'main') {
        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Owner direct publish requires GITHUB_BRANCH=main.',
          detail: { code: 'OWNER_DIRECT_MAIN_REQUIRED' }
        });
        return createJsonResponse({
          error: 'Owner direct publish requires GITHUB_BRANCH=main.',
          code: 'OWNER_DIRECT_MAIN_REQUIRED'
        }, { status: 400 });
      }

      const filePath = `source/_posts/${input.slug}.md`;
      const auditId = crypto.randomUUID();
      const updatedMarkdown = buildDraftMarkdownDocument(input);
      const commitMessage = `[owner-direct-update] update post: ${input.title}`;

      try {
        let oldRaw = '';
        try {
          const existingPost = await getPostFileFromMain(env, { slug: input.slug, filePath: input.targetPath || input.filePath });
          oldRaw = existingPost.raw;
        } catch (existingErr) {
          // ignore
        }

        const diff = generateUnifiedDiff(oldRaw, updatedMarkdown, `${input.slug}.md`);

        const commitResult = await createDirectMainUpdateCommit(env, {
          branch: repository.baseBranch,
          filePath,
          content: updatedMarkdown,
          baseSha: input.baseSha,
          commitMessage
        });

        const persisted = await upsertPostIndexRecord(env, {
          id: input.slug,
          slug: input.slug,
          title: input.title,
          path: filePath,
          status: 'published',
          created_at: nowIso(),
          updated_at: nowIso(),
          published_at: nowIso(),
          github_branch: repository.baseBranch,
          github_pr_url: null,
          preview_url: null,
          content: updatedMarkdown
        });

        await insertAuditLog(env, {
          action: 'owner_direct_update',
          ...extractRequestMeta(request),
          resource: 'post',
          resource_id: input.slug,
          status_code: 200,
          duration_ms: Date.now() - requestStart,
          detail: {
            mode: 'owner_direct_update',
            target_repo: `${repository.owner}/${repository.repo}`,
            target_branch: repository.baseBranch,
            target_path: filePath,
            old_sha: input.baseSha,
            new_commit_sha: commitResult.commitSha,
            audit_id: auditId,
            diffSummary: {
              addedLines: diff.addedLines,
              removedLines: diff.removedLines,
              frontmatterChanged: diff.frontmatterChanged,
              bodyChanged: diff.bodyChanged
            }
          }
        });

        return createJsonResponse({
          ok: true,
          mode: 'owner_direct_update',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: filePath,
          oldSha: input.baseSha,
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          auditId,
          message: 'Existing post updated on main. Cloudflare Pages build may start automatically.'
        });
      } catch (err) {
        const isStale = err.code === 'STALE_BASE_SHA' || err.status === 409;
        const isNotFound = err.code === 'TARGET_NOT_FOUND' || err.status === 404;
        const statusCode = isStale ? 409 : isNotFound ? 404 : 500;
        const errCode = isStale ? 'STALE_BASE_SHA' : isNotFound ? 'TARGET_NOT_FOUND' : 'COMMIT_FAILED';

        await insertAuditLog(env, {
          action: 'owner_direct_update_failed',
          ...extractRequestMeta(request),
          status_code: statusCode,
          duration_ms: Date.now() - requestStart,
          error: err.message,
          detail: { code: errCode }
        });

        return createJsonResponse({
          error: err.message,
          code: errCode
        }, { status: statusCode });
      }
    }

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

    if (url.pathname.startsWith('/api/tasks/') && url.pathname.endsWith('/retry') && request.method === 'POST') {
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

    if (url.pathname.startsWith('/api/tasks/') && request.method === 'GET') {
      const taskId = url.pathname.slice('/api/tasks/'.length);
      if (taskId && taskId !== 'example') {
        if (!env.DB || typeof env.DB.prepare !== 'function') {
          const fallbackTask = createFallbackTasks().find(t => t.id === taskId);
          if (fallbackTask) {
            return createJsonResponse({
              ok: true,
              task: summarizeTaskRecord(fallbackTask)
            });
          }
          return createJsonResponse({ error: 'Task not found in fallback' }, { status: 404 });
        }
        
        const task = await env.DB.prepare(
          'SELECT id, type, status, payload, error, created_at, updated_at FROM tasks WHERE id = ?'
        ).bind(taskId).first();
        
        if (!task) {
          return createJsonResponse({ error: 'Task not found' }, { status: 404 });
        }
        
        return createJsonResponse({
          ok: true,
          task: summarizeTaskRecord(task)
        });
      }
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

    if (url.pathname === '/api/blog/stats') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      const cacheKey = getBlogStatsCacheKey(env);
      const cacheTtlMs = getBlogStatsCacheTtlMs(env);
      const cacheNow = Date.now();
      if (blogStatsCache && blogStatsCache.key === cacheKey && blogStatsCache.expiresAt > cacheNow) {
        return createJsonResponse({
          ...blogStatsCache.payload,
          cache: {
            state: 'hit',
            ttlMs: cacheTtlMs,
            expiresAt: new Date(blogStatsCache.expiresAt).toISOString()
          }
        }, {
          headers: {
            'cache-control': 'private, max-age=30',
            'x-xhalo-cache': 'blog-stats-hit'
          }
        });
      }

      const fallbackPosts = createFallbackPosts();
      let gitPosts = null;
      let gitPostsError = null;
      try {
        if (!env.GITHUB_OWNER || !env.GITHUB_REPO) {
          throw new Error('GitHub repository is not configured.');
        }
        gitPosts = await listPostFilesFromMain(env, {
          branch: getGitHubRepository(env).baseBranch,
          limit: 200
        });
      } catch (error) {
        gitPostsError = error.message || String(error);
      }
      const postsRows = gitPosts ? null : await selectRows(env, 'SELECT status FROM posts_index LIMIT 10000');
      const taskRows = await selectRows(env, 'SELECT status, type FROM tasks LIMIT 10000');
      const auditRows = await selectRows(env, 'SELECT status_code, resource FROM audit_logs LIMIT 10000');
      const posts = gitPosts || postsRows || fallbackPosts;
      const tasks = taskRows || [];
      const audit = auditRows || [];
      const mediaAssets = audit.filter((item) => item.resource === 'asset' || item.resource === 'media').length;
      const categories = {};
      const tags = {};
      for (const post of posts) {
        const category = post.frontmatter?.category || post.frontmatter?.categories || post.category || 'uncategorized';
        const categoryList = Array.isArray(category) ? category : [category];
        for (const item of categoryList.filter(Boolean)) {
          categories[String(item)] = (categories[String(item)] || 0) + 1;
        }
        const tagList = Array.isArray(post.frontmatter?.tags) ? post.frontmatter.tags : [];
        for (const item of tagList.filter(Boolean)) {
          tags[String(item)] = (tags[String(item)] || 0) + 1;
        }
      }

      const payload = {
        ok: true,
        backend: gitPosts ? 'github' : postsRows ? 'd1' : 'fallback',
        sourceOfTruth: gitPosts ? 'git-source-posts' : 'd1-or-fallback',
        generatedAt: nowIso(),
        target: getGitHubRepository(env),
        counts: {
          posts: posts.length,
          publishedPosts: posts.filter((item) => item.status === 'published').length,
          draftPosts: posts.filter((item) => item.status === 'draft').length,
          tasks: tasks.length,
          mediaAssets,
          auditEvents: audit.length,
          categories: Object.keys(categories).length,
          tags: Object.keys(tags).length
        },
        topCategories: Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
        topTags: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
        gitPostsError,
        cache: {
          state: 'miss',
          ttlMs: cacheTtlMs,
          expiresAt: new Date(cacheNow + cacheTtlMs).toISOString()
        },
        note: 'Read-only blog statistics summary from GitHub source posts when available.'
      };

      blogStatsCache = {
        key: cacheKey,
        payload,
        expiresAt: cacheNow + cacheTtlMs
      };

      return createJsonResponse(payload, {
        headers: {
          'cache-control': 'private, max-age=30',
          'x-xhalo-cache': 'blog-stats-miss'
        }
      });
    }

    if (url.pathname === '/api/drafts/template') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse({
        template: defaultDraftTemplate,
        note: 'Stage 3 draft metadata prototype. No real GitHub write happens here.'
      });
    }

    if (url.pathname === '/api/drafts/preview' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }
      const validationErrors = validatePublishInput(input);
      if (validationErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
      }
      const preview = buildPullRequestPreview(input, {
        repoOwner: env.GITHUB_OWNER || 'example',
        repoName: env.GITHUB_REPO || 'xhalo-blog',
        baseBranch: env.GITHUB_BRANCH || 'main'
      });

      return createJsonResponse({
        preview,
        note: 'Stage 3 draft and PR preview only. No branch or PR has been created.'
      });
    }

    if (url.pathname === '/api/drafts/tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }
      const validationErrors = validatePublishInput(input);
      if (validationErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
      }
      const prototype = buildDraftTaskPrototype(input, {
        repoOwner: env.GITHUB_OWNER || 'example',
        repoName: env.GITHUB_REPO || 'xhalo-blog',
        baseBranch: env.GITHUB_BRANCH || 'main',
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run draft task queued. No GitHub branch or PR has been created.'
      });
    }

    if (url.pathname === '/api/drafts/github-plan' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }
      const validationErrors = validatePublishInput(input);
      if (validationErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
      }
      const plan = buildGitHubWritePlan(input, {
        repoOwner: env.GITHUB_OWNER || 'example',
        repoName: env.GITHUB_REPO || 'xhalo-blog',
        baseBranch: env.GITHUB_BRANCH || 'main'
      });

      return createJsonResponse({
        preview: buildPullRequestPreview(input, {
          repoOwner: env.GITHUB_OWNER || 'example',
          repoName: env.GITHUB_REPO || 'xhalo-blog',
          baseBranch: env.GITHUB_BRANCH || 'main'
        }),
        plan,
        note: 'Dry-run GitHub operation plan only. No branch, commit, or PR has been created.'
      });
    }

    if (url.pathname === '/api/drafts/publish' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }
      const validationErrors = validatePublishInput(input);
      if (validationErrors.length > 0) {
        return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
      }
      const mode = input.mode === 'live' ? 'live' : 'dry-run';
      const repository = getGitHubRepository(env);
      const preview = buildPullRequestPreview(input, {
        repoOwner: repository.owner,
        repoName: repository.repo,
        baseBranch: repository.baseBranch
      });
      const plan = buildGitHubWritePlan(input, {
        repoOwner: repository.owner,
        repoName: repository.repo,
        baseBranch: repository.baseBranch
      });

      if (mode !== 'live') {
        return createJsonResponse({
          mode,
          auth_mode: hasGitHubAppConfig(env) ? 'app' : env.GITHUB_TOKEN ? 'token' : 'none',
          preview,
          plan,
          note: 'Dry-run draft publish only. No branch, commit, or PR has been created.'
        });
      }

      if (!isLiveWritesEnabled(env)) {
        return rejectLiveWriteDisabled();
      }

      if (!env.TASK_QUEUE) {
        return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });
      }

      const prototype = buildDraftPublishTaskPrototype(input, {
        repoOwner: repository.owner,
        repoName: repository.repo,
        baseBranch: repository.baseBranch,
        stage: '4-release-candidate'
      });

      const markdown = buildDraftMarkdownDocument(input);

      // Upsert posts_index status to 'queued' before queueing the task
      const persisted = await upsertPostIndexRecord(env, {
        id: preview.draft.slug,
        slug: preview.draft.slug,
        title: preview.draft.title || preview.draft.slug,
        path: preview.filePath,
        status: 'queued',
        created_at: nowIso(),
        updated_at: nowIso(),
        github_branch: preview.branchName,
        github_pr_url: null,
        content: markdown
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persistedTask = await insertTaskRecord(env, prototype.taskRecord);

      const authMode = hasGitHubAppConfig(env) ? 'app' : env.GITHUB_TOKEN ? 'token' : 'none';

      await insertAuditLog(env, {
        action: 'draft_publish_queued',
        ...extractRequestMeta(request),
        resource: 'post',
        resource_id: preview.draft.slug,
        status_code: 202,
        duration_ms: Date.now() - requestStart,
        detail: { mode, auth_mode: authMode, task_id: prototype.taskRecord.id }
      });

      return createJsonResponse({
        mode,
        status: 'queued',
        task_id: prototype.taskRecord.id,
        preview,
        plan,
        persisted,
        persisted_task: persistedTask
      }, { status: 202 });
    }

    if (url.pathname === '/api/drafts/test-direct-publish' && request.method === 'POST') {
      const session = await verifySessionCookie(request, env);
      if (!session || !(session.isAdmin === true || session.role === 'admin')) {
        await insertAuditLog(env, {
          action: 'test_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: 401,
          duration_ms: Date.now() - requestStart,
          error: 'GitHub admin session is required.',
          detail: { code: 'ADMIN_SESSION_REQUIRED' }
        });
        return createJsonResponse({
          error: 'GitHub admin session is required.',
          code: 'ADMIN_SESSION_REQUIRED'
        }, { status: 401 });
      }

      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }

      if (!isTestDirectPublishEnabled(env)) {
        await insertAuditLog(env, {
          action: 'test_direct_publish_failed',
          ...extractRequestMeta(request),
          actor: session.login,
          status_code: 403,
          duration_ms: Date.now() - requestStart,
          error: 'Test direct publish is disabled.',
          detail: {
            code: 'TEST_DIRECT_PUBLISH_DISABLED',
            deployment_env: env.DEPLOYMENT_ENV || null,
            publish_mode: env.PUBLISH_MODE || null
          }
        });
        return createJsonResponse({
          error: 'Test direct publish is disabled.',
          code: 'TEST_DIRECT_PUBLISH_DISABLED',
          required_env: [
            'DEPLOYMENT_ENV=test',
            'PUBLISH_MODE=test_direct',
            'TEST_DIRECT_PUBLISH_ENABLED=true'
          ]
        }, { status: 403 });
      }

      const validationInput = {
        ...firstTestArticleTemplate,
        ...(input || {}),
        status: 'published'
      };
      const validationErrors = validatePublishInput(validationInput);
      if (validationErrors.length > 0) {
        await insertAuditLog(env, {
          action: 'test_direct_publish_failed',
          ...extractRequestMeta(request),
          actor: session.login,
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Validation failed.',
          detail: { code: 'VALIDATION_FAILED', errors: validationErrors }
        });
        return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
      }

      const repository = getGitHubRepository(env);
      if (isForbiddenProductionContentTarget(repository)) {
        await insertAuditLog(env, {
          action: 'test_direct_publish_failed',
          ...extractRequestMeta(request),
          actor: session.login,
          status_code: 403,
          duration_ms: Date.now() - requestStart,
          error: 'Refusing to write to production content branch from test direct publish.',
          detail: { code: 'PRODUCTION_BRANCH_FORBIDDEN', target_repo: `${repository.owner}/${repository.repo}`, target_branch: repository.baseBranch }
        });
        return createJsonResponse({
          error: 'Refusing to write to production content branch from test direct publish.',
          code: 'PRODUCTION_BRANCH_FORBIDDEN'
        }, { status: 403 });
      }

      const filePath = validationInput.targetPath || validationInput.filePath || `source/_posts/${validationInput.slug}.md`;
      if (!/^source\/_posts\/[^/]+\.md$/i.test(filePath)) {
        return createJsonResponse({
          error: 'Post file path must stay under source/_posts and end with .md.',
          code: 'INVALID_POST_FILE_PATH'
        }, { status: 400 });
      }
      const markdown = buildDraftMarkdownDocument(validationInput);
      const commitMessage = `[test-direct] publish first test post: ${validationInput.title}`;

      try {
        const commitResult = await createDirectMainUpsertCommit(env, {
          branch: repository.baseBranch,
          filePath,
          content: markdown,
          commitMessage
        });

        const publishedAt = nowIso();
        const postUrl = buildHexoPostUrl(validationInput.slug, publishedAt);
        const persisted = await upsertPostIndexRecord(env, {
          id: validationInput.slug,
          slug: validationInput.slug,
          title: validationInput.title,
          path: filePath,
          status: 'published',
          created_at: publishedAt,
          updated_at: publishedAt,
          published_at: publishedAt,
          github_branch: repository.baseBranch,
          github_pr_url: null,
          preview_url: postUrl,
          content: markdown
        });

        await insertAuditLog(env, {
          action: 'test_direct_publish',
          ...extractRequestMeta(request),
          actor: session.login,
          resource: 'post',
          resource_id: validationInput.slug,
          status_code: 200,
          duration_ms: Date.now() - requestStart,
          detail: {
            mode: 'test_direct',
            target_repo: `${repository.owner}/${repository.repo}`,
            target_branch: repository.baseBranch,
            target_path: filePath,
            commit_sha: commitResult.commitSha,
            operation: commitResult.operation
          }
        });
        await waitBeforePagesDeployHook(env);
        const pagesDeploy = await triggerPagesDeployHook(env, {
          reason: 'test_direct_publish',
          commitSha: commitResult.commitSha,
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: filePath
        });

        return createJsonResponse({
          ok: true,
          mode: 'test_direct',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: filePath,
          postUrl,
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          operation: commitResult.operation,
          pagesDeploy,
          persisted,
          message: 'Test direct commit created and Pages rebuild hook was triggered when configured.'
        });
      } catch (err) {
        const statusCode = err.status || 500;

        await insertAuditLog(env, {
          action: 'test_direct_publish_failed',
          ...extractRequestMeta(request),
          actor: session.login,
          status_code: statusCode,
          duration_ms: Date.now() - requestStart,
          error: err.message,
          detail: { code: err.code || 'COMMIT_FAILED' }
        });

        return createJsonResponse({
          error: err.message,
          code: err.code || 'COMMIT_FAILED'
        }, { status: statusCode });
      }
    }

    if (url.pathname === '/api/drafts/direct-publish' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) {
        return createJsonResponse({ error: jsonError }, { status: 400 });
      }

      const publishMode = env.PUBLISH_MODE || 'pr_only';
      const ownerDirectPublishEnabled = String(env.OWNER_DIRECT_PUBLISH_ENABLED || '').toLowerCase() === 'true';

      if (publishMode !== 'owner_direct' || !ownerDirectPublishEnabled) {
        await insertAuditLog(env, {
          action: 'owner_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: 403,
          duration_ms: Date.now() - requestStart,
          error: 'Owner direct publish is disabled.',
          detail: { code: 'OWNER_DIRECT_DISABLED' }
        });
        return createJsonResponse({
          error: 'Owner direct publish is disabled.',
          code: 'OWNER_DIRECT_DISABLED'
        }, { status: 403 });
      }

      const expectedPhrase = env.OWNER_DIRECT_CONFIRMATION_PHRASE || 'DIRECT PUBLISH TO MAIN';
      if (!input.confirmationPhrase || input.confirmationPhrase !== expectedPhrase) {
        await insertAuditLog(env, {
          action: 'owner_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Invalid confirmation phrase.',
          detail: { code: 'INVALID_CONFIRMATION' }
        });
        return createJsonResponse({
          error: 'Invalid confirmation phrase.',
          code: 'INVALID_CONFIRMATION'
        }, { status: 400 });
      }

      const validationErrors = validatePublishInput(input);
      if (validationErrors.length > 0) {
        await insertAuditLog(env, {
          action: 'owner_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Validation failed.',
          detail: { code: 'VALIDATION_FAILED', errors: validationErrors }
        });
        return createJsonResponse({ error: 'Validation failed.', details: validationErrors }, { status: 400 });
      }

      const pathErrors = validateDraftPath(input);
      if (pathErrors.length > 0) {
        await insertAuditLog(env, {
          action: 'owner_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Validation failed.',
          detail: { code: 'PATH_VALIDATION_FAILED', errors: pathErrors }
        });
        return createJsonResponse({ error: 'Validation failed.', details: pathErrors }, { status: 400 });
      }

      if (!input.body || String(input.body).trim().length === 0) {
        return createJsonResponse({ error: 'Validation failed.', details: ['Missing required field: body'] }, { status: 400 });
      }

      if (Array.isArray(input)) {
        return createJsonResponse({ error: 'Validation failed.', details: ['Batch payload is not allowed'] }, { status: 400 });
      }

      const repository = getGitHubRepository(env);
      if (repository.baseBranch !== 'main') {
        await insertAuditLog(env, {
          action: 'owner_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: 400,
          duration_ms: Date.now() - requestStart,
          error: 'Owner direct publish requires GITHUB_BRANCH=main.',
          detail: { code: 'OWNER_DIRECT_MAIN_REQUIRED' }
        });
        return createJsonResponse({
          error: 'Owner direct publish requires GITHUB_BRANCH=main.',
          code: 'OWNER_DIRECT_MAIN_REQUIRED'
        }, { status: 400 });
      }

      const filePath = `source/_posts/${input.slug}.md`;
      const auditId = crypto.randomUUID();
      const markdown = buildDraftMarkdownDocument(input);
      const commitMessage = `[owner-direct] publish post: ${input.title}`;

      try {
        const commitResult = await createDirectMainCommit(env, {
          branch: repository.baseBranch,
          filePath,
          content: markdown,
          commitMessage
        });

        const persisted = await upsertPostIndexRecord(env, {
          id: input.slug,
          slug: input.slug,
          title: input.title,
          path: filePath,
          status: 'published',
          created_at: nowIso(),
          updated_at: nowIso(),
          published_at: nowIso(),
          github_branch: repository.baseBranch,
          github_pr_url: null,
          preview_url: null,
          content: markdown
        });

        await insertAuditLog(env, {
          action: 'owner_direct_publish',
          ...extractRequestMeta(request),
          resource: 'post',
          resource_id: input.slug,
          status_code: 200,
          duration_ms: Date.now() - requestStart,
          detail: {
            mode: 'owner_direct',
            target_repo: `${repository.owner}/${repository.repo}`,
            target_branch: repository.baseBranch,
            target_path: filePath,
            commit_sha: commitResult.commitSha,
            audit_id: auditId
          }
        });

        return createJsonResponse({
          ok: true,
          mode: 'owner_direct',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: filePath,
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          auditId,
          message: 'Direct commit created on main. Cloudflare Pages build may start automatically.'
        });
      } catch (err) {
        const isExistsError = err.message.includes('Target post already exists');
        const statusCode = isExistsError ? 409 : 500;
        
        await insertAuditLog(env, {
          action: 'owner_direct_publish_failed',
          ...extractRequestMeta(request),
          status_code: statusCode,
          duration_ms: Date.now() - requestStart,
          error: err.message,
          detail: { code: isExistsError ? 'TARGET_EXISTS' : 'COMMIT_FAILED' }
        });

        return createJsonResponse({
          error: err.message,
          code: isExistsError ? 'TARGET_EXISTS' : 'COMMIT_FAILED'
        }, { status: statusCode });
      }
    }

    if (url.pathname === '/api/assets/r2-template') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse({
        template: defaultR2UploadTemplate,
        note: 'Stage 3 R2 upload prototype. No real signed upload or bucket write happens here.'
      });
    }

    if (url.pathname === '/api/assets/r2-preview' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const validationError = validateR2UploadInput(input.filename, input.contentType, input.scope, input.postSlug);
      if (validationError) {
        return createJsonResponse({ error: validationError }, { status: 400 });
      }
      const preview = buildR2UploadPreview(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
      });

      return createJsonResponse({
        preview,
        note: 'Stage 3 R2 upload preview only. No object has been written.'
      });
    }

    if (url.pathname === '/api/assets/r2-signed-upload' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const validationError = validateR2UploadInput(input.filename, input.contentType, input.scope, input.postSlug);
      if (validationError) {
        return createJsonResponse({ error: validationError }, { status: 400 });
      }
      const mode = input.mode === 'live' ? 'live' : 'dry-run';
      let preview = buildR2UploadPreview(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
      });
      const testMediaUpload = mode === 'live' && !isLiveWritesEnabled(env) && isTestMediaUploadEnabled(env);
      if (testMediaUpload) {
        preview = applyTestMediaUploadPrefix(preview, env);
      }
      const ttlSeconds = Number(input.ttlSeconds || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds) || defaultR2UploadTemplate.defaults.uploadUrlTtlSeconds;
      const plan = buildR2SignedUploadPlan(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl,
        ttlSeconds
      });

      if (mode !== 'live') {
        return createJsonResponse({
          mode,
          preview,
          plan,
          note: 'Dry-run signed upload plan only. No signed URL has been issued.'
        });
      }

      if (!isLiveWritesEnabled(env) && !testMediaUpload) {
        return rejectLiveWriteDisabled();
      }

      if (!env.ASSETS || typeof env.ASSETS.put !== 'function') {
        return createJsonResponse({
          error: 'ASSETS binding is required for the live signed upload prototype.',
          mode
        }, { status: 503 });
      }

      if (!env.ASSETS_PUBLIC_BASE_URL) {
        return createJsonResponse({
          error: 'ASSETS_PUBLIC_BASE_URL is required for the live signed upload prototype.',
          mode
        }, { status: 503 });
      }

      if (!env.ASSETS_SIGNING_SECRET) {
        return createJsonResponse({
          error: 'ASSETS_SIGNING_SECRET is required for the live signed upload prototype.',
          mode
        }, { status: 503 });
      }

      const uploadBody = buildR2UploadBody(input);
      if (uploadBody.byteLength > 1024 * 1024) {
        return createJsonResponse({
          error: 'Prototype signed uploads are limited to 1 MiB.',
          mode,
          uploaded_bytes: uploadBody.byteLength
        }, { status: 413 });
      }

      const issuedAt = Date.now();
      const expiresAt = issuedAt + ttlSeconds * 1000;
      const token = await signUploadToken(env, {
        objectKey: preview.objectKey,
        contentType: preview.contentType,
        cacheControl: uploadBody.cacheControl,
        filename: preview.filename,
        scope: preview.scope,
        postSlug: preview.postSlug,
        publicUrl: preview.publicUrl,
        testMediaUpload,
        testMediaUploadPrefix: testMediaUpload ? getTestMediaUploadPrefix(env) : null,
        exp: expiresAt
      });
      const uploadUrl = buildSignedUploadUrl(request.url, token);

      return createJsonResponse({
        mode,
        auth_mode: 'hmac',
        preview,
        plan,
        upload_url: uploadUrl,
        upload_method: 'PUT',
        upload_headers: {
          'content-type': preview.contentType,
          'x-xhalo-admin-secret': '<ADMIN_API_SHARED_SECRET>'
        },
        expires_at: new Date(expiresAt).toISOString(),
        uploaded_bytes: uploadBody.byteLength,
        note: testMediaUpload
          ? 'Short-lived test-only signed worker upload URL issued under TEST_MEDIA_UPLOAD_PREFIX. Production R2 live upload remains disabled.'
          : 'Short-lived signed worker upload URL issued. Send x-xhalo-admin-secret with the PUT request. It is not one-time unless a nonce store is added.'
      });
    }

    if (url.pathname.startsWith('/api/assets/r2-upload/') && request.method === 'PUT') {
      const token = decodeURIComponent(url.pathname.slice('/api/assets/r2-upload/'.length));

      if (!env.ASSETS || typeof env.ASSETS.put !== 'function') {
        return createJsonResponse({ error: 'ASSETS binding is required for signed uploads.' }, { status: 503 });
      }

      if (!env.ASSETS_SIGNING_SECRET) {
        return createJsonResponse({ error: 'ASSETS_SIGNING_SECRET is required for signed uploads.' }, { status: 503 });
      }

      let signedPayload;
      try {
        signedPayload = await verifyUploadToken(env, token);
      } catch (error) {
        return createJsonResponse({ error: error.message || 'Invalid upload token.' }, { status: 403 });
      }

      const signedTestMediaUpload = signedPayload.testMediaUpload === true;
      if (!isLiveWritesEnabled(env)) {
        if (!signedTestMediaUpload || !isTestMediaUploadEnabled(env)) {
          return rejectLiveWriteDisabled();
        }
        const requiredPrefix = getTestMediaUploadPrefix(env);
        if (!String(signedPayload.objectKey || '').startsWith(requiredPrefix)) {
          return createJsonResponse({
            error: 'Signed upload object key is outside TEST_MEDIA_UPLOAD_PREFIX.',
            code: 'TEST_MEDIA_UPLOAD_PREFIX_VIOLATION'
          }, { status: 403 });
        }
      }

      if (Date.now() > Number(signedPayload.exp || 0)) {
        return createJsonResponse({ error: 'Upload token has expired.' }, { status: 410 });
      }

      const body = new Uint8Array(await request.arrayBuffer());
      if (body.byteLength > 1024 * 1024) {
        return createJsonResponse({ error: 'Prototype signed uploads are limited to 1 MiB.' }, { status: 413 });
      }

      const requestContentType = request.headers.get('content-type') || '';
      if (signedPayload.contentType && requestContentType && requestContentType !== signedPayload.contentType) {
        return createJsonResponse({ error: 'Content-Type does not match the signed upload intent.' }, { status: 400 });
      }

      const object = await env.ASSETS.put(signedPayload.objectKey, body, {
        httpMetadata: {
          contentType: signedPayload.contentType,
          cacheControl: signedPayload.cacheControl
        },
        customMetadata: {
          scope: signedPayload.scope || 'uploads',
          filename: signedPayload.filename || 'asset',
          ...(signedPayload.postSlug ? { postSlug: signedPayload.postSlug } : {})
        }
      });
      const recordedAt = nowIso();
      const persisted = await insertTaskRecord(env, {
        id: crypto.randomUUID(),
        type: 'r2_upload_signed',
        status: 'completed',
        payload: {
          mode: 'signed-upload',
          objectKey: signedPayload.objectKey,
          publicUrl: signedPayload.publicUrl,
          uploaded_bytes: body.byteLength
        },
        created_at: recordedAt,
        updated_at: recordedAt
      });

      await insertAuditLog(env, {
        action: 'r2_signed_upload',
        ...extractRequestMeta(request),
        resource: 'asset',
        resource_id: signedPayload.objectKey,
        status_code: 201,
        duration_ms: Date.now() - requestStart,
        detail: { uploaded_bytes: body.byteLength }
      });

      return createJsonResponse({
        mode: 'signed-upload',
        public_url: signedPayload.publicUrl,
        object_key: signedPayload.objectKey,
        uploaded_bytes: body.byteLength,
        etag: object?.etag || null,
        version: object?.version || null,
        persisted
      }, { status: 201 });
    }

    if (url.pathname === '/api/assets/r2-upload' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const validationError = validateR2UploadInput(input.filename, input.contentType, input.scope, input.postSlug);
      if (validationError) {
        return createJsonResponse({ error: validationError }, { status: 400 });
      }
      const mode = input.mode === 'live' ? 'live' : 'dry-run';
      const preview = buildR2UploadPreview(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
      });
      const plan = buildR2UploadWritePlan(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
      });

      if (mode !== 'live') {
        return createJsonResponse({
          mode,
          preview,
          plan,
          note: 'Dry-run R2 upload only. No object has been written.'
        });
      }

      if (!isLiveWritesEnabled(env)) {
        return rejectLiveWriteDisabled();
      }

      if (!env.ASSETS || typeof env.ASSETS.put !== 'function') {
        return createJsonResponse({
          error: 'ASSETS binding is required for the live R2 upload prototype.',
          mode
        }, { status: 503 });
      }

      if (!env.ASSETS_PUBLIC_BASE_URL) {
        return createJsonResponse({
          error: 'ASSETS_PUBLIC_BASE_URL is required for the live R2 upload prototype.',
          mode
        }, { status: 503 });
      }

      const uploadBody = buildR2UploadBody(input);
      if (uploadBody.byteLength > 256 * 1024) {
        return createJsonResponse({
          error: 'Prototype uploads are limited to 256 KiB.',
          mode,
          uploaded_bytes: uploadBody.byteLength
        }, { status: 413 });
      }

      const object = await putAssetObject(env, preview, uploadBody);
      const recordedAt = nowIso();
      const persisted = await insertTaskRecord(env, {
        id: crypto.randomUUID(),
        type: 'r2_upload_live',
        status: 'completed',
        payload: {
          mode,
          preview,
          encoding: uploadBody.encoding,
          cacheControl: uploadBody.cacheControl,
          uploaded_bytes: uploadBody.byteLength
        },
        created_at: recordedAt,
        updated_at: recordedAt
      });

      await insertAuditLog(env, {
        action: 'r2_upload',
        ...extractRequestMeta(request),
        resource: 'asset',
        resource_id: preview.objectKey,
        status_code: 200,
        duration_ms: Date.now() - requestStart,
        detail: { mode, uploaded_bytes: uploadBody.byteLength }
      });

      return createJsonResponse({
        mode,
        preview,
        plan,
        uploaded_bytes: uploadBody.byteLength,
        etag: object?.etag || null,
        version: object?.version || null,
        persisted
      });
    }

    if (url.pathname === '/api/assets/r2-tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const prototype = buildR2UploadTaskPrototype(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl,
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run R2 upload task queued. No object has been written.'
      });
    }

    if (url.pathname === '/api/publish/notifications/template') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse({
        template: defaultPublishNotificationTemplate,
        note: 'Stage 3 publish notification prototype. No real downstream notification is sent here.'
      });
    }

    if (url.pathname === '/api/publish/notifications/preview' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const preview = buildPublishNotificationPreview(input, {
        queueBinding: 'TASK_QUEUE'
      });

      return createJsonResponse({
        preview,
        note: 'Stage 3 publish notification preview only. No downstream notification has been sent.'
      });
    }

    if (url.pathname === '/api/publish/notifications/tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const prototype = buildPublishNotificationTaskPrototype(input, {
        queueBinding: 'TASK_QUEUE',
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run publish notification task queued. No downstream notification has been sent.'
      });
    }

    if (url.pathname === '/api/moderation/template') {
      if (method !== 'GET') return createJsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      return createJsonResponse({
        template: defaultModerationTemplate,
        note: 'Stage 3 moderation prototype. No real comment provider write happens here.'
      });
    }

    if (url.pathname === '/api/moderation/preview' && request.method === 'POST') {
      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const preview = buildModerationPreview(input, {
        queueBinding: 'TASK_QUEUE'
      });

      return createJsonResponse({
        preview,
        note: 'Stage 3 moderation preview only. No real comment has been updated.'
      });
    }

    if (url.pathname === '/api/moderation/tasks' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const { input, error: jsonError } = await readJsonBody(request);
      if (jsonError) return createJsonResponse({ error: jsonError }, { status: 400 });
      const prototype = buildModerationTaskPrototype(input, {
        queueBinding: 'TASK_QUEUE',
        stage: '3-prototype'
      });

      await env.TASK_QUEUE.send(prototype.queuedTask);
      const persisted = await insertTaskRecord(env, prototype.taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: prototype.taskRecord.id,
        task_type: prototype.taskRecord.type,
        preview: prototype.preview,
        note: 'Dry-run moderation task queued. No real comment has been updated.'
      });
    }

    if (url.pathname === '/api/tasks/example' && request.method === 'POST') {
      if (!env.TASK_QUEUE) return createJsonResponse({ error: 'TASK_QUEUE is not bound' }, { status: 500 });

      const queuedTask = buildQueueTaskEnvelope({
        type: 'example',
        stage: '3-prototype',
        created_at: nowIso(),
        idempotency_key: crypto.randomUUID()
      });

      const taskRecord = {
        id: queuedTask.idempotency_key || crypto.randomUUID(),
        type: queuedTask.type,
        status: 'queued',
        payload: queuedTask,
        created_at: queuedTask.created_at,
        updated_at: queuedTask.created_at
      };

      await env.TASK_QUEUE.send(queuedTask);
      const persisted = await insertTaskRecord(env, taskRecord);

      return createJsonResponse({
        queued: true,
        persisted,
        task_id: taskRecord.id,
        task_type: taskRecord.type,
        queue_binding: 'TASK_QUEUE'
      });
    }

    // ── Media Asset Manager Routes ──────────────────────────────────────────
    if (url.pathname === '/api/assets/media-preview' && request.method === 'POST') {
      const { input, error: parseError } = await readJsonBody(request);
      if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });

      const validationError = validateMediaUpload({
        filename: input.filename,
        contentType: input.contentType,
        size: input.size || 0,
        storageTarget: input.storageTarget,
        slug: input.slug
      });
      if (validationError) {
        return createJsonResponse({ error: validationError }, { status: 400 });
      }

      const safeFilename = sanitizeFilename(input.filename);
      const targetPath = input.storageTarget === 'git_asset_folder'
        ? `source/_posts/${input.slug}/${safeFilename}`
        : `posts/${input.slug}/${safeFilename}`;

      const markdownSnippet = generateMediaSnippet({
        filename: input.filename,
        contentType: input.contentType,
        storageTarget: input.storageTarget,
        slug: input.slug,
        label: input.label || '',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || 'https://assets.example.com'
      });

      await insertAuditLog(env, {
        action: 'media_preview',
        ...extractRequestMeta(request),
        resource: 'media',
        resource_id: input.slug,
        status_code: 200,
        detail: { filename: safeFilename, storageTarget: input.storageTarget, contentType: input.contentType },
        duration_ms: Date.now() - requestStart
      });

      const isSvg = input.contentType === 'image/svg+xml' || safeFilename.endsWith('.svg');
      return createJsonResponse({
        ok: true,
        mode: 'dry-run',
        asset: {
          slug: input.slug,
          filename: safeFilename,
          contentType: input.contentType,
          storageTarget: input.storageTarget,
          targetPath,
          markdownSnippet,
          highRisk: isSvg ? true : undefined,
          note: isSvg ? 'SVG files are flagged as high-risk and only allowed under dry-run preview constraints.' : undefined
        }
      });
    }

    if (url.pathname === '/api/assets/media-insert-snippet' && request.method === 'POST') {
      const { input, error: parseError } = await readJsonBody(request);
      if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });

      if (!input.filename || !input.contentType || !input.storageTarget || !input.slug) {
        return createJsonResponse({ error: 'Missing required fields: filename, contentType, storageTarget, slug.' }, { status: 400 });
      }

      const snippet = generateMediaSnippet({
        filename: input.filename,
        contentType: input.contentType,
        storageTarget: input.storageTarget,
        slug: input.slug,
        label: input.label || '',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || 'https://assets.example.com'
      });

      return createJsonResponse({ ok: true, markdownSnippet: snippet });
    }

    // ── Site Menu Manager Routes ────────────────────────────────────────────
    if (url.pathname === '/api/site/menu' && request.method === 'GET') {
      try {
        const snapshot = await getRuntimeMenuSnapshot(env);
        return createJsonResponse({
          ok: true,
          source: snapshot.source,
          sourceType: snapshot.sourceType,
          sha: snapshot.sha,
          menu: snapshot.menu,
          socialLinks: snapshot.socialLinks || []
        });
      } catch (err) {
        return createJsonResponse({
          error: `Failed to load menu config: ${err.message}`,
          code: 'CONFIG_FETCH_FAILED'
        }, { status: 500 });
      }
    }

    if (url.pathname === '/api/site/config' && request.method === 'GET') {
      const repository = getGitHubRepository(env);
      const files = [
        '_config.yml',
        '_config.next.yml',
        'themes/next/_config.yml',
        'package.json'
      ];
      const configs = [];
      for (const filePath of files) {
        try {
          const file = await getFileContentFromBranch(env, { branch: repository.baseBranch, filePath });
          configs.push({
            path: filePath,
            sha: file.sha,
            exists: true,
            content: file.raw,
            editable: ['_config.yml', '_config.next.yml', 'themes/next/_config.yml', 'package.json'].includes(filePath)
          });
        } catch (err) {
          configs.push({
            path: filePath,
            exists: false,
            error: err.status === 404 ? 'not_found' : err.message,
            editable: false
          });
        }
      }
      return createJsonResponse({
        ok: true,
        targetRepo: `${repository.owner}/${repository.repo}`,
        targetBranch: repository.baseBranch,
        configs,
        pluginCatalog: buildHexoNextPluginCatalog(),
        note: 'Hexo/NexT configuration snapshot. Editable files can be saved through the guarded test-direct config update endpoint.'
      });
    }

    if (url.pathname === '/api/site/config/test-direct-update' && request.method === 'POST') {
      const session = await verifySessionCookie(request, env);
      const legacySecretOk = hasAdminRequestSecret(env) &&
        request.headers.get('x-xhalo-admin-secret') === env.ADMIN_API_SHARED_SECRET;
      if (!legacySecretOk && (!session || !(session.isAdmin === true || session.role === 'admin'))) {
        await insertAuditLog(env, {
          action: 'test_config_update_failed',
          ...extractRequestMeta(request),
          status_code: 401,
          duration_ms: Date.now() - requestStart,
          error: 'GitHub admin session is required.',
          detail: { code: 'ADMIN_SESSION_REQUIRED' }
        });
        return createJsonResponse({
          error: 'GitHub admin session is required.',
          code: 'ADMIN_SESSION_REQUIRED'
        }, { status: 401 });
      }

      if (!isTestDirectPublishEnabled(env)) {
        await insertAuditLog(env, {
          action: 'test_config_update_failed',
          ...extractRequestMeta(request),
          actor: session?.login || 'legacy-admin-secret',
          status_code: 403,
          duration_ms: Date.now() - requestStart,
          error: 'Test direct config update is disabled.',
          detail: { code: 'TEST_DIRECT_CONFIG_UPDATE_DISABLED' }
        });
        return createJsonResponse({
          error: 'Test direct config update is disabled.',
          code: 'TEST_DIRECT_CONFIG_UPDATE_DISABLED',
          required_env: [
            'DEPLOYMENT_ENV=test',
            'PUBLISH_MODE=test_direct',
            'TEST_DIRECT_PUBLISH_ENABLED=true'
          ]
        }, { status: 403 });
      }

      const repository = getGitHubRepository(env);
      if (isForbiddenProductionContentTarget(repository)) {
        return createJsonResponse({
          error: 'Refusing to write to production content branch from test config update.',
          code: 'PRODUCTION_BRANCH_FORBIDDEN'
        }, { status: 403 });
      }

      const { input, error: parseError } = await readJsonBody(request);
      if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });
      if (!Array.isArray(input.files) || input.files.length < 1) {
        return createJsonResponse({ error: 'Request body must include a non-empty files array.' }, { status: 400 });
      }

      const allowedConfigPaths = new Set(['_config.yml', '_config.next.yml', 'themes/next/_config.yml', 'package.json']);
      const seenPaths = new Set();
      const files = [];

      try {
        for (const file of input.files) {
          const filePath = String(file?.path || file?.filePath || '').trim();
          const content = String(file?.content ?? '');
          if (!allowedConfigPaths.has(filePath)) {
            return createJsonResponse({ error: `Config path is not editable: ${filePath}` }, { status: 400 });
          }
          if (seenPaths.has(filePath)) {
            return createJsonResponse({ error: `Duplicate config path: ${filePath}` }, { status: 400 });
          }
          if (content.length > 250000) {
            return createJsonResponse({ error: `Config file is too large: ${filePath}` }, { status: 413 });
          }
          if (filePath === 'package.json') {
            try {
              JSON.parse(content);
            } catch {
              return createJsonResponse({ error: 'package.json content must be valid JSON.' }, { status: 400 });
            }
          }
          const current = await getFileContentFromBranch(env, { branch: repository.baseBranch, filePath });
          files.push({
            filePath,
            content: content.endsWith('\n') ? content : `${content}\n`,
            baseSha: current.sha
          });
          seenPaths.add(filePath);
        }

        const commitResult = await createDirectMultiFileUpdateCommit(env, {
          branch: repository.baseBranch,
          files,
          commitMessage: '[test-config-update] update Hexo NexT configuration'
        });
        await waitBeforePagesDeployHook(env);
        const pagesDeploy = await triggerPagesDeployHook(env, {
          reason: 'test_config_update',
          commitSha: commitResult.commitSha,
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch
        });

        await insertAuditLog(env, {
          action: 'test_config_update',
          ...extractRequestMeta(request),
          actor: session?.login || 'legacy-admin-secret',
          resource: 'site_config',
          resource_id: Array.from(seenPaths).join(','),
          status_code: 200,
          duration_ms: Date.now() - requestStart,
          detail: {
            target_repo: `${repository.owner}/${repository.repo}`,
            target_branch: repository.baseBranch,
            commitSha: commitResult.commitSha,
            target_paths: Array.from(seenPaths),
            pages_deploy: pagesDeploy
          }
        });

        return createJsonResponse({
          ok: true,
          mode: 'test-direct',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPaths: Array.from(seenPaths),
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          pagesDeploy
        });
      } catch (err) {
        await insertAuditLog(env, {
          action: 'test_config_update_failed',
          ...extractRequestMeta(request),
          actor: session?.login || 'legacy-admin-secret',
          status_code: err.status || 500,
          duration_ms: Date.now() - requestStart,
          error: err.message
        });
        return createJsonResponse({
          error: `Failed to update test config: ${err.message}`,
          code: err.code || 'TEST_CONFIG_UPDATE_FAILED'
        }, { status: err.status || 500 });
      }
    }

    if (url.pathname === '/api/integrations/status' && request.method === 'GET') {
      const repository = getGitHubRepository(env);
      return createJsonResponse({
        ok: true,
        github: {
          owner: repository.owner,
          repo: repository.repo,
          branch: repository.baseBranch,
          tokenConfigured: Boolean(env.GITHUB_TOKEN || (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_INSTALLATION_ID)),
          oauthConfigured: Boolean(env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET),
          safeTestTarget: !isForbiddenProductionContentTarget(repository)
        },
        cloudflare: {
          deploymentEnv: env.DEPLOYMENT_ENV || 'development',
          pagesDeployHookConfigured: Boolean(env.CLOUDFLARE_PAGES_DEPLOY_HOOK_URL || env.PAGES_DEPLOY_HOOK_URL),
          pagesDeployHookDelayMs: Number(env.CLOUDFLARE_PAGES_DEPLOY_HOOK_DELAY_MS || env.PAGES_DEPLOY_HOOK_DELAY_MS || 1500),
          d1Bound: Boolean(env.DB),
          r2Bound: Boolean(env.ASSETS),
          queueBound: Boolean(env.TASK_QUEUE),
          r2LiveWritesEnabled: String(env.LIVE_WRITES_ENABLED || '').toLowerCase() === 'true',
          testMediaUploadEnabled: String(env.TEST_MEDIA_UPLOAD_ENABLED || '').toLowerCase() === 'true'
        },
        writeGates: {
          liveWritesEnabled: isLiveWritesEnabled(env),
          testDirectPublishEnabled: isTestDirectPublishEnabled(env),
          publishMode: env.PUBLISH_MODE || 'pr_only'
        }
      });
    }

    if (url.pathname === '/api/site/menu/preview' && request.method === 'POST') {
      const { input, error: parseError } = await readJsonBody(request);
      if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });

      if (!Array.isArray(input.menu)) {
        return createJsonResponse({ error: 'Request body must include a menu array.' }, { status: 400 });
      }

      const menuError = validateMenuList(input.menu);
      if (menuError) {
        return createJsonResponse({ error: menuError }, { status: 400 });
      }
      if (input.socialLinks !== undefined && !Array.isArray(input.socialLinks)) {
        return createJsonResponse({ error: 'Request body socialLinks must be an array when provided.' }, { status: 400 });
      }
      if (Array.isArray(input.socialLinks)) {
        const socialError = validateSocialLinkList(input.socialLinks);
        if (socialError) {
          return createJsonResponse({ error: socialError }, { status: 400 });
        }
      }

      try {
        const snapshot = await getRuntimeMenuSnapshot(env);
        const socialLinks = Array.isArray(input.socialLinks) ? input.socialLinks : (snapshot.socialLinks || []);
        const oldText = snapshot.sourceType === 'next-runtime'
          ? snapshot.raw
          : JSON.stringify(JSON.parse(snapshot.raw), null, 2);
        let newText = snapshot.sourceType === 'next-runtime'
          ? updateNextThemeConfigWithMenu(snapshot.raw, input.menu)
          : JSON.stringify(updateConfigWithMenu(JSON.parse(snapshot.raw), input.menu), null, 2);
        if (snapshot.sourceType === 'next-runtime') {
          newText = updateNextThemeConfigWithSocialLinks(newText, socialLinks);
        }
        const diff = generateUnifiedDiff(oldText, newText, snapshot.source);

        return createJsonResponse({
          ok: true,
          mode: 'preview',
          source: snapshot.source,
          sourceType: snapshot.sourceType,
          sha: snapshot.sha,
          diff
        });
      } catch (err) {
        return createJsonResponse({
          error: `Failed to generate menu preview: ${err.message}`
        }, { status: 500 });
      }
    }

    if (url.pathname === '/api/site/menu/pr' && request.method === 'POST') {
      return createJsonResponse({
        ok: false,
        mode: 'dry-run',
        message: 'Menu config PR creation is not yet implemented. This endpoint will create a PR with menu changes in a future phase.'
      });
    }

    if (url.pathname === '/api/site/menu/direct-update' && request.method === 'POST') {
      const directConfigEnabled = String(env.OWNER_DIRECT_CONFIG_UPDATE_ENABLED || '').toLowerCase() === 'true';
      if (!directConfigEnabled) {
        return createJsonResponse({
          error: 'Owner direct config update is disabled by default.',
          code: 'DIRECT_CONFIG_DISABLED'
        }, { status: 403 });
      }
      return createJsonResponse({
        ok: false,
        mode: 'dry-run',
        message: 'Direct menu config update is reserved for a future phase.'
      });
    }

    if (url.pathname === '/api/site/menu/test-direct-update' && request.method === 'POST') {
      const session = await verifySessionCookie(request, env);
      const legacySecretOk = hasAdminRequestSecret(env) &&
        request.headers.get('x-xhalo-admin-secret') === env.ADMIN_API_SHARED_SECRET;
      if (!legacySecretOk && (!session || !(session.isAdmin === true || session.role === 'admin'))) {
        await insertAuditLog(env, {
          action: 'test_menu_update_failed',
          ...extractRequestMeta(request),
          status_code: 401,
          duration_ms: Date.now() - requestStart,
          error: 'GitHub admin session is required.',
          detail: { code: 'ADMIN_SESSION_REQUIRED' }
        });
        return createJsonResponse({
          error: 'GitHub admin session is required.',
          code: 'ADMIN_SESSION_REQUIRED'
        }, { status: 401 });
      }

      if (!isTestDirectPublishEnabled(env)) {
        await insertAuditLog(env, {
          action: 'test_menu_update_failed',
          ...extractRequestMeta(request),
          actor: session?.login || 'legacy-admin-secret',
          status_code: 403,
          duration_ms: Date.now() - requestStart,
          error: 'Test direct menu update is disabled.',
          detail: { code: 'TEST_DIRECT_MENU_UPDATE_DISABLED' }
        });
        return createJsonResponse({
          error: 'Test direct menu update is disabled.',
          code: 'TEST_DIRECT_MENU_UPDATE_DISABLED',
          required_env: [
            'DEPLOYMENT_ENV=test',
            'PUBLISH_MODE=test_direct',
            'TEST_DIRECT_PUBLISH_ENABLED=true'
          ]
        }, { status: 403 });
      }

      const repository = getGitHubRepository(env);
      if (isForbiddenProductionContentTarget(repository)) {
        return createJsonResponse({
          error: 'Refusing to write to production content branch from test menu update.',
          code: 'PRODUCTION_BRANCH_FORBIDDEN'
        }, { status: 403 });
      }

      const { input, error: parseError } = await readJsonBody(request);
      if (parseError) return createJsonResponse({ error: parseError }, { status: 400 });
      if (!Array.isArray(input.menu)) {
        return createJsonResponse({ error: 'Request body must include a menu array.' }, { status: 400 });
      }

      const menuError = validateMenuList(input.menu);
      if (menuError) {
        return createJsonResponse({ error: menuError }, { status: 400 });
      }
      if (input.socialLinks !== undefined && !Array.isArray(input.socialLinks)) {
        return createJsonResponse({ error: 'Request body socialLinks must be an array when provided.' }, { status: 400 });
      }
      if (Array.isArray(input.socialLinks)) {
        const socialError = validateSocialLinkList(input.socialLinks);
        if (socialError) {
          return createJsonResponse({ error: socialError }, { status: 400 });
        }
      }

      try {
        const snapshot = await getRuntimeMenuSnapshot(env);
        const socialLinks = Array.isArray(input.socialLinks) ? input.socialLinks : (snapshot.socialLinks || []);
        const configData = await getConfigFromMain(env);
        const oldConfig = JSON.parse(configData.raw);
        const newConfig = updateConfigWithMenu(oldConfig, input.menu);
        const content = `${JSON.stringify(newConfig, null, 2)}\n`;
        const files = [{
          filePath: configData.filename,
          content,
          baseSha: configData.sha
        }];
        const targetPaths = [configData.filename];

        const nextThemeConfigs = await getNextRuntimeMenuConfigsFromMain(env, repository.baseBranch);
        for (const nextThemeConfig of nextThemeConfigs) {
          const nextThemeContent = updateNextThemeConfigWithSocialLinks(
            updateNextThemeConfigWithMenu(nextThemeConfig.raw, input.menu),
            socialLinks
          );
          files.push({
            filePath: nextThemeConfig.filePath,
            content: nextThemeContent,
            baseSha: nextThemeConfig.sha
          });
          targetPaths.push(nextThemeConfig.filePath);
        }

        const commitResult = await createDirectMultiFileUpdateCommit(env, {
          branch: repository.baseBranch,
          files,
          commitMessage: '[test-menu-update] update site menu and NexT runtime menu'
        });
        await waitBeforePagesDeployHook(env);
        const pagesDeploy = await triggerPagesDeployHook(env, {
          reason: 'test_menu_update',
          commitSha: commitResult.commitSha,
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch
        });

        await insertAuditLog(env, {
          action: 'test_menu_update',
          ...extractRequestMeta(request),
          actor: session?.login || 'legacy-admin-secret',
          resource: 'site_menu',
          resource_id: configData.filename,
          status_code: 200,
          duration_ms: Date.now() - requestStart,
          detail: {
            target_repo: `${repository.owner}/${repository.repo}`,
            target_branch: repository.baseBranch,
            commitSha: commitResult.commitSha,
            target_paths: targetPaths,
            social_link_count: socialLinks.length,
            pages_deploy: pagesDeploy
          }
        });

        return createJsonResponse({
          ok: true,
          mode: 'test-direct',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: configData.filename,
          targetPaths,
          commits: targetPaths.map((path) => ({
            path,
            commitSha: commitResult.commitSha,
            commitUrl: commitResult.commitUrl
          })),
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          pagesDeploy
        });
      } catch (err) {
        await insertAuditLog(env, {
          action: 'test_menu_update_failed',
          ...extractRequestMeta(request),
          actor: session?.login || 'legacy-admin-secret',
          status_code: err.status || 500,
          duration_ms: Date.now() - requestStart,
          error: err.message
        });
        return createJsonResponse({
          error: `Failed to update test menu: ${err.message}`,
          code: err.code || 'TEST_MENU_UPDATE_FAILED'
        }, { status: err.status || 500 });
      }
    }

    return createJsonResponse({ error: 'Not found' }, { status: 404 });
    } catch (uncaughtError) {
      const duration = Date.now() - requestStart;
      logError('uncaught_error', {
        ...extractRequestMeta(request),
        error: uncaughtError.message || String(uncaughtError),
        stack: uncaughtError.stack || null,
        duration_ms: duration
      });
      await insertAuditLog(env, {
        action: 'uncaught_error',
        ...extractRequestMeta(request),
        status_code: 500,
        duration_ms: duration,
        error: uncaughtError.message || String(uncaughtError)
      });
      return createJsonResponse({
        error: 'Internal server error.',
        request_id: crypto.randomUUID()
      }, { status: 500 });
    }
}
export default {
  async fetch(request, env) {
    const requestStart = Date.now();
    try {
      // Handle CORS Preflight
      if (request.method === 'OPTIONS') {
        const origin = request.headers.get('Origin');
        if (origin) {
          const preflightResponse = new Response(null, { status: 204 });
          return handleCors(request, preflightResponse, env);
        }
        return new Response(null, { status: 204 });
      }

      const response = await handleRequest(request, env, requestStart);
      return handleCors(request, response, env);
    } catch (uncaughtError) {
      const duration = Date.now() - requestStart;
      logError('uncaught_error', {
        ...extractRequestMeta(request),
        error: uncaughtError.message || String(uncaughtError),
        stack: uncaughtError.stack || null,
        duration_ms: duration
      });
      await insertAuditLog(env, {
        action: 'uncaught_error',
        ...extractRequestMeta(request),
        status_code: 500,
        duration_ms: duration,
        error: uncaughtError.message || String(uncaughtError)
      });
      return createJsonResponse({
        error: 'Internal server error.',
        request_id: crypto.randomUUID()
      }, { status: 500 });
    }
  }
};

