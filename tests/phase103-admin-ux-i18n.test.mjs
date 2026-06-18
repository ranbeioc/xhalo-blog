import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const adminDir = path.join(rootDir, 'apps/admin/src');

function read(relativePath) {
  return fs.readFileSync(path.join(adminDir, relativePath), 'utf8');
}

test('Admin i18n exposes full-name language labels and four complete primary dictionaries', () => {
  const i18n = read('modules/i18n.js');
  const ui = read('modules/ui.js');

  for (const fragment of ['English', '简体中文', '한국어', '日本語', 'Dashboard', '仪表盘', '대시보드', 'ダッシュボード']) {
    assert.match(i18n, new RegExp(fragment));
  }
  assert.match(i18n, /URLSearchParams/);
  assert.match(i18n, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(i18n, /navigator\.language/);
  assert.match(ui, /admin-language-select-wrap/);
  assert.match(ui, /renderLanguageOptions/);
});

test('Admin user-facing modules no longer contain common mojibake fragments', () => {
  const files = [
    'modules/i18n.js',
    'modules/menus.js',
    'modules/posts.js',
    'modules/editor.js',
    'modules/configuration.js',
    'modules/integrations.js',
    'modules/publishing.js',
    'modules/settings.js',
    'modules/media.js',
    'modules/audit.js',
    'modules/stats.js',
    'modules/dashboard.js'
  ];
  const mojibakePattern = /闂|閰|缂|绔欑|鍗氬|鈽|鈹|涓€|娴嬭瘯|鏂囩珷|鑿|鞚|銉|鍗|绠/;

  for (const file of files) {
    assert.doesNotMatch(read(file), mojibakePattern, `${file} contains mojibake`);
  }
});

test('Admin menus support localized edit prefill plus sidebar social link management', () => {
  const menus = read('modules/menus.js');

  for (const fragment of ['首页', 'Home', '홈', 'ホーム', 'GPTabs', 'GPTLabs']) {
    assert.match(menus, new RegExp(fragment));
  }
  for (const fragment of ['侧栏社交链接', 'Sidebar social links', '사이드바 소셜 링크', 'サイドバーのソーシャルリンク']) {
    assert.match(menus, new RegExp(fragment));
  }
  assert.match(menus, /inferNextLabels/);
  assert.match(menus, /normalizeMenuItem/);
  assert.match(menus, /startEdit/);
  assert.match(menus, /startSocialEdit/);
  assert.match(menus, /socialLinks/);
  assert.match(menus, /\/api\/site\/menu\/preview/);
  assert.match(menus, /\/api\/site\/menu\/test-direct-update/);
  assert.match(menus, /pagesDeploy/);
});

test('Admin editor hides Vditor until ready and inserts uploaded media paths', () => {
  const editor = read('modules/editor.js');
  const css = read('style.css');

  assert.match(editor, /vditor-loading-card/);
  assert.match(editor, /editorLoading/);
  assert.match(editor, /new Vditor/);
  assert.match(editor, /host\.classList\.remove\('is-loading'\)/);
  assert.match(editor, /closeVditorFloatingPanels/);
  assert.match(editor, /pointerdown/);
  assert.doesNotMatch(editor, /focusVditorEditorBody/);
  assert.match(editor, /openMediaPicker/);
  assert.match(editor, /uploadAndInsertMedia/);
  assert.match(editor, /\/api\/assets\/r2-signed-upload/);
  assert.match(editor, /audio\/mpeg/);
  assert.match(editor, /<audio controls/);
  assert.match(css, /vditor-loading-card/);
  assert.match(css, /vditor-host\.is-loading/);
  assert.match(css, /vditor-toolbar[\s\S]*position:\s*relative/);
});

test('Post list preview opens a derived article detail path, not the blog home', () => {
  const posts = read('modules/posts.js');
  const core = fs.readFileSync(path.join(rootDir, 'packages/core/src/github-publishing.js'), 'utf8');

  assert.match(posts, /resolvePostPreviewUrl/);
  assert.match(posts, /derivePreviewFromPost/);
  assert.match(posts, /target="_blank"/);
  assert.doesNotMatch(posts, /href="\/"/);
  assert.match(core, /buildHexoPostPreviewUrl/);
  assert.match(core, /\/posts\/\$\{slug\}\//);
  assert.match(core, /\$\{year\}\/\$\{month\}\/\$\{day\}/);
});

test('Admin configuration page uses tabs, correct NexT path, editable plugins, and visible save button', () => {
  const config = read('modules/configuration.js');
  const css = read('style.css');
  const worker = fs.readFileSync(path.join(rootDir, 'workers/api/src/index.js'), 'utf8');

  assert.match(config, /config-tab-list/);
  assert.match(config, /config-editor-full/);
  assert.match(config, /themes\/next\/_config\.yml/);
  assert.match(config, /hexo-theme-next/);
  assert.match(config, /Add dependency to package\.json/);
  assert.match(config, /Open configuration file/);
  assert.match(config, /validateConfigFiles/);
  assert.match(config, /btn-install-plugin/);
  assert.match(config, /\/api\/site\/config\/test-direct-update/);
  assert.match(css, /height:\s*clamp\(280px,\s*46vh,\s*520px\)/);
  assert.match(worker, /allowedConfigPaths/);
  assert.match(worker, /themes\/next\/_config\.yml/);
});

test('Admin tables and dashboard support full width, filters, and preview-home action', () => {
  const table = read('modules/table.js');
  const posts = read('modules/posts.js');
  const dashboard = read('modules/dashboard.js');
  const css = read('style.css');

  assert.match(table, /data-table-search/);
  assert.match(table, /data-table-filter/);
  assert.match(table, /clientPagination/);
  assert.match(posts, /clientPagination:\s*false/);
  assert.match(posts, /server-pagination/);
  assert.match(dashboard, /previewHome/);
  assert.match(dashboard, /`\$\{window\.location\.origin\}\//);
  assert.match(css, /\.content-area[\s\S]*max-width:\s*none/);
  assert.match(css, /\.dashboard-heading-row/);
  assert.match(css, /\.adaptive-table/);
});
