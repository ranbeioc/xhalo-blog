import {
  buildProviderReadinessSnapshot,
  createFallbackPosts,
  createJsonResponse,
  getScaffoldMetadata,
  nowIso,
  getGitHubRepository,
  createDirectMultiFileUpdateCommit,
  getFileContentFromBranch,
  listPostFilesFromMain,
  generateUnifiedDiff,
  validateDraftInput,
  verifySessionCookie,
  validateMenuList,
  validateSocialLinkList,
  getConfigFromMain,
  getNextRuntimeMenuConfigsFromMain,
  normalizeMenuFromConfig,
  parseNextThemeMenu,
  parseNextThemeSocialLinks,
  updateConfigWithMenu,
  updateNextThemeConfigWithMenu,
  updateNextThemeConfigWithSocialLinks,
  parseCookies,
  signSessionPayload,
  appendSetCookie
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
  isTestTurnstileBypassEnabled
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
import { guardTestDirectPublish, triggerDeployAfterCommit, enqueueTask } from './lib/routes-shared.js';
import { handleWebhookRoutes } from './routes/webhooks.js';
import { handleTaskRoutes } from './routes/tasks.js';
import { handleAssetRoutes } from './routes/assets.js';
import { handlePostRoutes } from './routes/posts.js';


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
      const cookieHeader = request.headers.get('Cookie') || '';
      const cookies = parseCookies(cookieHeader);
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

    const webhookResponse = await handleWebhookRoutes(request, env, url, method, requestStart, { readJsonBody });
    if (webhookResponse) return webhookResponse;


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

    const context = {
      isTestDirectPublishEnabled,
      isForbiddenProductionContentTarget,
      isLiveWritesEnabled,
      rejectLiveWriteDisabled,
      readJsonBody
    };

    const postResponse = await handlePostRoutes(request, env, url, method, requestStart, context);
    if (postResponse) return postResponse;

    const taskResponse = await handleTaskRoutes(request, env, url, method, requestStart);
    if (taskResponse) return taskResponse;

    const assetResponse = await handleAssetRoutes(request, env, url, method, requestStart, context);
    if (assetResponse) return assetResponse;


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

      const guard = await guardTestDirectPublish(env, request, requestStart, 'config_update', session?.login || 'legacy-admin-secret', { isTestDirectPublishEnabled, isForbiddenProductionContentTarget, getGitHubRepository });
      if (!guard.allowed) return guard.response;
      const repository = guard.repository;

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
        const pagesDeploy = await triggerDeployAfterCommit(env, 'test_config_update', commitResult, repository);

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

      const guard = await guardTestDirectPublish(env, request, requestStart, 'menu_update', session?.login || 'legacy-admin-secret', { isTestDirectPublishEnabled, isForbiddenProductionContentTarget, getGitHubRepository });
      if (!guard.allowed) return guard.response;
      const repository = guard.repository;

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
        const pagesDeploy = await triggerDeployAfterCommit(env, 'test_menu_update', commitResult, repository);

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

