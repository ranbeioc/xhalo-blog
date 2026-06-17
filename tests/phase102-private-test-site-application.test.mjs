import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const evidencePath = path.join(root, 'docs', 'phase102-private-test-site-application-evidence.md');

test('Phase 102 private test-site application evidence records repo and deployment boundaries', () => {
  const doc = fs.readFileSync(evidencePath, 'utf8');

  assert.match(doc, /ranbeioc\/xhalo-blog-test@main/);
  assert.match(doc, /ranbeioc\/hexo-blog@main/);
  assert.match(doc, /xhalo-blog-test\.pages\.dev/);
  assert.match(doc, /125d9fed0dc70b901a1d77d10e1dc17a7b1b4d6a/);
  assert.match(doc, /bf27abca-73f4-4990-b553-206bbf82819c/);
  assert.match(doc, /npm ci && npm run build/);
  assert.match(doc, /Output directory: `public`/);
  assert.match(doc, /public\/?_worker\.js|public\\_worker\.js/);
});

test('Phase 102 private test-site application evidence records live route verification', () => {
  const doc = fs.readFileSync(evidencePath, 'utf8');

  assert.match(doc, /\/landing\/` returned `200`/);
  assert.match(doc, /\/admin\/` returned `200`/);
  assert.match(doc, /\/api\/auth\/session` returned `200`/);
  assert.match(doc, /\/2026\/06\/14\/xhalo-holy-project-review\/` returned `200`/);
  assert.match(doc, /menu links for `\/landing\/` and `\/admin\/`/);
});

test('Phase 102 private test-site application evidence keeps unsafe writes and private content out of xhalo-blog', () => {
  const doc = fs.readFileSync(evidencePath, 'utf8');

  assert.match(doc, /No `ranbeioc\/hexo-blog@main` write was performed/);
  assert.match(doc, /No private article body or upload asset was committed to `ranbeioc\/xhalo-blog`/);
  assert.match(doc, /No secret, token, deploy hook, or OAuth credential was committed/);

  assert.equal(fs.existsSync(path.join(root, 'source', '_posts')), false);
  assert.equal(fs.existsSync(path.join(root, 'source', 'upload')), false);
  assert.equal(fs.existsSync(path.join(root, 'CNAME')), false);
});
