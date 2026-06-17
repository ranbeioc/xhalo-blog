import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Phase 102 documents the full Hexo NexT import pipeline and private test-site route', () => {
  const doc = read('docs/phase102-hexo-next-full-import-pipeline.md');

  assert.match(doc, /ranbeioc\/xhalo-blog/);
  assert.match(doc, /ranbeioc\/hexo-blog/);
  assert.match(doc, /ranbeioc\/xhalo-blog-test/);
  assert.match(doc, /xhalo-blog-test/);
  assert.match(doc, /npm ci && npm run build/);
  assert.match(doc, /public/);
  assert.match(doc, /starter/);
  assert.match(doc, /import/);
});

test('Phase 102 docs require full NexT configuration preservation and audit outputs', () => {
  const doc = read('docs/phase102-hexo-next-full-import-pipeline.md');

  for (const expected of [
    'source/_posts/**',
    'source/upload/**',
    'source/_data/**',
    'themes/next/**',
    '_config*.yml',
    'package.json',
    '.xhalo-import-manifest.json',
    '.xhalo-import-report.md',
    'needsReview',
    'blocked'
  ]) {
    assert.ok(doc.includes(expected), `Phase 102 document must include ${expected}`);
  }
});

test('Phase 102 keeps open-source repo free of private root Hexo content', () => {
  for (const forbidden of ['source/_posts', 'source/upload', 'CNAME']) {
    assert.equal(fs.existsSync(forbidden), false, `Open-source xhalo-blog must not contain ${forbidden}`);
  }
});

test('init script exposes starter/import modes and excludes unsafe artifacts', () => {
  const script = read('scripts/init-hexo-next-site.mjs');

  assert.match(script, /--mode/);
  assert.match(script, /starter/);
  assert.match(script, /import/);
  assert.ok(script.includes('^_config(?:\\..+)?\\.ya?ml$'));
  assert.match(script, /skip_render/);
  assert.match(script, /_worker\.js/);
  assert.match(script, /admin\/\*\*/);
  assert.match(script, /landing\/\*\*/);
  assert.match(script, /CNAME/);
  assert.match(script, /\.env/);
  assert.match(script, /node_modules/);
  assert.match(script, /public/);
});
