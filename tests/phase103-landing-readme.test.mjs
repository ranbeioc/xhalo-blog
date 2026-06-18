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
