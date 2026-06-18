import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const adminDir = path.join(rootDir, 'apps/admin/src');

function read(relativePath) {
  return fs.readFileSync(path.join(adminDir, relativePath), 'utf8');
}

test('Admin i18n supports zh-CN and en language selection sources', () => {
  const i18n = read('modules/i18n.js');
  const ui = read('modules/ui.js');

  assert.match(i18n, /zh-CN/);
  assert.match(i18n, /en/);
  assert.match(i18n, /URLSearchParams/);
  assert.match(i18n, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(i18n, /navigator\.language/);
  assert.match(ui, /admin-language-select/);
});

test('Admin source has no known mojibake fragments in repaired user-facing modules', () => {
  const files = [
    'modules/menus.js',
    'modules/stats.js'
  ];
  const mojibakePattern = /閳|鑿|绔|濯|鏂|姝|鍙|鐘|€|鈹/;

  for (const file of files) {
    assert.doesNotMatch(read(file), mojibakePattern, `${file} contains mojibake`);
  }
});

test('Admin menus support CRUD, ordering, reset, diff preview, test-only save, and Pages rebuild feedback', () => {
  const menus = read('modules/menus.js');

  assert.match(menus, /startEdit/);
  assert.match(menus, /deleteMenuItem/);
  assert.match(menus, /moveMenuItem/);
  assert.match(menus, /resetMenu/);
  assert.match(menus, /\/api\/site\/menu\/preview/);
  assert.match(menus, /\/api\/site\/menu\/test-direct-update/);
  assert.match(menus, /保存到测试站/);
  assert.match(menus, /Pages 构建/);
  assert.match(menus, /站点菜单管理/);
  assert.match(menus, /pagesDeploy/);
});

test('Admin editor supports full Markdown toolbar, templates, source load, preview, diff, and Publish to Test', () => {
  const editor = read('modules/editor.js');

  assert.match(editor, /FIRST_TEST_ARTICLE_TEMPLATE/);
  assert.match(editor, /fetchPostSource/);
  assert.match(editor, /Markdown Preview/);
  assert.match(editor, /markdown-toolbar/);
  assert.match(editor, /insertMarkdownSyntax/);
  assert.match(editor, /markdown-editor-layout/);
  assert.match(editor, /renderMarkdownTable/);
  assert.match(editor, /!\[/);
  assert.match(editor, /\/api\/drafts\/direct-update-preview/);
  assert.match(editor, /\/api\/drafts\/test-direct-publish/);
  assert.match(editor, /Publish to Test unavailable/);
});

test('Admin tables expose search, filter, pagination, and adaptive columns', () => {
  const table = read('modules/table.js');
  const posts = read('modules/posts.js');
  const audit = read('modules/audit.js');
  const publishing = read('modules/publishing.js');
  const css = read('style.css');

  assert.match(table, /renderDataTable/);
  assert.match(table, /data-table-search/);
  assert.match(table, /data-table-filter/);
  assert.match(table, /table-pagination/);
  assert.match(posts, /renderDataTable/);
  assert.match(audit, /renderDataTable/);
  assert.match(publishing, /renderDataTable/);
  assert.match(css, /\.adaptive-table/);
  assert.match(css, /table-layout:\s*auto/);
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
  assert.match(stats, /博客数据统计/);
  assert.match(stats, /source\/_posts/);
  assert.match(stats, /\/api\/blog\/stats/);
});

test('Admin left brand area height matches the topbar height token', () => {
  const css = read('style.css');

  assert.match(css, /\.sidebar-brand[\s\S]*height: var\(--topbar-height\)/);
  assert.match(css, /\.sidebar-brand[\s\S]*min-height: var\(--topbar-height\)/);
  assert.match(css, /\.topbar[\s\S]*height: var\(--topbar-height\)/);
});
