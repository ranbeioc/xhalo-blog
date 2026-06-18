import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

test('Phase 105 documents the admin performance and security review boundary', () => {
  const doc = read('docs/phase105-admin-performance-security-review.md');

  assert.match(doc, /Admin first-load/);
  assert.match(doc, /xhalo-blog-test\.pages\.dev\/admin/);
  assert.match(doc, /xhalo-blog-staging-api/);
  assert.match(doc, /No production write/);
  assert.match(doc, /hexo-blog@main/);
});

test('Admin shell lazy-loads heavy route modules instead of static importing them', () => {
  const app = read('apps/admin/src/app.js');

  assert.doesNotMatch(app, /from '\.\/modules\/editor\.js'/);
  assert.doesNotMatch(app, /from '\.\/modules\/media\.js'/);
  assert.doesNotMatch(app, /from '\.\/modules\/audit\.js'/);
  assert.match(app, /editor: \(\) => import\('\.\/modules\/editor\.js'\)/);
  assert.match(app, /media: \(\) => import\('\.\/modules\/media\.js'\)/);
  assert.match(app, /audit: \(\) => import\('\.\/modules\/audit\.js'\)/);
  assert.match(app, /preloadLikelyRoutes/);
});

test('Worker protects integrations status and caches read-only blog stats', () => {
  const worker = read('workers/api/src/index.js');

  assert.match(worker, /pathname\.startsWith\('\/api\/integrations\/'\)/);
  assert.match(worker, /blogStatsCache/);
  assert.match(worker, /x-xhalo-cache/);
  assert.match(worker, /blog-stats-hit/);
  assert.match(worker, /isLiveWritesEnabled\(env\)/);
});
