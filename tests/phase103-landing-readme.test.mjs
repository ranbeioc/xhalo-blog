import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

test('README documents the standard Hexo/NexT starter and import route', () => {
  const readme = read('README.md');

  assert.match(readme, /Standard initialization and Hexo\/NexT import flow/);
  assert.match(readme, /npm run init:hexo-next -- --target/);
  assert.match(readme, /--mode starter/);
  assert.match(readme, /--mode import/);
  assert.match(readme, /--source \.\.\/hexo-blog/);
  assert.match(readme, /posts, uploads, pages, `_data`, scaffolds, scripts, NexT theme files/);
  assert.match(readme, /feed\/search\/sitemap\/media-related plugin configuration/);
});

test('README keeps the three-repository source boundary explicit', () => {
  const readme = read('README.md');

  assert.match(readme, /ranbeioc\/xhalo-blog`: open-source framework/);
  assert.match(readme, /ranbeioc\/hexo-blog`: read-only historical source/);
  assert.match(readme, /ranbeioc\/xhalo-blog-test`: private real-content test site/);
  assert.match(readme, /must not receive real private blog posts/);
});

test('landing main body introduces Hexo/NexT migration without replacing core sections', () => {
  const html = read('apps/landing/src/index.html');

  assert.match(html, /Hexo\/NexT Migration/);
  assert.match(html, /existing Hexo\/NexT blog with posts, uploads, menus, theme files, plugin config/);
  assert.match(html, /docs\/hexo-next-initialization-and-import\.md/);
  assert.match(html, /id="migration"/);
  assert.match(html, /id="hero"/);
  assert.match(html, /id="features"/);
  assert.match(html, /id="architecture"/);
  assert.match(html, /id="quickstart"/);
  assert.doesNotMatch(html, /footer-migration-note/);
});

test('landing deployment docs use the standalone Pages project and no Worker deploy shortcut', () => {
  const readme = read('README.md');
  const html = read('apps/landing/src/index.html');

  assert.match(readme, /Project: xhalo-blog-landing/);
  assert.match(readme, /Production domain: blog\.xhalo\.co/);
  assert.match(readme, /Build command: npm ci && npm run build:landing/);
  assert.doesNotMatch(html, /wrangler deploy --all/);
});

test('landing supports browser locale matching with English fallback', async () => {
  const { dictionaries, resolveLocale } = await import(`file://${path.join(rootDir, 'apps/landing/src/app.js').replace(/\\/g, '/')}`);

  assert.equal(resolveLocale(['zh-CN']), 'zh-CN');
  assert.equal(resolveLocale(['ko-KR']), 'ko');
  assert.equal(resolveLocale(['ja-JP']), 'ja');
  assert.equal(resolveLocale(['fr-FR']), 'fr');
  assert.equal(resolveLocale(['es-MX']), 'es');
  assert.equal(resolveLocale(['de-DE']), 'de');
  assert.equal(resolveLocale(['pt-BR']), 'pt');
  assert.equal(resolveLocale(['it-IT']), 'en');

  for (const locale of ['en', 'zh-CN', 'ko', 'ja', 'fr', 'es', 'de', 'pt']) {
    assert.ok(dictionaries[locale], `missing landing dictionary for ${locale}`);
    assert.ok(dictionaries[locale]['hero.title'], `missing hero title for ${locale}`);
    assert.ok(dictionaries[locale]['migration.lead'], `missing migration lead for ${locale}`);
    assert.ok(dictionaries[locale]['quickstart.step4.body'], `missing quickstart copy for ${locale}`);
  }
});

test('landing i18n markers cover visible copy and load as a module', () => {
  const html = read('apps/landing/src/index.html');
  const app = read('apps/landing/src/app.js');

  for (const key of [
    'hero.title',
    'features.title',
    'migration.title',
    'architecture.title',
    'quickstart.title',
    'footer.docs'
  ]) {
    assert.ok(html.includes(key), `landing HTML must expose i18n key ${key}`);
    assert.ok(app.includes(`'${key}'`), `landing dictionary must define key ${key}`);
  }

  assert.match(html, /<script data-cfasync="false" type="module" src="app\.js"><\/script>/);
  assert.match(app, /const locale = resolveLocale/);
});

test('landing command examples use real repository commands', () => {
  const html = read('apps/landing/src/index.html');
  const pkg = JSON.parse(read('package.json'));

  assert.ok(pkg.scripts['check:all']);
  assert.ok(pkg.scripts['build:landing']);
  assert.ok(pkg.scripts['init:hexo-next']);
  assert.doesNotMatch(html, /npm run dev/);
  assert.match(html, /npm ci/);
  assert.match(html, /npm run check:all/);
  assert.match(html, /npm run build:landing/);
  assert.match(html, /npm run init:hexo-next -- --target/);
  assert.match(html, /Build command: npm ci && npm run build:landing/);
  assert.match(html, /Output directory: apps\/landing\/dist/);
});

test('landing source has no known mojibake fragments', () => {
  const source = `${read('apps/landing/src/index.html')}\n${read('apps/landing/src/app.js')}`;

  for (const fragment of ['鈥', '鉁', '鈩', '馃', '锔', '�']) {
    assert.doesNotMatch(source, new RegExp(fragment), `landing source contains mojibake fragment ${fragment}`);
  }
});
