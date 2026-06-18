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

test('Admin source has no known mojibake fragments in user-facing modules', () => {
  const files = [
    'app.js',
    'modules/ui.js',
    'modules/editor.js',
    'modules/menus.js',
    'modules/media.js',
    'modules/dashboard.js',
    'modules/audit.js',
    'modules/i18n.js',
    'modules/table.js'
  ];
  const mojibakePattern = /鈹|鈥|馃|鉁|鈿|锔|娴|绔|杩|鎵|丟|鐢|櫥|笍|�/;

  for (const file of files) {
    assert.doesNotMatch(read(file), mojibakePattern, `${file} contains mojibake`);
  }
});

test('Admin menus support CRUD, ordering, reset, diff preview, and test-only save', () => {
  const menus = read('modules/menus.js');

  assert.match(menus, /startEdit/);
  assert.match(menus, /deleteMenuItem/);
  assert.match(menus, /moveMenuItem/);
  assert.match(menus, /resetMenu/);
  assert.match(menus, /\/api\/site\/menu\/preview/);
  assert.match(menus, /\/api\/site\/menu\/test-direct-update/);
  assert.match(menus, /Save to Test/);
  assert.match(menus, /站点菜单管理/);
});

test('Admin editor supports full Markdown toolbar, templates, source load, preview, diff, and Publish to Test', () => {
  const editor = read('modules/editor.js');

  assert.match(editor, /FIRST_TEST_ARTICLE_TEMPLATE/);
  assert.match(editor, /xHalo Blog 测试文章/);
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

test('Admin media and dashboard expose Chinese labels, media upload, stats, and audit summaries', () => {
  const media = read('modules/media.js');
  const dashboard = read('modules/dashboard.js');
  const audit = read('modules/audit.js');

  assert.match(dashboard, /系统状态/);
  assert.match(media, /媒体资产管理/);
  assert.match(audit, /只读审计日志/);
  assert.match(media, /type="file"/);
  assert.match(media, /multiple/);
  assert.match(media, /\/api\/assets\/r2-signed-upload/);
  assert.match(media, /TEST_MEDIA_UPLOAD_ENABLED=true/);
  assert.match(dashboard, /\/api\/blog\/stats/);
  assert.match(dashboard, /\/api\/audit-logs\/summary/);
  assert.match(audit, /状态码筛选/);
});
