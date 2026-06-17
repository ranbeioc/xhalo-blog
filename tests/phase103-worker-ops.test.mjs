import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../workers/api/src/index.js';

const adminSecret = 'phase103-admin-secret';

function adminHeaders(extra = {}) {
  return { 'x-xhalo-admin-secret': adminSecret, ...extra };
}

async function requestJson(pathname, init = {}, env = {}) {
  const response = await worker.fetch(new Request(`https://example.com${pathname}`, init), {
    ADMIN_API_SHARED_SECRET: adminSecret,
    ...env
  });
  const json = await response.json();
  return { response, json };
}

test('GET /api/blog/stats returns read-only fallback stats', async () => {
  const { response, json } = await requestJson('/api/blog/stats', {
    headers: adminHeaders()
  });

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.sourceOfTruth, 'git');
  assert.ok(json.counts.posts >= 0);
});

test('GET /api/audit-logs/summary returns read-only summary without DB binding', async () => {
  const { response, json } = await requestJson('/api/audit-logs/summary', {
    headers: adminHeaders()
  });

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.backend, 'unavailable');
  assert.equal(json.total, 0);
});

test('POST /api/site/menu/test-direct-update rejects when test direct gate is disabled', async () => {
  const { response, json } = await requestJson('/api/site/menu/test-direct-update', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ menu: [] })
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'TEST_DIRECT_MENU_UPDATE_DISABLED');
});

test('POST admin mutations require Turnstile unless test bypass is explicitly enabled', async () => {
  const blocked = await requestJson('/api/site/menu/test-direct-update', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ menu: [] })
  }, {
    DEPLOYMENT_ENV: 'test',
    TURNSTILE_SECRET_KEY: 'phase103-turnstile-secret'
  });

  assert.equal(blocked.response.status, 403);
  assert.equal(blocked.json.error, 'Turnstile verification failed.');

  const allowedToReachRoute = await requestJson('/api/site/menu/test-direct-update', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ menu: [] })
  }, {
    DEPLOYMENT_ENV: 'test',
    TEST_TURNSTILE_BYPASS_ENABLED: 'true',
    TURNSTILE_SECRET_KEY: 'phase103-turnstile-secret'
  });

  assert.equal(allowedToReachRoute.response.status, 403);
  assert.equal(allowedToReachRoute.json.code, 'TEST_DIRECT_MENU_UPDATE_DISABLED');

  const productionStillBlocked = await requestJson('/api/site/menu/test-direct-update', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ menu: [] })
  }, {
    DEPLOYMENT_ENV: 'production',
    TEST_TURNSTILE_BYPASS_ENABLED: 'true',
    TURNSTILE_SECRET_KEY: 'phase103-turnstile-secret'
  });

  assert.equal(productionStillBlocked.response.status, 403);
  assert.equal(productionStillBlocked.json.error, 'Turnstile verification failed.');
});

test('POST /api/site/menu/test-direct-update writes only to configured safe test target', async () => {
  const calls = [];
  const mockGithubFetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body || '' });
    if (String(url).includes('/contents/rb-blog.config.json') && (init.method || 'GET') === 'GET') {
      return new Response(JSON.stringify({
        sha: 'sha-menu-config',
        content: btoa(JSON.stringify({ menu: [{ name: 'Home', path: '/' }] }))
      }), { status: 200 });
    }
    if (String(url).includes('/contents/rb-blog.config.json') && init.method === 'PUT') {
      const body = JSON.parse(init.body);
      assert.equal(body.branch, 'main');
      assert.equal(body.sha, 'sha-menu-config');
      return new Response(JSON.stringify({ commit: { sha: 'commit-menu-1234567890' } }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };

  const { response, json } = await requestJson('/api/site/menu/test-direct-update', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      baseSha: 'sha-menu-config',
      menu: [{ id: 'home', label: 'Home', path: '/', external: false, visible: true, order: 0 }]
    })
  }, {
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true',
    TEST_TURNSTILE_BYPASS_ENABLED: 'true',
    TURNSTILE_SECRET_KEY: 'phase103-turnstile-secret',
    GITHUB_OWNER: 'ranbeioc',
    GITHUB_REPO: 'xhalo-blog-test',
    GITHUB_BRANCH: 'main',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.targetRepo, 'ranbeioc/xhalo-blog-test');
  assert.equal(json.targetBranch, 'main');
  assert.equal(json.targetPath, 'rb-blog.config.json');
  assert.equal(json.commitSha, 'commit-menu-1234567890');
  assert.ok(calls.some((call) => call.method === 'PUT'));
});

test('POST /api/site/menu/test-direct-update rejects hexo-blog main', async () => {
  const { response, json } = await requestJson('/api/site/menu/test-direct-update', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ menu: [] })
  }, {
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true',
    GITHUB_OWNER: 'ranbeioc',
    GITHUB_REPO: 'hexo-blog',
    GITHUB_BRANCH: 'main'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'PRODUCTION_BRANCH_FORBIDDEN');
});

test('test-only signed media upload requires test env and enforces prefix', async () => {
  const putCalls = [];
  const env = {
    DEPLOYMENT_ENV: 'test',
    TEST_TURNSTILE_BYPASS_ENABLED: 'true',
    TEST_MEDIA_UPLOAD_ENABLED: 'true',
    TEST_MEDIA_UPLOAD_PREFIX: 'xhalo-blog-test/',
    TURNSTILE_SECRET_KEY: 'phase103-turnstile-secret',
    ASSETS_SIGNING_SECRET: 'phase103-signing-secret',
    ASSETS_PUBLIC_BASE_URL: 'https://assets.example.com',
    ASSETS: {
      put: async (key, body, options) => {
        putCalls.push({ key, size: body.byteLength, options });
        return { etag: 'etag-1' };
      }
    }
  };

  const signed = await requestJson('/api/assets/r2-signed-upload', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      mode: 'live',
      filename: 'cover.png',
      contentType: 'image/png',
      scope: 'posts',
      postSlug: 'phase103',
      content: 'preview'
    })
  }, env);

  assert.equal(signed.response.status, 200);
  assert.equal(signed.json.preview.objectKey.startsWith('xhalo-blog-test/'), true);
  assert.equal(signed.json.preview.testMediaUploadPrefix, 'xhalo-blog-test/');

  const uploadPath = new URL(signed.json.upload_url).pathname;
  const uploaded = await requestJson(uploadPath, {
    method: 'PUT',
    headers: adminHeaders({ 'Content-Type': 'image/png' }),
    body: new Uint8Array([1, 2, 3])
  }, env);

  assert.equal(uploaded.response.status, 201);
  assert.equal(uploaded.json.object_key.startsWith('xhalo-blog-test/'), true);
  assert.equal(putCalls.length, 1);
});

test('live signed media upload remains blocked outside test media gate', async () => {
  const { response, json } = await requestJson('/api/assets/r2-signed-upload', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      mode: 'live',
      filename: 'cover.png',
      contentType: 'image/png',
      scope: 'posts',
      postSlug: 'phase103',
      content: 'preview'
    })
  }, {
    DEPLOYMENT_ENV: 'production',
    ASSETS_SIGNING_SECRET: 'phase103-signing-secret',
    ASSETS_PUBLIC_BASE_URL: 'https://assets.example.com',
    ASSETS: { put: async () => ({ etag: 'etag-1' }) }
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'LIVE_WRITES_DISABLED');
});
