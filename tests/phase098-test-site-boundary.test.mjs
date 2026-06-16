import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

test('Phase 098 docs make xhalo-blog an open-source framework boundary only', () => {
  const docs = [
    read('README.md'),
    read('docs/phase098-test-site-boundary-correction.md'),
    read('docs/xhalo-blog-admin-staging-preview-runbook.md'),
    read('docs/xhalo-blog-admin-deployment-boundary.md')
  ].join('\n');

  assert.match(docs, /ranbeioc\/xhalo-blog-test/);
  assert.match(docs, /private real-content test site|private repository/);
  assert.match(docs, /npm ci && npm run build/);
  assert.match(docs, /Output directory.*public|output `public`/);
  assert.match(docs, /\/landing\//);
  assert.match(docs, /\/admin/);
  assert.match(docs, /R2 .*not .*whole-site hosting|R2 is not a whole-site hosting layer/i);
});

test('open-source framework repository does not contain root real blog content', () => {
  assert.equal(fs.existsSync(path.join(rootDir, 'source/_posts')), false, 'xhalo-blog must not contain root source/_posts');
  assert.equal(fs.existsSync(path.join(rootDir, 'source/upload')), false, 'xhalo-blog must not contain root source/upload');
  assert.equal(fs.existsSync(path.join(rootDir, 'CNAME')), false, 'xhalo-blog must not carry a production Pages CNAME');
});

test('docs keep xhalo-admin and xhalo-blog-admin out of the blog admin target', () => {
  const docs = [
    read('docs/phase098-test-site-boundary-correction.md'),
    read('docs/xhalo-blog-admin-staging-preview-runbook.md'),
    read('docs/xhalo-blog-admin-deployment-boundary.md')
  ].join('\n');

  assert.doesNotMatch(docs, /xhalo-admin\.pages\.dev/);
  assert.doesNotMatch(docs, /xhalo-blog-admin\.pages\.dev/);
  assert.match(docs, /xhalo-admin.*not used|not the blog admin target/i);
  assert.match(docs, /xhalo-blog-admin.*does not exist|No separate `xhalo-blog-admin`/);
});
