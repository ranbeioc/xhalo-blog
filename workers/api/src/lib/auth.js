import {
  nowIso,
  verifySessionCookie
} from '../../../../packages/core/src/index.js';
import { logError } from './logger.js';

export async function selectRows(env, sql) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return null;
  const result = await env.DB.prepare(sql).all();
  return Array.isArray(result?.results) ? result.results : [];
}

export function isFirstGithubLoginAdminEnabled(env) {
  return env.DEPLOYMENT_ENV === 'test' || String(env.FIRST_GITHUB_LOGIN_ADMIN_ENABLED || '').toLowerCase() === 'true';
}

export function getAllowedGithubLogins(env) {
  return (env.GITHUB_OAUTH_ALLOWED_LOGINS || '')
    .split(',')
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

export async function dbFirst(env, sql, ...params) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return null;
  const prepared = env.DB.prepare(sql).bind(...params);
  if (typeof prepared.first === 'function') return await prepared.first();
  const result = typeof prepared.all === 'function' ? await prepared.all() : null;
  return Array.isArray(result?.results) ? result.results[0] || null : null;
}

export async function dbRun(env, sql, ...params) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return false;
  await env.DB.prepare(sql).bind(...params).run();
  return true;
}

export async function countAdminUsers(env) {
  const row = await dbFirst(env, 'SELECT COUNT(*) AS count FROM admin_users WHERE role = ?', 'admin');
  return Number(row?.count || 0);
}

export async function getAdminUser(env, login) {
  if (!login) return null;
  return dbFirst(env, 'SELECT login, github_id, role, bootstrap_source, created_at, last_login_at FROM admin_users WHERE lower(login) = lower(?)', login);
}

export async function touchAdminLogin(env, login) {
  if (!login) return false;
  return dbRun(env, 'UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE lower(login) = lower(?)', nowIso(), nowIso(), login);
}

export async function createFirstAdminUser(env, ghUser) {
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

export async function resolveGithubAdminIdentity(env, ghUser) {
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

export function hasAdminRequestSecret(env) {
  return Boolean(env.ADMIN_API_SHARED_SECRET);
}

export async function verifyAccessJwt(request, env) {
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

    if (header.alg !== 'RS256') return false;
    if (!header.kid) return false;
    if (typeof payload.exp !== 'number') return false;

    const nowSec = Date.now() / 1000;
    if (nowSec >= payload.exp) return false;

    if (!payload.iss) return false;
    if (env.ACCESS_TEAM_DOMAIN) {
      const expectedIss = `https://${env.ACCESS_TEAM_DOMAIN}.cloudflareaccess.com`;
      if (payload.iss !== expectedIss) return false;
    }

    if (env.ACCESS_AUDIENCE_TAG) {
      if (Array.isArray(payload.aud)) {
        if (!payload.aud.includes(env.ACCESS_AUDIENCE_TAG)) return false;
      } else if (payload.aud !== env.ACCESS_AUDIENCE_TAG) {
        return false;
      }
    }

    if (env.ACCESS_BYPASS_SIGNATURE_FOR_TESTING === 'true') {
      return true;
    }

    const teamDomain = env.ACCESS_TEAM_DOMAIN;
    if (!teamDomain) return false;

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
  } catch {
    return false;
  }
}

export async function verifyAdminRequest(request, env) {
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
  if (!provided || !env.ADMIN_API_SHARED_SECRET) return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(provided);
  const bBuf = encoder.encode(env.ADMIN_API_SHARED_SECRET);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  if (crypto.subtle && crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(aBuf, bBuf);
  let result = 0;
  for (let i = 0; i < aBuf.byteLength; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

export async function verifyTurnstileToken(request, env) {
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

    if (!res.ok) return false;

    const outcome = await res.json();
    return Boolean(outcome.success);
  } catch {
    return false;
  }
}
