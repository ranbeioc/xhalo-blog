import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../workers/api/src/index.js';
import { signSessionPayload, verifySessionCookieValue } from '../packages/core/src/auth-github-oauth.js';

function createAdminDb() {
  const admins = new Map();
  return {
    admins,
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              if (sql.includes('COUNT(*) AS count')) {
                return { count: Array.from(admins.values()).filter((row) => row.role === 'admin').length };
              }
              if (sql.includes('FROM admin_users WHERE lower(login)')) {
                return admins.get(String(params[0]).toLowerCase()) || null;
              }
              return null;
            },
            async all() {
              const row = await this.first();
              return { results: row ? [row] : [] };
            },
            async run() {
              if (sql.includes('INSERT INTO admin_users')) {
                const row = {
                  login: params[0],
                  github_id: params[1],
                  role: params[2],
                  bootstrap_source: params[3],
                  created_at: params[4],
                  updated_at: params[5],
                  last_login_at: params[6]
                };
                admins.set(String(row.login).toLowerCase(), row);
              }
              if (sql.includes('UPDATE admin_users')) {
                const row = admins.get(String(params[2]).toLowerCase());
                if (row) {
                  row.last_login_at = params[0];
                  row.updated_at = params[1];
                }
              }
              return { success: true };
            }
          };
        }
      };
    }
  };
}

async function requestRaw(pathname, init = {}, env = {}) {
  const request = new Request(`https://example.com${pathname}`, init);
  return worker.fetch(request, env);
}

function githubFetchForUser(login) {
  return async (url, init) => {
    if (url.includes('/oauth/access_token')) {
      return new Response(JSON.stringify({ access_token: 'mock-access-token' }), { status: 200 });
    }
    if (url.includes('/user')) {
      assert.equal(init.headers.Authorization, 'Bearer mock-access-token');
      return new Response(JSON.stringify({
        login,
        id: login === 'first-admin' ? 101 : 202,
        avatar_url: `https://avatar.example/${login}`,
        name: login
      }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
}

test('first GitHub OAuth login bootstraps an admin in test environment', async () => {
  const db = createAdminDb();
  const secret = 'session-secret-test-32-chars-long-secret-key-1234';
  const env = {
    DEPLOYMENT_ENV: 'test',
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: secret,
    ADMIN_AUTH_BASE_URL: 'https://admin.example.com',
    GITHUB_FETCH: githubFetchForUser('first-admin'),
    DB: db
  };

  const response = await requestRaw('/auth/github/callback?code=good-code&state=good-state', {
    method: 'GET',
    headers: { Cookie: 'xhalo_oauth_state=good-state' }
  }, env);

  assert.equal(response.status, 302);
  assert.equal(db.admins.get('first-admin').role, 'admin');

  const cookie = response.headers.get('Set-Cookie') || '';
  const token = decodeURIComponent(cookie.match(/xhalo_admin_session=([^;]+)/)[1]);
  const verified = await verifySessionCookieValue(token, secret, '');
  assert.equal(verified.login, 'first-admin');
  assert.equal(verified.role, 'admin');
  assert.equal(verified.isAdmin, true);
});

test('second non-admin GitHub login is not auto-promoted after bootstrap', async () => {
  const db = createAdminDb();
  db.admins.set('first-admin', {
    login: 'first-admin',
    github_id: '101',
    role: 'admin',
    bootstrap_source: 'github_first_login',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString()
  });

  const response = await requestRaw('/auth/github/callback?code=good-code&state=good-state', {
    method: 'GET',
    headers: { Cookie: 'xhalo_oauth_state=good-state' }
  }, {
    DEPLOYMENT_ENV: 'test',
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test-32-chars-long-secret-key-1234',
    ADMIN_AUTH_BASE_URL: 'https://admin.example.com',
    GITHUB_FETCH: githubFetchForUser('second-user'),
    DB: db
  });

  assert.equal(response.status, 403);
  assert.equal(db.admins.has('second-user'), false);
});

test('production environment does not bootstrap first admin unless explicitly enabled', async () => {
  const response = await requestRaw('/auth/github/callback?code=good-code&state=good-state', {
    method: 'GET',
    headers: { Cookie: 'xhalo_oauth_state=good-state' }
  }, {
    DEPLOYMENT_ENV: 'production',
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test-32-chars-long-secret-key-1234',
    ADMIN_AUTH_BASE_URL: 'https://admin.example.com',
    GITHUB_FETCH: githubFetchForUser('prod-first-user'),
    DB: createAdminDb()
  });

  assert.equal(response.status, 403);
});

test('/api/auth/session returns role and isAdmin for signed admin session', async () => {
  const secret = 'session-secret-test-32-chars-long-secret-key-1234';
  const token = await signSessionPayload({
    login: 'first-admin',
    id: 101,
    role: 'admin',
    isAdmin: true,
    expiresAt: Date.now() + 86400000
  }, secret);

  const response = await requestRaw('/api/auth/session', {
    method: 'GET',
    headers: { Cookie: `xhalo_admin_session=${encodeURIComponent(token)}` }
  }, {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: secret,
    GITHUB_OAUTH_ALLOWED_LOGINS: 'someone-else'
  });
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.authenticated, true);
  assert.equal(json.user.role, 'admin');
  assert.equal(json.user.isAdmin, true);
});
