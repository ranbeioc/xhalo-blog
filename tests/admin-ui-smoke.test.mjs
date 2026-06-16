import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_SRC_DIR = path.resolve('apps/admin/src');

describe('Admin UI smoke tests', () => {
  it('index.html should have sidebar, topbar, and content-area elements', () => {
    const html = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'index.html'), 'utf8');
    assert.ok(html.includes('id="sidebar"'), 'Missing sidebar element');
    assert.ok(html.includes('id="topbar"'), 'Missing topbar element');
    assert.ok(html.includes('id="content-area"'), 'Missing content-area element');
    assert.ok(html.includes('id="toast-container"'), 'Missing toast-container element');
  });

  it('index.html should load app.js as ES module', () => {
    const html = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'index.html'), 'utf8');
    assert.ok(html.includes('type="module"'), 'app.js must be loaded as module');
    assert.ok(html.includes('src="./app.js"'), 'Must reference ./app.js');
  });

  it('app.js should import all expected modules', () => {
    const appJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'app.js'), 'utf8');
    const expectedImports = [
      './modules/api-client.js',
      './modules/auth.js',
      './modules/ui.js',
      './modules/dashboard.js',
      './modules/posts.js',
      './modules/editor.js',
      './modules/media.js',
      './modules/menus.js',
      './modules/publishing.js',
      './modules/audit.js',
      './modules/settings.js'
    ];
    for (const imp of expectedImports) {
      assert.ok(appJs.includes(imp), `Missing import: ${imp}`);
    }
  });

  it('ui.js should define all 8 route entries', () => {
    const uiJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'ui.js'), 'utf8');
    const routes = ['dashboard', 'posts', 'editor', 'media', 'menus', 'publishing', 'audit', 'settings'];
    for (const route of routes) {
      assert.ok(uiJs.includes(`id: '${route}'`), `Missing route definition: ${route}`);
    }
  });

  it('editor module should NOT enable direct publish by default', () => {
    const editorJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'editor.js'), 'utf8');
    assert.ok(editorJs.includes('disabled'), 'Direct publish buttons should be disabled by default');
  });

  it('publishing module should display safety gate status', () => {
    const publishingJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'publishing.js'), 'utf8');
    assert.ok(publishingJs.includes('Safety'), 'Publishing module should reference safety');
    assert.ok(publishingJs.includes('Gated'), 'Publishing module should reference gate status');
  });

  it('settings module should reference the in-project xhalo-blog boundary', () => {
    const settingsJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'settings.js'), 'utf8');
    assert.ok(settingsJs.includes('xhalo-blog'), 'Settings must reference xhalo-blog project target');
    assert.ok(settingsJs.includes('No separate Cloudflare Pages project'), 'Settings must reference that no separate Pages project is required');
  });

  it('style.css should contain sidebar and topbar styles', () => {
    const css = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'style.css'), 'utf8');
    assert.ok(css.includes('.sidebar'), 'Missing .sidebar styles');
    assert.ok(css.includes('.topbar'), 'Missing .topbar styles');
    assert.ok(css.includes('.content-area'), 'Missing .content-area styles');
    assert.ok(css.includes('.sidebar-nav-btn'), 'Missing sidebar button styles');
  });

  it('app.js should contain renderLoginScreen function and gate layout checks', () => {
    const appJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'app.js'), 'utf8');
    assert.ok(appJs.includes('renderLoginScreen'), 'app.js must define renderLoginScreen');
    assert.ok(appJs.includes('unauthenticated'), 'app.js must toggle unauthenticated body class');
  });

  it('style.css should contain unauthenticated layout and login-card styles', () => {
    const css = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'style.css'), 'utf8');
    assert.ok(css.includes('body.unauthenticated'), 'Missing body.unauthenticated styles');
    assert.ok(css.includes('.login-card'), 'Missing .login-card styles');
    assert.ok(css.includes('.login-btn-github'), 'Missing .login-btn-github styles');
  });
});
