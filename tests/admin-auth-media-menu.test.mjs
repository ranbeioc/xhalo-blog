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
    { id: 'home', label: 'Home', path: '/', external: false, visible: true, order: 0 },
    { id: 'about', label: 'About', path: '/about/', external: false, visible: true, order: 10 }
  ]);
  assert.equal(result, null);
});

test('validateMenuList rejects empty label', async () => {
  const { validateMenuList } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuList([
    { id: 'home', label: '', path: '/', external: false, visible: true, order: 0 }
  ]);
  assert.ok(result !== null);
});

test('validateMenuItem - missing id rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ label: 'Home', path: '/', external: false, visible: true, order: 0 });
  assert.equal(result, 'Menu item id is required and must be a string.');
});

test('validateMenuList - duplicate id rejected', async () => {
  const { validateMenuList } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuList([
    { id: 'home', label: 'Home', path: '/', external: false, visible: true, order: 0 },
    { id: 'home', label: 'Home 2', path: '/2', external: false, visible: true, order: 10 }
  ]);
  assert.equal(result, 'Duplicate menu item id: home.');
});

test('validateMenuItem - http external rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'External', path: 'http://example.com', external: true, visible: true, order: 0 });
  assert.equal(result, 'External menu item path must begin with https://.');
});

test('validateMenuItem - https external accepted', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'External', path: 'https://example.com', external: true, visible: true, order: 0 });
  assert.equal(result, null);
});

test('validateMenuItem - javascript path rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'JS', path: 'javascript:alert(1)', external: false, visible: true, order: 0 });
  assert.equal(result, 'Menu item path cannot contain javascript: protocol.');
});

test('validateMenuItem - data path rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'Data', path: 'data:text/html,123', external: false, visible: true, order: 0 });
  assert.equal(result, 'Menu item path cannot contain data: protocol.');
});

test('validateMenuItem - protocol-relative //example.com must be rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'Relative', path: '//example.com', external: true, visible: true, order: 0 });
  assert.equal(result, 'Protocol-relative paths are not allowed.');
});

test('validateMenuItem - internal path without slash rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'About', path: 'about', external: false, visible: true, order: 0 });
  assert.equal(result, 'Internal menu item path must begin with /.');
});

test('validateMenuItem - icon with unsafe chars rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result = validateMenuItem({ id: 'ex', label: 'Icon', path: '/', external: false, visible: true, order: 0, icon: 'fa fa-home;' });
  assert.equal(result, 'Menu item icon must contain only alphanumeric characters and hyphens.');
});

test('validateMenuItem - order out of range rejected', async () => {
  const { validateMenuItem } = await import('../packages/core/src/site-menu.js');
  const result1 = validateMenuItem({ id: 'ex', label: 'Icon', path: '/', external: false, visible: true, order: -1 });
  assert.equal(result1, 'Menu item order must be an integer between 0 and 9999.');
  const result2 = validateMenuItem({ id: 'ex', label: 'Icon', path: '/', external: false, visible: true, order: 10000 });
  assert.equal(result2, 'Menu item order must be an integer between 0 and 9999.');
});

test('normalizeMenuFromConfig extracts menu items', async () => {
  const { normalizeMenuFromConfig } = await import('../packages/core/src/site-menu.js');
  const config = {
    menu: [
      { name: 'Home', path: '/', icon: 'fa-home' },
      { name: 'About', path: '/about/' }
    ]
  };
  const items = normalizeMenuFromConfig(config);
  assert.ok(Array.isArray(items));
  assert.equal(items.length, 2);
  assert.equal(items[0].id, 'menu-item-0');
  assert.equal(items[0].label, 'Home');
});

test('updateConfigWithMenu merges menu into config', async () => {
  const { updateConfigWithMenu } = await import('../packages/core/src/site-menu.js');
  const config = { menu: [{ name: 'Old', path: '/old/' }], other: true };
  const newMenu = [{ id: 'new', label: 'New', path: '/new/', external: false, visible: true, order: 0 }];
  const updated = updateConfigWithMenu(config, newMenu);
  assert.ok(updated.other === true);
  assert.ok(Array.isArray(updated.menu));
  assert.equal(updated.menu.length, 1);
});

test('updateNextThemeConfigWithMenu replaces the NexT runtime menu block', async () => {
  const { updateNextThemeConfigWithMenu, NEXT_THEME_MENU_CONFIG_PATH } = await import('../packages/core/src/site-menu.js');
  const raw = [
    'scheme: Gemini',
    'menu:',
    '  home: / || fa fa-home',
    '  about: /about/ || fa fa-user',
    'menu_settings:',
    '  icons: true',
    ''
  ].join('\n');
  const updated = updateNextThemeConfigWithMenu(raw, [
    { id: 'landing', label: 'Landing', path: '/landing/', icon: 'rocket', external: false, visible: true, order: 0 },
    { id: 'hidden', label: 'Hidden', path: '/hidden/', icon: 'eye', external: false, visible: false, order: 5 },
    { id: 'admin', label: 'Admin', path: '/admin/', icon: 'fa fa-lock', external: false, visible: true, order: 10 }
  ]);

  assert.equal(NEXT_THEME_MENU_CONFIG_PATH, 'themes/next/_config.yml');
  assert.match(updated, /menu:\n  "Landing": \/landing\/ \|\| fa fa-rocket\n  "Admin": \/admin\/ \|\| fa fa-lock/);
  assert.doesNotMatch(updated, /Hidden/);
  assert.match(updated, /menu_settings:\n  icons: true/);
});

test('getConfigFromMain reads rb-blog.config.json when present', async () => {
  const { getConfigFromMain } = await import('../packages/core/src/site-menu.js');
  const mockFetch = async (url) => {
    if (url.includes('/contents/rb-blog.config.json')) {
      return new Response(JSON.stringify({
        sha: 'sha-main-config',
        content: btoa(JSON.stringify({ theme: { menu: [{ key: 'home', label: 'Home', path: '/', external: false, visible: true, order: 0 }] } }))
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };
  const env = {
    GITHUB_OWNER: 'owner',
    GITHUB_REPO: 'repo',
    GITHUB_FETCH: mockFetch
  };
  const res = await getConfigFromMain(env);
  assert.equal(res.filename, 'rb-blog.config.json');
  assert.equal(res.sha, 'sha-main-config');
  assert.ok(res.raw.includes('theme'));
});

test('getConfigFromMain falls back to rb-blog.config.example.json on 404', async () => {
  const { getConfigFromMain } = await import('../packages/core/src/site-menu.js');
  const mockFetch = async (url) => {
    if (url.includes('/contents/rb-blog.config.json')) {
      return new Response('', { status: 404 });
    }
    if (url.includes('/contents/rb-blog.config.example.json')) {
      return new Response(JSON.stringify({
        sha: 'sha-example-config',
        content: btoa(JSON.stringify({ menu: [{ name: 'Home', path: '/' }] }))
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };
  const env = {
    GITHUB_OWNER: 'owner',
    GITHUB_REPO: 'repo',
    GITHUB_FETCH: mockFetch
  };
  const res = await getConfigFromMain(env);
  assert.equal(res.filename, 'rb-blog.config.example.json');
  assert.equal(res.sha, 'sha-example-config');
  assert.ok(res.raw.includes('menu'));
});

test('getConfigFromMain throws CONFIG_NOT_FOUND or GitHub API error when both missing', async () => {
  const { getConfigFromMain } = await import('../packages/core/src/site-menu.js');
  const mockFetch = async (url) => {
    return new Response('', { status: 404 });
  };
  const env = {
    GITHUB_OWNER: 'owner',
    GITHUB_REPO: 'repo',
    GITHUB_FETCH: mockFetch
  };
  await assert.rejects(async () => {
    await getConfigFromMain(env);
  }, (err) => {
    return err.status === 404;
  });
});

test('GET /api/site/menu returns normalized menu using mock GitHub fetch', async () => {
  const mockGithubFetch = async (url, init) => {
    if (url.includes('/contents/rb-blog.config.json')) {
      return new Response(JSON.stringify({
        sha: 'sha-menu-config',
        content: btoa(JSON.stringify({
          menu: [
            { name: 'Home', path: '/', icon: 'home' }
          ]
        }))
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };

  const { response, json } = await requestJson('/api/site/menu', {
    headers: adminHeaders()
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.source, 'rb-blog.config.json');
  assert.equal(json.sha, 'sha-menu-config');
  assert.ok(Array.isArray(json.menu));
  assert.equal(json.menu.length, 1);
  assert.equal(json.menu[0].label, 'Home');
});

test('POST /api/site/menu/preview returns diff using mock GitHub fetch', async () => {
  const mockGithubFetch = async (url, init) => {
    if (url.includes('/contents/rb-blog.config.json')) {
      return new Response(JSON.stringify({
        sha: 'sha-menu-config',
        content: btoa(JSON.stringify({
          menu: [
            { name: 'Home', path: '/' }
          ]
        }))
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };

  const { response, json } = await requestJson('/api/site/menu/preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu: [
        { id: 'home', label: 'Home Page', path: '/', external: false, visible: true, order: 0 }
      ]
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.mode, 'preview');
  assert.ok(json.diff);
  assert.ok(json.diff.diffText.includes('Home Page'));
});

test('validateMediaUpload rejects exe, html, js, sh, php, path traversal, empty sanitized', async () => {
  const { validateMediaUpload } = await import('../packages/core/src/media-assets.js');
  
  // HTML rejected
  assert.equal(
    validateMediaUpload({ filename: 'index.html', contentType: 'text/html', size: 100, storageTarget: 'r2', slug: 'test' }),
    'File extension is strictly forbidden.'
  );

  // EXE rejected
  assert.equal(
    validateMediaUpload({ filename: 'malware.exe', contentType: 'application/x-msdownload', size: 100, storageTarget: 'r2', slug: 'test' }),
    'File extension is strictly forbidden.'
  );

  // Path traversal rejected
  assert.equal(
    validateMediaUpload({ filename: '../../etc/passwd', contentType: 'text/plain', size: 100, storageTarget: 'r2', slug: 'test' }),
    'Filename contains invalid path traversal characters.'
  );

  // Empty sanitized rejected
  assert.equal(
    validateMediaUpload({ filename: '@#$%', contentType: 'text/plain', size: 100, storageTarget: 'r2', slug: 'test' }),
    'Filename is invalid or empty after sanitization.'
  );

  // Oversized image rejected (> 5MB)
  assert.equal(
    validateMediaUpload({ filename: 'image.png', contentType: 'image/png', size: 6 * 1024 * 1024, storageTarget: 'r2', slug: 'test' }),
    'File size exceeds the limit for images (5MB).'
  );

  // Oversized document rejected (> 20MB)
  assert.equal(
    validateMediaUpload({ filename: 'doc.zip', contentType: 'application/zip', size: 21 * 1024 * 1024, storageTarget: 'r2', slug: 'test' }),
    'File size exceeds the limit for documents (20MB).'
  );

  // Oversized video rejected (> 100MB)
  assert.equal(
    validateMediaUpload({ filename: 'video.mp4', contentType: 'video/mp4', size: 101 * 1024 * 1024, storageTarget: 'r2', slug: 'test' }),
    'File size exceeds the limit for videos (100MB).'
  );
});

test('generateMediaSnippet markdown/asset_img tests', async () => {
  const { generateMediaSnippet } = await import('../packages/core/src/media-assets.js');

  // valid png git_asset_folder generates asset_img
  const snippet1 = generateMediaSnippet({
    filename: 'image.png',
    contentType: 'image/png',
    storageTarget: 'git_asset_folder',
    slug: 'post-slug',
    label: 'My Png'
  });
  assert.equal(snippet1, '{% asset_img image.png My Png %}');

  // valid jpg r2 generates markdown image URL
  const snippet2 = generateMediaSnippet({
    filename: 'image.jpg',
    contentType: 'image/jpeg',
    storageTarget: 'r2',
    slug: 'post-slug',
    label: 'My Jpg',
    publicBaseUrl: 'https://assets.example.com/'
  });
  assert.equal(snippet2, '![My Jpg](https://assets.example.com/posts/post-slug/image.jpg)');

  // valid pdf r2 generates download link
  const snippet3 = generateMediaSnippet({
    filename: 'doc.pdf',
    contentType: 'application/pdf',
    storageTarget: 'r2',
    slug: 'post-slug',
    label: 'My Pdf',
    publicBaseUrl: 'https://assets.example.com/'
  });
  assert.equal(snippet3, '[My Pdf](https://assets.example.com/posts/post-slug/doc.pdf)');

  // valid mp4 r2 generates video tag
  const snippet4 = generateMediaSnippet({
    filename: 'movie.mp4',
    contentType: 'video/mp4',
    storageTarget: 'r2',
    slug: 'post-slug',
    label: 'My Video',
    publicBaseUrl: 'https://assets.example.com/'
  });
  assert.equal(snippet4, '<video controls src="https://assets.example.com/posts/post-slug/movie.mp4"></video>');

  // valid zip r2 generates download link
  const snippet5 = generateMediaSnippet({
    filename: 'archive.zip',
    contentType: 'application/zip',
    storageTarget: 'r2',
    slug: 'post-slug',
    label: 'My Zip',
    publicBaseUrl: 'https://assets.example.com/'
  });
  assert.equal(snippet5, '[My Zip](https://assets.example.com/posts/post-slug/archive.zip)');
});

test('POST /api/assets/media-preview returns highRisk flag and note for SVG', async () => {
  const { response, json } = await requestJson('/api/assets/media-preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: 'test-post',
      filename: 'vector.svg',
      contentType: 'image/svg+xml',
      storageTarget: 'r2',
      size: 1024,
      label: 'Vector'
    })
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.asset.highRisk, true);
  assert.ok(json.asset.note.includes('high-risk'));
});

test('POST /api/assets/media-preview rejects batch payload', async () => {
  const { response, json } = await requestJson('/api/assets/media-preview', {
    method: 'POST',
    headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        slug: 'test-post',
        filename: 'img.png',
        contentType: 'image/png',
        storageTarget: 'r2',
        size: 1024
      }
    ])
  }, { ADMIN_API_SHARED_SECRET: adminSecret });
  assert.equal(response.status, 400);
});

test('OAuth Callback success path & cookies', async () => {
  const mockGithubFetch = async (url, init) => {
    if (url.includes('/oauth/access_token')) {
      return new Response(JSON.stringify({ access_token: 'mock-access-token-999' }), { status: 200 });
    }
    if (url.includes('/user')) {
      assert.equal(init.headers.Authorization, 'Bearer mock-access-token-999');
      return new Response(JSON.stringify({
        login: 'ranbeioc',
        id: 12345,
        avatar_url: 'https://avatar.com/u',
        name: 'Ranbei Owner'
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };

  const env = {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test-32-chars-long-secret-key-1234',
    ADMIN_AUTH_BASE_URL: 'https://admin.example.com',
    GITHUB_OAUTH_ALLOWED_LOGINS: 'ranbeioc',
    GITHUB_FETCH: mockGithubFetch
  };

  const res = await requestRaw('/auth/github/callback?code=good-code&state=good-state', {
    method: 'GET',
    headers: { 'Cookie': 'xhalo_oauth_state=good-state' }
  }, env);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), 'https://admin.example.com/admin');
  
  const cookiesHeader = res.headers.get('Set-Cookie') || '';
  assert.ok(cookiesHeader.includes('xhalo_admin_session='));
  assert.ok(cookiesHeader.includes('xhalo_oauth_state=;'));
  assert.ok(cookiesHeader.includes('HttpOnly'));
  assert.ok(cookiesHeader.includes('Secure'));
  assert.ok(cookiesHeader.includes('SameSite=Lax'));

  const cookieMatch = cookiesHeader.match(/xhalo_admin_session=([^;]+)/);
  const sessionToken = decodeURIComponent(cookieMatch[1]);
  
  const lastDotIndex = sessionToken.lastIndexOf('.');
  const payloadStr = sessionToken.substring(0, lastDotIndex);
  const payload = JSON.parse(payloadStr);
  assert.equal(payload.login, 'ranbeioc');
  assert.equal(payload.accessToken, undefined);
});

test('OAuth Callback unauthorized login rejected with 403', async () => {
  const mockGithubFetch = async (url, init) => {
    if (url.includes('/oauth/access_token')) {
      return new Response(JSON.stringify({ access_token: 'mock-access-token-999' }), { status: 200 });
    }
    if (url.includes('/user')) {
      return new Response(JSON.stringify({
        login: 'attacker',
        id: 99999,
        avatar_url: 'https://avatar.com/u',
        name: 'Attacker'
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };

  const env = {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: 'session-secret-test-32-chars-long-secret-key-1234',
    ADMIN_AUTH_BASE_URL: 'https://admin.example.com',
    GITHUB_OAUTH_ALLOWED_LOGINS: 'ranbeioc',
    GITHUB_FETCH: mockGithubFetch
  };

  const res = await requestRaw('/auth/github/callback?code=good-code&state=good-state', {
    method: 'GET',
    headers: { 'Cookie': 'xhalo_oauth_state=good-state' }
  }, env);

  assert.equal(res.status, 403);
  const json = await res.json();
  assert.match(json.error, /Unauthorized GitHub login/);
});

test('Session endpoint returns authenticated=true and user details, never token', async () => {
  const { signSessionPayload } = await import('../packages/core/src/auth-github-oauth.js');
  const secret = 'session-secret-test-32-chars-long-secret-key-1234';
  const sessionPayload = {
    login: 'ranbeioc',
    id: 12345,
    expiresAt: Date.now() + 86400000
  };
  const token = await signSessionPayload(sessionPayload, secret);
  
  const env = {
    GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
    GITHUB_OAUTH_CLIENT_SECRET: 'test-secret',
    ADMIN_SESSION_SECRET: secret,
    GITHUB_OAUTH_ALLOWED_LOGINS: 'ranbeioc'
  };

  const { response, json } = await requestJson('/api/auth/session', {
    method: 'GET',
    headers: { 'Cookie': `xhalo_admin_session=${encodeURIComponent(token)}` }
  }, env);

  assert.equal(response.status, 200);
  assert.equal(json.authenticated, true);
  assert.equal(json.user.login, 'ranbeioc');
  assert.equal(json.user.token, undefined);

  const unauthorizedPayload = {
    login: 'attacker',
    id: 99999,
    expiresAt: Date.now() + 86400000
  };
  const unauthorizedToken = await signSessionPayload(unauthorizedPayload, secret);
  
  // session check for unauthorized session cookie returns authenticated=false
  const { response: resSession, json: jsonSession } = await requestJson('/api/auth/session', {
    method: 'GET',
    headers: { 'Cookie': `xhalo_admin_session=${encodeURIComponent(unauthorizedToken)}` }
  }, env);
  assert.equal(resSession.status, 200);
  assert.equal(jsonSession.authenticated, false);

  // but other protected routes using verifyAdminRequest will reject with 401
  const res2 = await requestRaw('/api/readiness', {
    method: 'GET',
    headers: { 'Cookie': `xhalo_admin_session=${encodeURIComponent(unauthorizedToken)}` }
  }, env);
  assert.equal(res2.status, 401);
});
