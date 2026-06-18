import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const adminDir = path.join(rootDir, 'apps/admin/src');

function read(relativePath) {
  return fs.readFileSync(path.join(adminDir, relativePath), 'utf8');
}

test('Admin i18n supports full-name language options and applies bilingual text cleanup to child pages', () => {
  const i18n = read('modules/i18n.js');
  const ui = read('modules/ui.js');
  const app = read('app.js');

  assert.match(i18n, /zh-CN/);
  assert.match(i18n, /en/);
  assert.match(i18n, /ko/);
  assert.match(i18n, /ja/);
  assert.match(i18n, /English/);
  assert.match(i18n, /简体中文/);
  assert.match(i18n, /한국어/);
  assert.match(i18n, /日本語/);
  assert.match(i18n, /대시보드/);
  assert.match(i18n, /ダッシュボード/);
  assert.match(i18n, /URLSearchParams/);
  assert.match(i18n, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(i18n, /navigator\.language/);
  assert.match(i18n, /applyLocaleToElement/);
  assert.match(app, /MutationObserver/);
  assert.match(ui, /admin-language-select/);
  assert.match(ui, /admin-language-select-wrap/);
});

test('Admin source has no common mojibake fragments in repaired user-facing modules', () => {
  const files = [
    'modules/i18n.js',
    'modules/menus.js',
    'modules/posts.js',
    'modules/editor.js',
    'modules/configuration.js'
  ];
  const mojibakePattern = /闂|閰|缂|绔欑|鍗氬|鈽|鈹|涓€|娴嬭瘯|鏂囩珷/;

  for (const file of files) {
    assert.doesNotMatch(read(file), mojibakePattern, `${file} contains mojibake`);
  }
});

test('Admin menus support CRUD, ordering, reset, localized edit prefill, diff preview, and test-only save', () => {
  const menus = read('modules/menus.js');

  assert.match(menus, /normalizeMenuItem/);
  assert.match(menus, /NEXT_MENU_LABELS/);
  assert.match(menus, /首页/);
  assert.match(menus, /Home/);
  assert.match(menus, /홈/);
  assert.match(menus, /ホーム/);
  assert.match(menus, /GPTabs/);
  assert.match(menus, /socialLinks/);
  assert.match(menus, /social-links-card/);
  assert.match(menus, /侧栏社交链接/);
  assert.match(menus, /Sidebar Social Links/);
  assert.match(menus, /사이드바 소셜 링크/);
  assert.match(menus, /サイドバーのソーシャルリンク/);
  assert.match(menus, /startEdit/);
  assert.match(menus, /startSocialEdit/);
  assert.match(menus, /deleteMenuItem/);
  assert.match(menus, /deleteSocialLink/);
  assert.match(menus, /moveMenuItem/);
  assert.match(menus, /moveSocialLink/);
  assert.match(menus, /resetMenu/);
  assert.match(menus, /\/api\/site\/menu\/preview/);
  assert.match(menus, /\/api\/site\/menu\/test-direct-update/);
  assert.match(menus, /保存到测试站/);
  assert.match(menus, /Pages 构建/);
  assert.match(menus, /站点菜单管理/);
  assert.match(menus, /draftItem\.labels/);
  assert.match(menus, /pagesDeploy/);
});

test('Admin editor uses Vditor with emoji and media shortcuts without custom side preview', () => {
  const editor = read('modules/editor.js');
  const css = read('style.css');

  assert.match(editor, /FIRST_TEST_ARTICLE_TEMPLATE/);
  assert.match(editor, /fetchPostSource/);
  assert.match(editor, /new Vditor/);
  assert.match(editor, /'preview'/);
  assert.match(editor, /'emoji'/);
  assert.match(editor, /closeVditorFloatingPanels/);
  assert.match(editor, /focusVditorEditorBody/);
  assert.doesNotMatch(editor, /toolbar:\s*\['emoji'/);
  assert.doesNotMatch(editor, /<label class="markdown-input-pane"/);
  assert.match(editor, /aria-labelledby="edit-body-label"/);
  assert.match(editor, /이미지/);
  assert.match(editor, /画像/);
  assert.match(editor, /MEDIA_SNIPPETS/);
  assert.match(editor, /data-media-snippet/);
  assert.doesNotMatch(editor, /markdown-live-preview/);
  assert.match(editor, /!\[/);
  assert.match(editor, /\/api\/drafts\/direct-update-preview/);
  assert.match(editor, /\/api\/drafts\/test-direct-publish/);
  assert.match(editor, /Publish to Test unavailable/);
  assert.match(css, /vditor-toolbar/);
  assert.match(css, /media-shortcut-bar/);
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

test('Admin configuration uses tabs, full-height editors, real NexT theme path, and plugin install detection', () => {
  const config = read('modules/configuration.js');
  const css = read('style.css');
  const worker = fs.readFileSync(path.join(rootDir, 'workers/api/src/index.js'), 'utf8');

  assert.match(config, /config-tab-list/);
  assert.match(config, /config-editor-full/);
  assert.match(config, /themes\/next\/_config\.yml/);
  assert.match(config, /hexo-theme-next/);
  assert.match(config, /保存配置文件/);
  assert.match(config, /Save Config File/);
  assert.match(config, /설정 파일 저장/);
  assert.match(config, /設定ファイルを保存/);
  assert.match(config, /validateConfigFiles/);
  assert.match(config, /configured/);
  assert.match(config, /configOnly/);
  assert.match(config, /installUnavailable/);
  assert.match(config, /hexo-filter-mathjax/);
  assert.match(config, /btn-save-all-config/);
  assert.match(config, /installPlugin/);
  assert.match(config, /pluginPackages/);
  assert.match(config, /\/api\/site\/config\/test-direct-update/);
  assert.match(css, /config-tab-panel/);
  assert.match(css, /height:\s*clamp\(360px,\s*54vh,\s*620px\)/);
  assert.match(css, /status-badge\[data-state="info"\]/);
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
