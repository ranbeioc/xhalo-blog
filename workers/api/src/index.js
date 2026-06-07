import {
  buildProviderReadinessSnapshot,
  buildDraftMarkdownDocument,
  buildDraftTaskPrototype,
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
  defaultModerationTemplate,
  defaultPublishNotificationTemplate,
  defaultR2UploadTemplate,
  createFallbackPosts,
  createFallbackTasks,
  createJsonResponse,
  getScaffoldMetadata,
  nowIso
} from '../../../packages/core/src/index.js';

function getGitHubFetch(env) {
  return env.GITHUB_FETCH || fetch;
}

function getGitHubRepository(env) {
  return {
    owner: env.GITHUB_OWNER || 'example',
    repo: env.GITHUB_REPO || 'xhalo-blog',
    baseBranch: env.GITHUB_BRANCH || 'main'
  };
}

function hasGitHubAppConfig(env) {
  return Boolean(env.GITHUB_APP_ID) && Boolean(env.GITHUB_APP_PRIVATE_KEY) && Boolean(env.GITHUB_INSTALLATION_ID);
}

function encodeBase64Utf8(input) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

function decodeBase64ToBytes(input) {
  const normalized = String(input || '').replace(/\s+/g, '');
  if (typeof atob === 'function') {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(normalized, 'base64'));
}

function encodeBase64Url(input) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');

  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeDerLength(length) {
  if (length < 0x80) return Uint8Array.of(length);
  const bytes = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

function encodeDerSequence(...parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  return Uint8Array.from([0x30, ...encodeDerLength(totalLength), ...parts.flatMap((part) => Array.from(part))]);
}

function encodeDerIntegerZero() {
  return Uint8Array.of(0x02, 0x01, 0x00);
}

function encodeDerNull() {
  return Uint8Array.of(0x05, 0x00);
}

function encodeDerOidRsaEncryption() {
  return Uint8Array.of(0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01);
}

function encodeDerOctetString(bytes) {
  return Uint8Array.from([0x04, ...encodeDerLength(bytes.byteLength), ...bytes]);
}

function wrapPkcs1PrivateKey(pkcs1Bytes) {
  const algorithmIdentifier = encodeDerSequence(
    encodeDerOidRsaEncryption(),
    encodeDerNull()
  );
  return encodeDerSequence(
    encodeDerIntegerZero(),
    algorithmIdentifier,
    encodeDerOctetString(pkcs1Bytes)
  );
}

function parsePemPrivateKey(pem) {
  const normalized = String(pem || '').replace(/\\n/g, '\n').trim();
  const isPkcs1 = normalized.includes('-----BEGIN RSA PRIVATE KEY-----');
  const base64 = normalized
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const derBytes = decodeBase64ToBytes(base64);

  return isPkcs1 ? wrapPkcs1PrivateKey(derBytes) : derBytes;
}

async function createGitHubAppJwt(env) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: env.GITHUB_APP_ID
  };
  const signingInput = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    parsePemPrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signingInput)
    )
  );

  return `${signingInput}.${encodeBase64Url(signature)}`;
}

async function getGitHubAuthorization(env) {
  if (env.__githubAuthorization) return env.__githubAuthorization;

  if (hasGitHubAppConfig(env)) {
    const appJwt = await createGitHubAppJwt(env);
    const response = await getGitHubFetch(env)(`https://api.github.com/app/installations/${encodeURIComponent(env.GITHUB_INSTALLATION_ID)}/access_tokens`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${appJwt}`,
        'x-github-api-version': '2022-11-28'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`GitHub App token ${response.status}: ${text}`);
      error.status = response.status;
      throw error;
    }

    const tokenPayload = await response.json();
    env.__githubAuthorization = {
      mode: 'app',
      header: `Bearer ${tokenPayload.token}`
    };
    return env.__githubAuthorization;
  }

  if (env.GITHUB_TOKEN) {
    env.__githubAuthorization = {
      mode: 'token',
      header: `Bearer ${env.GITHUB_TOKEN}`
    };
    return env.__githubAuthorization;
  }

  return {
    mode: 'none',
    header: null
  };
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

async function githubApiRequest(env, path, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('accept', 'application/vnd.github+json');
  headers.set('x-github-api-version', '2022-11-28');
  const authorization = await getGitHubAuthorization(env);
  if (authorization.header) headers.set('authorization', authorization.header);

  const response = await getGitHubFetch(env)(`https://api.github.com${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub API ${response.status}: ${text}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getBranchHeadSha(env, branchName) {
  const { owner, repo } = getGitHubRepository(env);
  const result = await githubApiRequest(env, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`);
  return result.object.sha;
}

async function createBranchIfMissing(env, branchName, baseSha) {
  const { owner, repo } = getGitHubRepository(env);

  try {
    await githubApiRequest(env, `/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      })
    });
    return { created: true };
  } catch (error) {
    if (error.status === 422) return { created: false };
    throw error;
  }
}

async function createDraftFileCommit(env, filePath, branchName, content, commitMessage) {
  const { owner, repo } = getGitHubRepository(env);
  return githubApiRequest(env, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: encodeBase64Utf8(content),
      branch: branchName
    })
  });
}

async function createPullRequest(env, preview) {
  const { owner, repo } = getGitHubRepository(env);
  return githubApiRequest(env, `/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: preview.pullRequestTitle,
      head: preview.branchName,
      base: preview.baseBranch,
      body: `Generated by xhalo-blog live draft publish prototype for \`${preview.filePath}\`.`
    })
  });
}

async function selectRows(env, sql) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return null;
  const result = await env.DB.prepare(sql).all();
  return Array.isArray(result?.results) ? result.results : [];
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

async function upsertPostIndexRecord(env, record) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;

  await env.DB.prepare(
    `INSERT OR REPLACE INTO posts_index
    (id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
  const summary = payload.reconciliation?.summary || {};
  return {
    ...item,
    payload,
    detail_primary: summary.outcome || item.status || 'unknown',
    detail_secondary:
      payload.reconciliation?.last_error ||
      summary.previewUrl ||
      summary.branch ||
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

function rejectLiveWriteDisabled() {
  return createJsonResponse({
    error: 'Live writes are disabled by default.',
    required_env: 'LIVE_WRITES_ENABLED=true',
    note: 'Enable only behind Cloudflare Access and application-level request verification.'
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

function rejectUnauthorized() {
  return createJsonResponse({
    error: 'Unauthorized admin API request.',
    note: 'Protect this route with Cloudflare Access and an application-level admin secret before production use.'
  }, { status: 401 });
}

function isProtectedAdminRoute(pathname) {
  if (pathname === '/api/readiness' || pathname === '/api/posts' || pathname === '/api/tasks' || pathname === '/api/tasks/example') {
    return true;
  }

  return [
    '/api/drafts/',
    '/api/assets/',
    '/api/publish/',
    '/api/moderation/'
  ].some((prefix) => pathname.startsWith(prefix));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return createJsonResponse({ ok: true, service: 'xhalo-blog-api', stage: '3-prototype', mode: 'scaffold' });
    }

    if (url.pathname === '/api/scaffold') {
      return createJsonResponse(getScaffoldMetadata());
    }

    if (url.pathname === '/webhooks/github' && request.method === 'POST') {
      const rawBody = await request.text();

      try {
        await verifyGithubWebhookSignature(env, request, rawBody);
      } catch (error) {
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
        return rejectUnauthorized();
      }
      if (request.method === 'POST' || request.method === 'PUT') {
        const isTurnstileValid = await verifyTurnstileToken(request, env);
        if (!isTurnstileValid) {
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
      const items = await selectRows(
        env,
        'SELECT id, slug, title, path, status, created_at, updated_at, published_at, github_branch, github_pr_url, content FROM posts_index ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 10'
      );

      return createJsonResponse({
        items: items ? items.map(summarizePostRecord) : createFallbackPosts().map(summarizePostRecord),
        backend: items ? 'd1' : 'fallback',
        source_of_truth: 'git',
        note: items ? 'Read-only posts_index prototype.' : 'D1 posts_index integration pending; showing fallback examples.'
      });
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

    if (url.pathname === '/api/drafts/template') {
      return createJsonResponse({
        template: defaultDraftTemplate,
        note: 'Stage 3 draft metadata prototype. No real GitHub write happens here.'
      });
    }

    if (url.pathname === '/api/drafts/preview' && request.method === 'POST') {
      const input = await request.json();
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

      const input = await request.json();
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
      const input = await request.json();
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
      const input = await request.json();
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

      const markdown = buildDraftMarkdownDocument(input);
      let pullRequest = null;
      let branchResult = { created: false };
      let commitResult = null;
      let authMode = 'd1';

      const hasGitHub = hasGitHubAppConfig(env) || Boolean(env.GITHUB_TOKEN);
      const useGitHub = hasGitHub && input.publish_target !== 'd1';

      if (useGitHub) {
        const authorization = await getGitHubAuthorization(env);
        if (!authorization.header) {
          return createJsonResponse({
            error: 'GitHub App env or GITHUB_TOKEN is required for the live draft publish prototype.',
            mode
          }, { status: 503 });
        }
        authMode = authorization.mode;
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
      }

      const persisted = await upsertPostIndexRecord(env, {
        id: preview.draft.slug,
        slug: preview.draft.slug,
        title: preview.draft.title || preview.draft.slug,
        path: preview.filePath,
        status: preview.draft.status || 'draft',
        created_at: nowIso(),
        updated_at: nowIso(),
        github_branch: pullRequest ? preview.branchName : null,
        github_pr_url: pullRequest ? pullRequest.html_url : null,
        content: markdown
      });

      return createJsonResponse({
        mode,
        auth_mode: authMode,
        preview,
        plan,
        branch_created: branchResult.created,
        content_path: commitResult?.content?.path || preview.filePath,
        commit_sha: commitResult?.commit?.sha || null,
        pull_request: pullRequest ? {
          number: pullRequest.number,
          url: pullRequest.html_url
        } : null,
        persisted
      });
    }

    if (url.pathname === '/api/assets/r2-template') {
      return createJsonResponse({
        template: defaultR2UploadTemplate,
        note: 'Stage 3 R2 upload prototype. No real signed upload or bucket write happens here.'
      });
    }

    if (url.pathname === '/api/assets/r2-preview' && request.method === 'POST') {
      const input = await request.json();
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
      const mode = input.mode === 'live' ? 'live' : 'dry-run';
      const preview = buildR2UploadPreview(input, {
        bucketBinding: 'ASSETS',
        bucketName: 'xhalo-blog-assets',
        publicBaseUrl: env.ASSETS_PUBLIC_BASE_URL || defaultR2UploadTemplate.publicBaseUrl
      });
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

      if (!isLiveWritesEnabled(env)) {
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
        note: 'Short-lived signed worker upload URL issued. Send x-xhalo-admin-secret with the PUT request. It is not one-time unless a nonce store is added.'
      });
    }

    if (url.pathname.startsWith('/api/assets/r2-upload/') && request.method === 'PUT') {
      const token = decodeURIComponent(url.pathname.slice('/api/assets/r2-upload/'.length));

      if (!isLiveWritesEnabled(env)) {
        return rejectLiveWriteDisabled();
      }

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

    return createJsonResponse({ error: 'Not found' }, { status: 404 });
  }
};
