import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

test('open-source xhalo-blog repository does not contain root real content', () => {
  assert.equal(fs.existsSync(path.join(rootDir, 'source/_posts')), false, 'root source/_posts must not exist in xhalo-blog');
  assert.equal(fs.existsSync(path.join(rootDir, 'source/upload')), false, 'root source/upload must not exist in xhalo-blog');
  assert.equal(fs.existsSync(path.join(rootDir, 'CNAME')), false, 'production CNAME must not exist in xhalo-blog');
});

test('Phase 100 evidence records private Pages binding and public output', () => {
  const doc = read('docs/phase100-private-test-site-pages-verification.md');

  assert.match(doc, /ranbeioc\/xhalo-blog-test/);
  assert.match(doc, /xhalo-blog-test\.pages\.dev/);
  assert.match(doc, /Build output directory\s*\|\s*`public`/);
  assert.match(doc, /R2 is not a whole-site hosting layer/);
  assert.match(doc, /npm ci && npm run build/);
});

test('Phase 100 evidence keeps unrelated admin projects out of scope', () => {
  const doc = read('docs/phase100-private-test-site-pages-verification.md');

  assert.match(doc, /xhalo-admin` is not the blog Admin target/);
  assert.match(doc, /No `xhalo-blog-admin` Cloudflare Pages project is required/);
  assert.doesNotMatch(doc, /xhalo-admin\.pages\.dev/);
  assert.doesNotMatch(doc, /xhalo-blog-admin\.pages\.dev/);
});

test('single validation workflow has no deploy command', () => {
  const workflow = read('.github/workflows/check.yml');

  assert.match(workflow, /npm run build:test-pages/);
  assert.doesNotMatch(workflow, /wrangler\s+deploy/i);
  assert.doesNotMatch(workflow, /wrangler\s+pages\s+deploy/i);
});
