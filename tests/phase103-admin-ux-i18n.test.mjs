import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const adminDir = path.join(rootDir, 'apps/admin/src');

function read(relativePath) {
  return fs.readFileSync(path.join(adminDir, relativePath), 'utf8');
}

test('Admin i18n supports zh-CN/en and applies bilingual text cleanup to child pages', () => {
  const i18n = read('modules/i18n.js');
  const ui = read('modules/ui.js');
  const app = read('app.js');

  assert.match(i18n, /zh-CN/);
  assert.match(i18n, /en/);
  assert.match(i18n, /URLSearchParams/);
  assert.match(i18n, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(i18n, /navigator\.language/);
  assert.match(i18n, /applyLocaleToElement/);
  assert.match(app, /MutationObserver/);
  assert.match(ui, /admin-language-select/);
});

test('Admin source has no known mojibake fragments in repaired user-facing modules', () => {
  const files = [
    'modules/i18n.js',
    'modules/menus.js',
    'modules/posts.js',
    'modules/editor.js',
    'modules/configuration.js'
  ];
  const mojibakePattern = /闁硘閼縷缁攟婵瘄閺倈濮潀閸檤閻榺鈧瑋閳|淇濆瓨|鏋勫缓|绔欑偣|鍗氬|鏂囩珷|鑿滃崟/;

  for (const file of files) {
    assert.doesNotMatch(read(file), mojibakePattern, `${file} contains mojibake`);
  }
});

test('Admin menus support CRUD, ordering, reset, edit prefill, diff preview, and test-only save', () => {
  const menus = read('modules/menus.js');

  assert.match(menus, /normalizeMenuItem/);
  assert.match(menus, /startEdit/);
  assert.match(menus, /deleteMenuItem/);
  assert.match(menus, /moveMenuItem/);
  assert.match(menus, /resetMenu/);
  assert.match(menus, /\/api\/site\/menu\/preview/);
  assert.match(menus, /\/api\/site\/menu\/test-direct-update/);
  assert.match(menus, /保存到测试站/);
  assert.match(menus, /Pages 构建/);
  assert.match(menus, /站点菜单管理/);
  assert.match(menus, /draftItem\.labels/);
  assert.match(menus, /pagesDeploy/);
});

test('Admin editor uses Vditor without startup emoji overlay or custom side preview', () => {
  const editor = read('modules/editor.js');

  assert.match(editor, /FIRST_TEST_ARTICLE_TEMPLATE/);
  assert.match(editor, /fetchPostSource/);
  assert.match(editor, /new Vditor/);
  assert.match(editor, /'preview'/);
  assert.doesNotMatch(editor, /'emoji'/);
  assert.doesNotMatch(editor, /markdown-live-preview/);
  assert.match(editor, /!\[/);
  assert.match(editor, /\/api\/drafts\/direct-update-preview/);
  assert.match(editor, /\/api\/drafts\/test-direct-publish/);
  assert.match(editor, /Publish to Test unavailable/);
});

test('Admin tables expose search, filter, adaptive columns, and posts use one server pagination control', () => {
  const table = read('modules/table.js');
  const posts = read('modules/posts.js');
  const audit = read('modules/audit.js');
  const publishing = read('modules/publishing.js');
  const css = read('style.css');

  assert.match(table, /renderDataTable/);
  assert.match(table, /data-table-search/);
  assert.match(table, /data-table-filter/);
  assert.match(table, /table-pagination/);
  assert.match(table, /clientPagination/);
  assert.match(posts, /clientPagination:\s*false/);
  assert.match(posts, /server-pagination/);
  assert.match(audit, /renderDataTable/);
  assert.match(publishing, /renderDataTable/);
  assert.match(css, /\.adaptive-table/);
  assert.match(css, /table-layout:\s*auto/);
});

test('Admin configuration supports editable Hexo NexT config and plugin package install', () => {
  const config = read('modules/configuration.js');
  const worker = fs.readFileSync(path.join(rootDir, 'workers/api/src/index.js'), 'utf8');

  assert.match(config, /config-editor/);
  assert.match(config, /btn-save-all-config/);
  assert.match(config, /installPlugin/);
  assert.match(config, /pluginPackages/);
  assert.match(config, /\/api\/site\/config\/test-direct-update/);
  assert.match(worker, /\/api\/site\/config\/test-direct-update/);
  assert.match(worker, /allowedConfigPaths/);
});

test('Admin exposes a dedicated blog stats route and stats module', () => {
  const app = read('app.js');
  const ui = read('modules/ui.js');
  const i18n = read('modules/i18n.js');
  const stats = read('modules/stats.js');

  assert.match(app, /fetchBlogStats/);
  assert.match(app, /renderStatsPanel/);
  assert.match(app, /'stats'/);
  assert.match(ui, /id: 'stats'/);
  assert.match(i18n, /stats: '博客统计'/);
  assert.match(stats, /博客数据统计|Blog Data Statistics/);
  assert.match(stats, /source\/_posts/);
  assert.match(stats, /\/api\/blog\/stats/);
});

test('Admin child pages use full-width responsive content', () => {
  const css = read('style.css');

  assert.match(css, /\.content-area[\s\S]*max-width:\s*none/);
  assert.match(css, /\.posts-panel/);
  assert.match(css, /\.editor-workspace/);
  assert.match(css, /\.menu-workspace/);
  assert.match(css, /\.config-workspace/);
});

test('Admin left brand area height matches the topbar height token', () => {
  const css = read('style.css');

  assert.match(css, /\.sidebar-brand[\s\S]*height: var\(--topbar-height\)/);
  assert.match(css, /\.sidebar-brand[\s\S]*min-height: var\(--topbar-height\)/);
  assert.match(css, /\.topbar[\s\S]*height: var\(--topbar-height\)/);
});
