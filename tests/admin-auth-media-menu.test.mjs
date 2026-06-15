import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../workers/api/src/index.js';

const adminSecret = 'test-admin-secret';

async function requestJson(pathname, init = {}, env = {}) {
  const request = new Request(`https://example.com${pathname}`, init);
  const response = await worker.fetch(request, env);
  const json = await response.json();
  return { response, json };
}

async function requestRaw(pathname, init = {}, env = {}) {
  const request = new Request(`https://example.com${pathname}`, init);
  const response = await worker.fetch(request, env);
  return response;
}

function adminHeaders() {
  return { 'x-xhalo-admin-secret': adminSecret };
}

// ── OAuth Tests ─────────────────────────────────────────────────────────────

test('GET /auth/github/start returns 400 when OAuth not configured', async () => {
  const res = await requestRaw('/auth/github/start', { method: 'GET' }, {});
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.match(json.error, /OAuth is not configured/);
});

test('GET /auth/github/start returns 302 redirect when OAuth configured', async () => {
  const env = {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test',
    ADMIN_AUTH_BASE_URL: 'https://admin.example.com'
  };
  const res = await requestRaw('/auth/github/start', { method: 'GET' }, env);
  assert.equal(res.status, 302);
  const location = res.headers.get('Location');
  assert.ok(location.startsWith('https://github.com/login/oauth/authorize'));
  assert.ok(location.includes('client_id=test-client-id'));
  const setCookie = res.headers.get('Set-Cookie');
  assert.ok(setCookie.includes('xhalo_oauth_state='));
});

test('GET /auth/github/callback returns 400 when OAuth not configured', async () => {
  const res = await requestRaw('/auth/github/callback?code=abc&state=xyz', { method: 'GET' }, {});
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.match(json.error, /OAuth is not configured/);
});

test('GET /auth/github/callback returns 400 without code/state', async () => {
  const env = {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test'
  };
  const res = await requestRaw('/auth/github/callback', { method: 'GET' }, env);
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.match(json.error, /Missing code or state/);
});

test('GET /auth/github/callback returns 403 on state mismatch', async () => {
  const env = {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test'
  };
  // State in cookie doesn't match state in query
  const res = await requestRaw('/auth/github/callback?code=abc&state=bad-state', {
    method: 'GET',
    headers: { 'Cookie': 'xhalo_oauth_state=good-state' }
  }, env);
  const json = await res.json();
  assert.equal(res.status, 403);
  assert.match(json.error, /Invalid OAuth state/);
});

test('GET /api/auth/session returns authenticated=false without session', async () => {
  const { response, json } = await requestJson('/api/auth/session', {
    headers: adminHeaders()
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 200);
  assert.equal(json.authenticated, false);
});

test('POST /api/auth/logout clears session cookie', async () => {
  const res = await requestRaw('/api/auth/logout', { method: 'POST' }, {});
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('Set-Cookie');
  assert.ok(setCookie.includes('xhalo_admin_session=;'));
  assert.ok(setCookie.includes('Max-Age=0'));
});

// ── Media Asset Manager Tests ───────────────────────────────────────────────

test('POST /api/assets/media-preview returns 401 without admin secret', async () => {
  const { response, json } = await requestJson('/api/assets/media-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'test-post',
      filename: 'cover.jpg',
      contentType: 'image/jpeg',
      storageTarget: 'r2',
      size: 1024
    })
  }, {});
  assert.equal(response.status, 401);
});

test('POST /api/assets/media-preview returns valid asset preview (r2)', async () => {
  const { response, json } = await requestJson('/api/assets/media-preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'test-post',
      filename: 'cover.jpg',
      contentType: 'image/jpeg',
      storageTarget: 'r2',
      size: 1024,
      label: 'Cover image'
    })
  }, { ADMIN_API_SHARED_SECRET: adminSecret, ASSETS_PUBLIC_BASE_URL: 'https://assets.test.com' });
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.mode, 'dry-run');
  assert.ok(json.asset);
  assert.equal(json.asset.slug, 'test-post');
  assert.equal(json.asset.filename, 'cover.jpg');
  assert.equal(json.asset.storageTarget, 'r2');
  assert.ok(json.asset.targetPath.includes('test-post'));
  assert.ok(json.asset.markdownSnippet);
});

test('POST /api/assets/media-preview returns valid asset preview (git_asset_folder)', async () => {
  const { response, json } = await requestJson('/api/assets/media-preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'my-post',
      filename: 'diagram.png',
      contentType: 'image/png',
      storageTarget: 'git_asset_folder',
      size: 2048
    })
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.ok(json.asset.targetPath.startsWith('source/_posts/my-post/'));
});

test('POST /api/assets/media-preview rejects invalid content type', async () => {
  const { response, json } = await requestJson('/api/assets/media-preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'test-post',
      filename: 'malware.exe',
      contentType: 'application/x-msdownload',
      storageTarget: 'r2',
      size: 1024
    })
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 400);
  assert.ok(json.error);
});

test('POST /api/assets/media-insert-snippet returns snippet', async () => {
  const { response, json } = await requestJson('/api/assets/media-insert-snippet', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'test-post',
      filename: 'cover.jpg',
      contentType: 'image/jpeg',
      storageTarget: 'r2',
      label: 'Cover'
    })
  }, { ADMIN_API_SHARED_SECRET: adminSecret, ASSETS_PUBLIC_BASE_URL: 'https://assets.test.com' });
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.ok(json.markdownSnippet);
});

test('POST /api/assets/media-insert-snippet rejects missing fields', async () => {
  const { response, json } = await requestJson('/api/assets/media-insert-snippet', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'test-post' })
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 400);
  assert.match(json.error, /Missing required fields/);
});

// ── Site Menu Manager Tests ─────────────────────────────────────────────────

test('GET /api/site/menu returns 401 without admin secret', async () => {
  const { response, json } = await requestJson('/api/site/menu', {
    headers: {}
  }, {});
  assert.equal(response.status, 401);
});

test('POST /api/site/menu/pr returns dry-run stub', async () => {
  const { response, json } = await requestJson('/api/site/menu/pr', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ menu: [] })
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 200);
  assert.equal(json.mode, 'dry-run');
  assert.ok(json.message);
});

test('POST /api/site/menu/direct-update returns 403 when disabled', async () => {
  const { response, json } = await requestJson('/api/site/menu/direct-update', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 403);
  assert.equal(json.code, 'DIRECT_CONFIG_DISABLED');
});

test('POST /api/site/menu/direct-update returns dry-run when enabled', async () => {
  const { response, json } = await requestJson('/api/site/menu/direct-update', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }, { ADMIN_API_SHARED_SECRET: adminSecret, OWNER_DIRECT_CONFIG_UPDATE_ENABLED: 'true' });
  assert.equal(response.status, 200);
  assert.equal(json.mode, 'dry-run');
});

test('POST /api/site/menu/preview returns 400 without menu array', async () => {
  const { response, json } = await requestJson('/api/site/menu/preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ notMenu: true })
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 400);
  assert.match(json.error, /menu array/);
});

// ── isProtectedAdminRoute Coverage ──────────────────────────────────────────

test('/api/site/ routes require admin secret', async () => {
  const { response, json } = await requestJson('/api/site/menu', {}, {});
  assert.equal(response.status, 401);
});

test('/api/auth/ routes require admin secret when not OAuth flow', async () => {
  const { response, json } = await requestJson('/api/auth/session', {}, {});
  assert.equal(response.status, 401);
});

// ── Core Module Unit Tests ──────────────────────────────────────────────────

test('parseCookies parses standard cookie header', async () => {
  const { parseCookies } = await import('../packages/core/src/auth-github-oauth.js');
  const cookies = parseCookies('foo=bar; baz=qux; name=value');
  assert.equal(cookies.foo, 'bar');
  assert.equal(cookies.baz, 'qux');
  assert.equal(cookies.name, 'value');
});

test('parseCookies returns empty object for empty header', async () => {
  const { parseCookies } = await import('../packages/core/src/auth-github-oauth.js');
  const cookies = parseCookies('');
  assert.deepEqual(cookies, {});
});

test('signSessionPayload and verifySessionCookieValue roundtrip', async () => {
  const { signSessionPayload, verifySessionCookieValue } = await import('../packages/core/src/auth-github-oauth.js');
  const payload = { login: 'ranbeioc', id: 12345, expiresAt: Date.now() + 86400000 };
  const signed = await signSessionPayload(payload, 'test-secret');
  assert.ok(signed.includes('.'));
  const verified = await verifySessionCookieValue(signed, 'test-secret');
  assert.ok(verified);
  assert.equal(verified.login, 'ranbeioc');
  assert.equal(verified.id, 12345);
});

test('verifySessionCookieValue rejects tampered payload', async () => {
  const { signSessionPayload, verifySessionCookieValue } = await import('../packages/core/src/auth-github-oauth.js');
  const payload = { login: 'ranbeioc', id: 12345, expiresAt: Date.now() + 86400000 };
  const signed = await signSessionPayload(payload, 'test-secret');
  const tampered = signed.replace('ranbeioc', 'attacker');
  const result = await verifySessionCookieValue(tampered, 'test-secret');
  assert.equal(result, null);
});

test('verifySessionCookieValue rejects expired session', async () => {
  const { signSessionPayload, verifySessionCookieValue } = await import('../packages/core/src/auth-github-oauth.js');
  const payload = { login: 'ranbeioc', id: 12345, expiresAt: Date.now() - 1000 };
  const signed = await signSessionPayload(payload, 'test-secret');
  const result = await verifySessionCookieValue(signed, 'test-secret');
  assert.equal(result, null);
});

test('validateMediaUpload accepts valid input', async () => {
  const { validateMediaUpload } = await import('../packages/core/src/media-assets.js');
  const result = validateMediaUpload({
    filename: 'cover.jpg',
    contentType: 'image/jpeg',
    size: 1024,
    storageTarget: 'r2',
    slug: 'test-post'
  });
  assert.equal(result, null);
});

test('validateMediaUpload rejects missing fields', async () => {
  const { validateMediaUpload } = await import('../packages/core/src/media-assets.js');
  const result = validateMediaUpload({
    filename: '',
    contentType: 'image/jpeg',
    size: 1024,
    storageTarget: 'r2',
    slug: 'test-post'
  });
  assert.ok(result !== null);
});

test('sanitizeFilename removes path traversal', async () => {
  const { sanitizeFilename } = await import('../packages/core/src/media-assets.js');
  assert.equal(sanitizeFilename('../../../etc/passwd'), 'etc-passwd');
  assert.equal(sanitizeFilename('cover.jpg'), 'cover.jpg');
  assert.equal(sanitizeFilename('my file (1).png'), 'my-file-1.png');
});

test('generateMediaSnippet returns markdown for r2 image', async () => {
  const { generateMediaSnippet } = await import('../packages/core/src/media-assets.js');
  const snippet = generateMediaSnippet({
    filename: 'cover.jpg',
    contentType: 'image/jpeg',
    storageTarget: 'r2',
    slug: 'test-post',
    label: 'Cover Image',
    publicBaseUrl: 'https://assets.test.com'
  });
  assert.ok(snippet.includes('cover.jpg'));
  assert.ok(snippet.includes('Cover Image') || snippet.includes('cover'));
});

test('generateMediaSnippet returns asset_img for git_asset_folder', async () => {
  const { generateMediaSnippet } = await import('../packages/core/src/media-assets.js');
  const snippet = generateMediaSnippet({
    filename: 'diagram.png',
    contentType: 'image/png',
    storageTarget: 'git_asset_folder',
    slug: 'test-post',
    label: 'Diagram',
    publicBaseUrl: 'https://assets.test.com'
  });
  assert.ok(snippet.includes('diagram.png'));
});

test('validateMenuList accepts valid menu', async () => {
  const { validateMenuList } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuList([
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about/' }
  ]);
  assert.equal(result, null);
});

test('validateMenuList rejects empty label', async () => {
  const { validateMenuList } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuList([
    { label: '', path: '/' }
  ]);
  assert.ok(result !== null);
});

test('normalizeMenuFromConfig extracts menu items', async () => {
  const { normalizeMenuFromConfig } = await import('../packages/core/src/site-menu.js');
  const config = {
    menu: [
      { name: 'Home', path: '/', icon: 'fas fa-home' },
      { name: 'About', path: '/about/' }
    ]
  };
  const items = normalizeMenuFromConfig(config);
  assert.ok(Array.isArray(items));
  assert.equal(items.length, 2);
});

test('updateConfigWithMenu merges menu into config', async () => {
  const { updateConfigWithMenu } = await import('../packages/core/src/site-menu.js');
  const config = { menu: [{ name: 'Old', path: '/old/' }], other: true };
  const newMenu = [{ label: 'New', path: '/new/' }];
  const updated = updateConfigWithMenu(config, newMenu);
  assert.ok(updated.other === true);
  assert.ok(Array.isArray(updated.menu));
  assert.equal(updated.menu.length, 1);
});
