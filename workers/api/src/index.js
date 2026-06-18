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
  getConfigFromMain,
  getNextRuntimeMenuConfigsFromMain,
  normalizeMenuFromConfig,
  parseNextThemeMenu,
  updateConfigWithMenu,
  updateNextThemeConfigWithMenu
} from '../../../packages/core/src/index.js';


const ALLOWED_MIME_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'text/plain': ['.txt']
};

function validateR2UploadInput(filename, contentType, scope, postSlug) {
  if (!contentType || typeof contentType !== 'string') {
    return 'Content-Type is required.';
  }
  const cleanContentType = contentType.trim().toLowerCase();
  const allowedExtensions = ALLOWED_MIME_TYPES[cleanContentType];
  if (!allowedExtensions) {
    return `MIME type '${contentType}' is not allowed.`;
  }

  if (!filename || typeof filename !== 'string') {
    return 'Filename is required.';
  }
  const cleanFilename = filename.trim().toLowerCase();
  
  if (cleanFilename.includes('..') || cleanFilename.includes('/') || cleanFilename.includes('\\')) {
    return 'Filename contains invalid path traversal characters.';
  }

  const hasValidExtension = allowedExtensions.some(ext => cleanFilename.endsWith(ext));
  if (!hasValidExtension) {
    return `Filename extension does not match the Content-Type '${contentType}'.`;
  }

  if (scope && (typeof scope !== 'string' || scope.includes('..') || scope.includes('/') || scope.includes('\\'))) {
    return 'Scope contains invalid path traversal characters.';
  }

  if (postSlug && (typeof postSlug !== 'string' || postSlug.includes('..') || postSlug.includes('/') || postSlug.includes('\\'))) {
    return 'postSlug contains invalid path traversal characters.';
  }

  return null;
}

function buildR2UploadBody(input = {}) {
  const encoding = String(input.encoding || defaultR2UploadTemplate.defaults.encoding).trim().toLowerCase() === 'base64'
    ? 'base64'
    : defaultR2UploadTemplate.defaults.encoding;
  const cacheControl = String(input.cacheControl || defaultR2UploadTemplate.defaults.cacheControl).trim()
    || defaultR2UploadTemplate.defaults.cacheControl;
  const rawContent = input.content == null || String(input.content).length === 0
    ? `Prototype asset written at ${nowIso()}\n`
    : String(input.content);
  const body = encoding === 'base64'
    ? decodeBase64ToBytes(rawContent)
    : new TextEncoder().encode(rawContent);

  return {
    body,
    encoding,
    cacheControl,
    byteLength: body.byteLength
  };
}

function encodeJsonBase64Url(value) {
  return encodeBase64Url(JSON.stringify(value));
}

function decodeBase64UrlToText(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const bytes = decodeBase64ToBytes(padded);
  return new TextDecoder().decode(bytes);
}

function decodeBase64UrlToBytes(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return decodeBase64ToBytes(padded);
}

async function getAssetsSigningKey(env) {
  if (env.__assetsSigningKey) return env.__assetsSigningKey;
  env.__assetsSigningKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(env.ASSETS_SIGNING_SECRET || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return env.__assetsSigningKey;
}

async function signUploadToken(env, payload) {
  const encodedPayload = encodeJsonBase64Url(payload);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      await getAssetsSigningKey(env),
      new TextEncoder().encode(encodedPayload)
    )
  );

  return `${encodedPayload}.${encodeBase64Url(signature)}`;
}

async function verifyUploadToken(env, token) {
  const [encodedPayload, encodedSignature] = String(token || '').split('.');
  if (!encodedPayload || !encodedSignature) throw new Error('Malformed upload token.');
  const signature = decodeBase64UrlToBytes(encodedSignature);
  const verified = await crypto.subtle.verify(
    'HMAC',
    await getAssetsSigningKey(env),
    signature,
    new TextEncoder().encode(encodedPayload)
  );

  if (!verified) throw new Error('Invalid upload token signature.');
  return JSON.parse(decodeBase64UrlToText(encodedPayload));
}


async function selectRows(env, sql) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return null;
  const result = await env.DB.prepare(sql).all();
  return Array.isArray(result?.results) ? result.results : [];
}

function isFirstGithubLoginAdminEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' || String(env.FIRST_GITHUB_LOGIN_ADMIN_ENABLED || '').toLowerCase() === 'true';
}

function getAllowedGithubLogins(env) {
  return (env.GITHUB_OAUTH_ALLOWED_LOGINS || '')
    .split(',')
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

async function dbFirst(env, sql, ...params) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return null;
  const prepared = env.DB.prepare(sql).bind(...params);
  if (typeof prepared.first === 'function') return await prepared.first();
  const result = typeof prepared.all === 'function' ? await prepared.all() : null;
  return Array.isArray(result?.results) ? result.results[0] || null : null;
}

async function dbRun(env, sql, ...params) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;
  await env.DB.prepare(sql).bind(...params).run();
  return true;
}

async function countAdminUsers(env) {
  const row = await dbFirst(env, 'SELECT COUNT(*) AS count FROM admin_users WHERE role = ?', 'admin');
  return Number(row?.count || 0);
}

async function getAdminUser(env, login) {
  if (!login) return null;
  return dbFirst(env, 'SELECT login, github_id, role, bootstrap_source, created_at, last_login_at FROM admin_users WHERE lower(login) = lower(?)', login);
}

async function touchAdminLogin(env, login) {
  if (!login) return false;
  return dbRun(env, 'UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE lower(login) = lower(?)', nowIso(), nowIso(), login);
}

async function createFirstAdminUser(env, ghUser) {
  const timestamp = nowIso();
  await dbRun(
    env,
    `INSERT INTO admin_users (login, github_id, role, bootstrap_source, created_at, updated_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ghUser.login,
    String(ghUser.id || ''),
    'admin',
    'github_first_login',
    timestamp,
    timestamp,
    timestamp
  );
  return getAdminUser(env, ghUser.login);
}

async function resolveGithubAdminIdentity(env, ghUser) {
  const login = ghUser?.login ? String(ghUser.login).trim() : '';
  if (!login) return { allowed: false, role: null, isAdmin: false, source: 'missing_login' };

  const allowedLogins = getAllowedGithubLogins(env);
  const isWhitelisted = allowedLogins.includes(login.toLowerCase());

  let adminUser = null;
  try {
    adminUser = await getAdminUser(env, login);
    if (!adminUser && isFirstGithubLoginAdminEnabled(env) && (await countAdminUsers(env)) === 0) {
      adminUser = await createFirstAdminUser(env, { ...ghUser, login });
    } else if (adminUser) {
      await touchAdminLogin(env, login);
    }
  } catch (err) {
    logError('admin_identity_lookup_failed', { login, error: err.message });
  }

  if (adminUser?.role === 'admin') {
    return { allowed: true, role: 'admin', isAdmin: true, source: adminUser.bootstrap_source || 'd1_admin_users' };
  }

  if (isWhitelisted) {
    return { allowed: true, role: 'admin', isAdmin: true, source: 'github_oauth_allowed_logins' };
  }

  return { allowed: false, role: null, isAdmin: false, source: 'not_authorized' };
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

async function insertTaskRecord(env, task) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  await env.DB.prepare(
    'INSERT INTO tasks (id, type, status, payload, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    task.id,
    task.type,
    task.status,
    JSON.stringify(task.payload),
    null,
    task.created_at,
    task.updated_at
  ).run();

  return true;
}

// ── Structured Logging ──────────────────────────────────────────────────────

function createStructuredLog(level, action, fields = {}) {
  return {
    level,
    action,
    timestamp: nowIso(),
    ...fields
  };
}

function logInfo(action, fields = {}) {
  const entry = createStructuredLog('info', action, fields);
  console.log(JSON.stringify(entry));
  return entry;
}

function logWarn(action, fields = {}) {
  const entry = createStructuredLog('warn', action, fields);
  console.warn(JSON.stringify(entry));
  return entry;
}

function logError(action, fields = {}) {
  const entry = createStructuredLog('error', action, fields);
  console.error(JSON.stringify(entry));
  return entry;
}

function logSecurity(action, fields = {}) {
  return logWarn(action, { ...fields, category: 'security' });
}

// ── Audit Log Persistence ───────────────────────────────────────────────────

async function insertAuditLog(env, entry) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, timestamp, action, actor, resource, resource_id, method, path, status_code, detail, ip, user_agent, duration_ms, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      entry.id || crypto.randomUUID(),
      entry.timestamp || nowIso(),
      entry.action,
      entry.actor || null,
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
    console.error(JSON.stringify(createStructuredLog('error', 'audit_log_write_failed', { error: err.message })));
    return false;
  }
}

function extractRequestMeta(request) {
  return {
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null,
    user_agent: request.headers.get('user-agent') || null,
    method: request.method,
    path: new URL(request.url).pathname
  };
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

async function putAssetObject(env, preview, uploadBody) {
  if (!env.ASSETS || typeof env.ASSETS.put !== 'function') return null;

  return env.ASSETS.put(preview.objectKey, uploadBody.body, {
    httpMetadata: {
      contentType: preview.contentType,
      cacheControl: uploadBody.cacheControl
    },
    customMetadata: {
      scope: preview.scope,
      filename: preview.filename,
      ...(preview.postSlug ? { postSlug: preview.postSlug } : {})
    }
  });
}

function buildSignedUploadUrl(requestUrl, token) {
  const url = new URL(requestUrl);
  url.pathname = `/api/assets/r2-upload/${token}`;
  url.search = '';
  return url.toString();
}

async function updatePostByBranchOrSlug(env, match = {}, patch = {}) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  const matchClauses = [];
  const matchArgs = [];

  if (match.github_branch) {
    matchClauses.push('github_branch = ?');
    matchArgs.push(match.github_branch);
  }

  if (match.slug) {
    matchClauses.push('slug = ?');
    matchArgs.push(match.slug);
  }

  if (matchClauses.length === 0) return false;

  const setClauses = [];
  const setArgs = [];

  if ('status' in patch) {
    setClauses.push('status = ?');
    setArgs.push(patch.status);
  }
  if ('updated_at' in patch) {
    setClauses.push('updated_at = ?');
    setArgs.push(patch.updated_at);
  }
  if ('github_pr_url' in patch) {
    setClauses.push('github_pr_url = ?');
    setArgs.push(patch.github_pr_url);
  }
  if ('published_at' in patch) {
    setClauses.push('published_at = ?');
    setArgs.push(patch.published_at);
  }
  if ('preview_url' in patch) {
    setClauses.push('preview_url = ?');
    setArgs.push(patch.preview_url);
  }
  if ('previewUrl' in patch) {
    setClauses.push('preview_url = ?');
    setArgs.push(patch.previewUrl);
  }

  if (setClauses.length === 0) return false;

  await env.DB.prepare(
    `UPDATE posts_index SET ${setClauses.join(', ')} WHERE ${matchClauses.join(' OR ')}`
  ).bind(...setArgs, ...matchArgs).run();

  return true;
}

function parseJsonSafe(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function summarizeTaskRecord(item) {
  const payload = parseJsonSafe(item.payload) || {};
  const reconciliation = payload.reconciliation || {};
  const summary = reconciliation.summary || {};
  const branch = summary.branch || payload.branch || payload.preview?.branchName || null;
  const lastError = item.error || reconciliation.last_error || null;
  const retryCount = reconciliation.retry_count ?? 0;

  return {
    ...item,
    payload,
    branch,
    last_error: lastError,
    retry_count: retryCount,
    detail_primary: summary.outcome || item.status || 'unknown',
    detail_secondary:
      lastError ||
      summary.pull_request?.url ||
      summary.previewUrl ||
      branch ||
      summary.key ||
      summary.channel ||
      summary.commentId ||
      summary.note ||
      null
  };
}

function summarizePostRecord(item) {
  return {
    ...item,
    detail_primary: item.github_branch || null,
    detail_secondary: item.github_pr_url || null
  };
}

async function getRuntimeMenuSnapshot(env) {
  const repository = getGitHubRepository(env);
  const nextThemeConfigs = await getNextRuntimeMenuConfigsFromMain(env, repository.baseBranch);
  for (const config of nextThemeConfigs) {
    const menu = parseNextThemeMenu(config.raw);
    if (menu.length > 0) {
      return {
        ok: true,
        source: config.filePath,
        sourceType: 'next-runtime',
        sha: config.sha,
        raw: config.raw,
        menu
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
    menu: normalizeMenuFromConfig(config)
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

  if (expected !== signatureHeader) {
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
  if (secret !== env.PREVIEW_WEBHOOK_SECRET) {
    throw new Error('Preview deployment webhook secret mismatch.');
  }
}

function isLiveWritesEnabled(env) {
  return String(env.LIVE_WRITES_ENABLED || '').toLowerCase() === 'true';
}

function isTestMediaUploadEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' &&
    String(env.TEST_MEDIA_UPLOAD_ENABLED || '').toLowerCase() === 'true';
}

function isTestTurnstileBypassEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' &&
    String(env.TEST_TURNSTILE_BYPASS_ENABLED || '').toLowerCase() === 'true';
}

function getTestMediaUploadPrefix(env) {
  const rawPrefix = String(env.TEST_MEDIA_UPLOAD_PREFIX || 'xhalo-blog-test/').trim();
  const safePrefix = rawPrefix.replace(/^\/+/, '').replace(/\.\./g, '').replace(/\/+$/, '');
  return safePrefix ? `${safePrefix}/` : 'xhalo-blog-test/';
}

function applyTestMediaUploadPrefix(preview, env) {
  const prefix = getTestMediaUploadPrefix(env);
  if (preview.objectKey.startsWith(prefix)) return preview;
  const objectKey = `${prefix}${preview.objectKey}`;
  const publicBaseUrl = String(env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl).replace(/\/$/, '');
  return {
    ...preview,
    objectKey,
    publicUrl: `${publicBaseUrl}/${objectKey}`,
    testMediaUploadPrefix: prefix
  };
}

function rejectLiveWriteDisabled() {
  return createJsonResponse({
    error: 'Live writes are disabled.',
    code: 'LIVE_WRITES_DISABLED',
    required_env: 'LIVE_WRITES_ENABLED=true'
  }, { status: 403 });
}

function hasAdminRequestSecret(env) {
  return Boolean(env.ADMIN_API_SHARED_SECRET);
}

async function verifyAccessJwt(request, env) {
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const base64UrlDecode = (str) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return atob(base64);
    };

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    // 1. Verify algorithm — MUST be RS256
    if (header.alg !== 'RS256') {
      return false;
    }

    // 2. Verify kid — MUST exist in header
    if (!header.kid) {
      return false;
    }

    // 3. Verify expiration — MUST exist and not be expired
    if (typeof payload.exp !== 'number') {
      return false;
    }
    const nowSec = Date.now() / 1000;
    if (nowSec >= payload.exp) {
      return false;
    }

    // 4. Verify issuer — MUST exist and match expected format
    if (!payload.iss) {
      return false;
    }
    if (env.ACCESS_TEAM_DOMAIN) {
      const expectedIss = `https://${env.ACCESS_TEAM_DOMAIN}.cloudflareaccess.com`;
      if (payload.iss !== expectedIss) {
        return false;
      }
    }

    // 5. Verify audience — MUST match; supports both string and array
    if (env.ACCESS_AUDIENCE_TAG) {
      if (Array.isArray(payload.aud)) {
        if (!payload.aud.includes(env.ACCESS_AUDIENCE_TAG)) {
          return false;
        }
      } else if (payload.aud !== env.ACCESS_AUDIENCE_TAG) {
        return false;
      }
    }

    // 6. Verify signature (bypass available for testing only)
    if (env.ACCESS_BYPASS_SIGNATURE_FOR_TESTING === 'true') {
      return true;
    }

    const teamDomain = env.ACCESS_TEAM_DOMAIN;
    if (!teamDomain) {
      return false;
    }

    const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
    const fetchFn = env.ACCESS_FETCH || fetch;
    const res = await fetchFn(certsUrl);
    if (!res.ok) return false;

    const jwks = await res.json();
    if (!jwks.keys || !Array.isArray(jwks.keys)) return false;

    const jwk = jwks.keys.find(key => key.kid === header.kid);
    if (!jwk) return false;

    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(parts[0] + '.' + parts[1]);
    const signatureBytes = new Uint8Array(
      Array.from(base64UrlDecode(parts[2]), c => c.charCodeAt(0))
    );

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      data
    );
  } catch (error) {
    return false;
  }
}

async function verifyAdminRequest(request, env) {
  if (request.headers.has('cf-access-jwt-assertion')) {
    const isJwtValid = await verifyAccessJwt(request, env);
    if (isJwtValid) return true;
  }

  const isOAuthConfigured = Boolean(env.GITHUB_OAUTH_CLIENT_ID) && Boolean(env.GITHUB_OAUTH_CLIENT_SECRET) && Boolean(env.ADMIN_SESSION_SECRET);
  if (isOAuthConfigured) {
    const session = await verifySessionCookie(request, env);
    if (session) return true;
  }

  if (!hasAdminRequestSecret(env)) return false;
  const provided = request.headers.get('x-xhalo-admin-secret') || '';
  return Boolean(provided) && provided === env.ADMIN_API_SHARED_SECRET;
}

async function verifyTurnstileToken(request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  const token = request.headers.get('x-xhalo-turnstile-token') || request.headers.get('cf-turnstile-token');
  if (!token) {
    return false;
  }

  const fetchFn = env.TURNSTILE_FETCH || fetch;
  try {
    const ip = request.headers.get('cf-connecting-ip') || '';
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    });

    const res = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: body.toString(),
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    });

    if (!res.ok) {
      return false;
    }

    const outcome = await res.json();
    return Boolean(outcome.success);
  } catch (error) {
    return false;
  }
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
  if (pathname.startsWith('/api/posts') || pathname === '/api/readiness' || pathname === '/api/tasks' || pathname === '/api/tasks/example' || pathname === '/api/audit-logs' || pathname === '/api/audit-logs/summary' || pathname === '/api/blog/stats' || pathname.startsWith('/api/tasks/')) {
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

    if (url.pathname === '/api/health') {
      return createJsonResponse({ ok: true, service: 'xhalo-blog-api', stage: '3-prototype', mode: 'scaffold' });
    }

    if (url.pathname === '/api/scaffold') {
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

      const payload = await request.json();
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
      return createJsonResponse(buildProviderReadinessSnapshot(env));
    }

    if (url.pathname === '/api/posts') {
      const requestedLimit = Math.max(1, Math.min(Number(url.searchParams.get('limit')) || 100, 200));
      try {
        const gitItems = await listPostFilesFromMain(env, { branch: getGitHubRepository(env).baseBranch, limit: requestedLimit });
        if (gitItems.length > 0) {
          return createJsonResponse({
            items: gitItems.map(summarizePostRecord),
            backend: 'github',
            source_of_truth: 'git',
            count: gitItems.length,
            note: 'GitHub source/_posts listing from the configured test repository.'
          });
        }
      } catch (err) {
        logWarn('posts_git_listing_failed', { error: err.message, status: err.status || null });
      }

      const items = await selectRows(
        env,
        'SELECT id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, preview_url, content FROM posts_index ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 100'
      );

      const d1Items = Array.isArray(items) && items.length > 0 ? items : null;
      return createJsonResponse({
        items: d1Items ? d1Items.map(summarizePostRecord) : createFallbackPosts().map(summarizePostRecord),
        backend: d1Items ? 'd1' : 'fallback',
        source_of_truth: 'git',
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
        const postData = await getPostFileFromMain(env, { slug });
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
        const postData = await getPostFileFromMain(env, { slug: input.slug });
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
          const existingPost = await getPostFileFromMain(env, { slug: input.slug });
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

    if (url.pathname.startsWith('/api/tasks/')) {
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
      const fallbackPosts = createFallbackPosts();
      const postsRows = await selectRows(env, 'SELECT status FROM posts_index LIMIT 10000');
      const taskRows = await selectRows(env, 'SELECT status, type FROM tasks LIMIT 10000');
      const auditRows = await selectRows(env, 'SELECT status_code, resource FROM audit_logs LIMIT 10000');
      const posts = postsRows || fallbackPosts;
      const tasks = taskRows || [];
      const audit = auditRows || [];
      const mediaAssets = audit.filter((item) => item.resource === 'asset' || item.resource === 'media').length;

      return createJsonResponse({
        ok: true,
        backend: postsRows ? 'd1' : 'fallback',
        sourceOfTruth: 'git',
        generatedAt: nowIso(),
        target: getGitHubRepository(env),
        counts: {
          posts: posts.length,
          publishedPosts: posts.filter((item) => item.status === 'published').length,
          draftPosts: posts.filter((item) => item.status === 'draft').length,
          tasks: tasks.length,
          mediaAssets,
          auditEvents: audit.length
        },
        note: 'Read-only blog statistics summary.'
      });
    }

    if (url.pathname === '/api/drafts/template') {
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

      const filePath = `source/_posts/${validationInput.slug}.md`;
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
          preview_url: `/posts/${validationInput.slug}/`,
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

        return createJsonResponse({
          ok: true,
          mode: 'test_direct',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: filePath,
          postUrl: `/posts/${validationInput.slug}/`,
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          operation: commitResult.operation,
          persisted,
          message: 'Test direct commit created. Cloudflare Pages rebuild should be verified before production approval.'
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
      return createJsonResponse({
        template: defaultR2UploadTemplate,
        note: 'Stage 3 R2 upload prototype. No real signed upload or bucket write happens here.'
      });
    }

    if (url.pathname === '/api/assets/r2-preview' && request.method === 'POST') {
      const input = await request.json();
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
      const input = await request.json();
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
      const input = await request.json();
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

      const input = await request.json();
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
      return createJsonResponse({
        template: defaultPublishNotificationTemplate,
        note: 'Stage 3 publish notification prototype. No real downstream notification is sent here.'
      });
    }

    if (url.pathname === '/api/publish/notifications/preview' && request.method === 'POST') {
      const input = await request.json();
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

      const input = await request.json();
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
      return createJsonResponse({
        template: defaultModerationTemplate,
        note: 'Stage 3 moderation prototype. No real comment provider write happens here.'
      });
    }

    if (url.pathname === '/api/moderation/preview' && request.method === 'POST') {
      const input = await request.json();
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

      const input = await request.json();
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
          menu: snapshot.menu
        });
      } catch (err) {
        return createJsonResponse({
          error: `Failed to load menu config: ${err.message}`,
          code: 'CONFIG_FETCH_FAILED'
        }, { status: 500 });
      }
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

      try {
        const snapshot = await getRuntimeMenuSnapshot(env);
        const oldText = snapshot.sourceType === 'next-runtime'
          ? snapshot.raw
          : JSON.stringify(JSON.parse(snapshot.raw), null, 2);
        const newText = snapshot.sourceType === 'next-runtime'
          ? updateNextThemeConfigWithMenu(snapshot.raw, input.menu)
          : JSON.stringify(updateConfigWithMenu(JSON.parse(snapshot.raw), input.menu), null, 2);
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

      try {
        const configData = await getConfigFromMain(env);
        const oldConfig = JSON.parse(configData.raw);
        const newConfig = updateConfigWithMenu(oldConfig, input.menu);
        const content = `${JSON.stringify(newConfig, null, 2)}\n`;
        const configCommitResult = await createDirectMainUpdateCommit(env, {
          branch: repository.baseBranch,
          filePath: configData.filename,
          content,
          baseSha: configData.sha,
          commitMessage: '[test-menu-update] update site menu'
        });
        const targetPaths = [configData.filename];
        const commits = [{
          path: configData.filename,
          commitSha: configCommitResult.commitSha,
          commitUrl: configCommitResult.commitUrl
        }];

        const nextThemeConfigs = await getNextRuntimeMenuConfigsFromMain(env, repository.baseBranch);
        for (const nextThemeConfig of nextThemeConfigs) {
          const nextThemeContent = updateNextThemeConfigWithMenu(nextThemeConfig.raw, input.menu);
          const nextCommitResult = await createDirectMainUpdateCommit(env, {
            branch: repository.baseBranch,
            filePath: nextThemeConfig.filePath,
            content: nextThemeContent,
            baseSha: nextThemeConfig.sha,
            commitMessage: '[test-menu-update] sync NexT theme menu'
          });
          targetPaths.push(nextThemeConfig.filePath);
          commits.push({
            path: nextThemeConfig.filePath,
            commitSha: nextCommitResult.commitSha,
            commitUrl: nextCommitResult.commitUrl
          });
        }

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
            commitSha: configCommitResult.commitSha,
            target_paths: targetPaths
          }
        });

        return createJsonResponse({
          ok: true,
          mode: 'test-direct',
          targetRepo: `${repository.owner}/${repository.repo}`,
          targetBranch: repository.baseBranch,
          targetPath: configData.filename,
          targetPaths,
          commits,
          commitSha: configCommitResult.commitSha,
          commitUrl: configCommitResult.commitUrl
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

function handleCors(request, response, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return response;

  const allowedOrigins = [];
  if (env.ADMIN_FRONTEND_BASE_URL) {
    allowedOrigins.push(env.ADMIN_FRONTEND_BASE_URL.replace(/\/$/, ''));
  }
  // Allow localhost for local development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    allowedOrigins.push(origin);
  }
  if (env.ADMIN_AUTH_BASE_URL) {
    allowedOrigins.push(env.ADMIN_AUTH_BASE_URL.replace(/\/$/, ''));
  }

  const isAllowed = allowedOrigins.includes(origin);
  if (isAllowed) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-xhalo-admin-secret, x-xhalo-turnstile-token, cf-turnstile-token, cf-access-jwt-assertion');
    newHeaders.set('Vary', 'Origin');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
  return response;
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
