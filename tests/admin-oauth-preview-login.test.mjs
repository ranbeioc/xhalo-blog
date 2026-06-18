import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_SRC_DIR = path.resolve('apps/admin/src');
const WORKER_SRC_DIR = path.resolve('workers/api/src');

describe('Admin GitHub OAuth Preview Login tests', () => {
  it('Login with GitHub button is defined in topbar rendering', () => {
    const uiJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'ui.js'), 'utf8');
    assert.ok(uiJs.includes('Login with GitHub') || uiJs.includes('login-github'), 'Topbar must define a GitHub login button or trigger');
  });

  it('getLoginUrl points to /auth/github/start endpoint', () => {
    const authJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'auth.js'), 'utf8');
    assert.ok(authJs.includes('/auth/github/start'), 'getLoginUrl must reference /auth/github/start path');
  });

  it('ADMIN_FRONTEND_BASE_URL exists in wrangler config and environment examples', () => {
    const wranglerExample = fs.readFileSync(path.resolve('wrangler.toml.example'), 'utf8');
    const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
    assert.ok(wranglerExample.includes('ADMIN_FRONTEND_BASE_URL'), 'wrangler.toml.example must define ADMIN_FRONTEND_BASE_URL');
    assert.ok(envExample.includes('ADMIN_FRONTEND_BASE_URL'), '.env.example must define ADMIN_FRONTEND_BASE_URL');
  });

  it('ADMIN_FRONTEND_PATH is specified in wrangler config and env examples', () => {
    const wranglerExample = fs.readFileSync(path.resolve('wrangler.toml.example'), 'utf8');
    const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
    assert.ok(wranglerExample.includes('ADMIN_FRONTEND_PATH'), 'wrangler.toml.example must define ADMIN_FRONTEND_PATH');
    assert.ok(envExample.includes('ADMIN_FRONTEND_PATH'), '.env.example must define ADMIN_FRONTEND_PATH');
  });

  it('ADMIN_FRONTEND_PATH defaults to /admin in worker if env is not provided', () => {
    const workerIndex = fs.readFileSync(path.join(WORKER_SRC_DIR, 'index.js'), 'utf8');
    assert.ok(workerIndex.includes("env.ADMIN_FRONTEND_PATH || '/admin'"), 'Worker must default ADMIN_FRONTEND_PATH to /admin');
  });

  it('OAuth callback logic redirects to frontend base URL plus path', () => {
    const workerIndex = fs.readFileSync(path.join(WORKER_SRC_DIR, 'index.js'), 'utf8');
    assert.ok(workerIndex.includes('ADMIN_FRONTEND_BASE_URL') || workerIndex.includes('frontendBaseUrl'), 'Worker auth handler must use frontend base URL redirect config');
    assert.ok(workerIndex.includes('ADMIN_FRONTEND_PATH') || workerIndex.includes('frontendPath'), 'Worker auth handler must use frontend path config');
  });

  it('apiFetch client configuration includes credentials option', () => {
    const apiClientJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'api-client.js'), 'utf8');
    assert.ok(apiClientJs.includes("credentials: 'include'"), 'apiFetch requests must include credentials option');
  });

  it('no stale Pages domains or project references are hardcoded in admin files', () => {
    const files = fs.readdirSync(path.join(ADMIN_SRC_DIR, 'modules')).map(f => ({
      name: f,
      content: fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', f), 'utf8')
    }));

    for (const file of files) {
      assert.strictEqual(
        /xhalo-admin\.pages\.dev/i.test(file.content),
        false,
        `Found hardcoded xhalo-admin.pages.dev reference in modules/${file.name}`
      );
      assert.strictEqual(
        /xhalo-blog-admin\.pages\.dev/i.test(file.content),
        false,
        `Found hardcoded xhalo-blog-admin.pages.dev reference in modules/${file.name}`
      );
      assert.strictEqual(
        /12f09841\.xhalo-admin\.pages\.dev/i.test(file.content),
        false,
        `Found hardcoded 12f09841.xhalo-admin.pages.dev reference in modules/${file.name}`
      );
      assert.strictEqual(
        /xhalo_blog_admin_pages_dev/i.test(file.content),
        false,
        `Found hardcoded variable format of separate project in modules/${file.name}`
      );
    }
  });

  it('no source files claim a separate xhalo-blog-admin Cloudflare Pages project is required', () => {
    const settingsJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'settings.js'), 'utf8');
    assert.ok(settingsJs.includes('No separate Cloudflare Pages project is required'), 'Settings must specify that no separate project is required');
  });

  it('no secret values are hardcoded in the admin source code', () => {
    const files = fs.readdirSync(path.join(ADMIN_SRC_DIR, 'modules')).map(f => ({
      name: f,
      content: fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', f), 'utf8')
    }));

    for (const file of files) {
      // Secret strings check
      assert.strictEqual(
        /xhalo_admin_secret_value/i.test(file.content),
        false,
        `Found dummy or real raw secret string in modules/${file.name}`
      );
    }
  });

  it('all 8 admin console views exist', () => {
    const uiJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'ui.js'), 'utf8');
    const requiredViews = [
      'dashboard',
      'posts',
      'editor',
      'media',
      'menus',
      'publishing',
      'audit',
      'settings'
    ];
    for (const view of requiredViews) {
      assert.ok(uiJs.includes(`id: '${view}'`), `UI module must register view id: ${view}`);
    }
  });

  it('direct buttons are disabled by default for write actions', () => {
    const editorJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'editor.js'), 'utf8');
    assert.ok(editorJs.includes('disabled'), 'Direct publishing must be disabled in editor view');
  });

  it('PR publish button copy and state checks based on write gates', () => {
    const editorJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'editor.js'), 'utf8');
    assert.ok(editorJs.includes('Create Review PR'), 'Publish button copy must be Create Review PR');
    assert.ok(editorJs.includes('Create Review PR is unavailable because live writes are disabled.'), 'Must show formal disabled warning copy when writes are disabled');
    assert.ok(editorJs.includes('disabled'), 'Create Review PR button must have disabled attribute support');
  });

  it('media panel uses dry-run terminology for safety', () => {
    const mediaJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'media.js'), 'utf8');
    assert.ok(mediaJs.includes('dry-run') || mediaJs.includes('Dry-run'), 'Media module must display dry-run labeling');
  });

  it('menus panel uses preview terminology for safety', () => {
    const menusJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'menus.js'), 'utf8');
    assert.ok(menusJs.includes('preview') || menusJs.includes('Preview'), 'Menus module must refer to preview configuration');
  });

  it('settings does not expose or render secret values', () => {
    const settingsJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'settings.js'), 'utf8');
    assert.ok(!settingsJs.includes('ADMIN_API_SHARED_SECRET'), 'Settings must not reference raw backend secret variable');
    assert.ok(!settingsJs.includes('GITHUB_OAUTH_CLIENT_SECRET'), 'Settings must not reference raw client secret variable');
  });

  it('no modules contain raw browser alert calls (uses toast notifications instead)', () => {
    const modules = ['editor.js', 'media.js', 'menus.js', 'settings.js'];
    for (const mod of modules) {
      const content = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', mod), 'utf8');
      assert.ok(content.includes('showToast'), `${mod} must import or use showToast`);
      assert.strictEqual(
        content.match(/\balert\s*\(/g),
        null,
        `${mod} must not contain raw alert() calls`
      );
    }
  });

  it('editor.js uses Vditor built-in Markdown preview without the custom side preview', () => {
    const editorJs = fs.readFileSync(path.join(ADMIN_SRC_DIR, 'modules', 'editor.js'), 'utf8');
    assert.ok(editorJs.includes('new Vditor'), 'Editor must mount Vditor');
    assert.ok(editorJs.includes("'preview'"), 'Vditor toolbar must expose built-in preview');
    assert.ok(!editorJs.includes('markdown-live-preview'), 'Custom side preview must not render');
    assert.ok(editorJs.includes("'emoji'"), 'Emoji toolbar should be available in Vditor');
    assert.ok(editorJs.includes('MEDIA_SNIPPETS'), 'Editor should expose media snippet shortcuts');
  });
});
