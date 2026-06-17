import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

test('Phase 101 evidence records test-direct target and live route results', () => {
  const doc = read('docs/phase101-test-direct-publish-e2e-evidence.md');

  assert.match(doc, /https:\/\/xhalo-blog-test\.pages\.dev\/admin/);
  assert.match(doc, /https:\/\/xhalo-blog-test\.pages\.dev\/posts\/xhalo-blog-first-test-post\//);
  assert.match(doc, /ranbeioc\/xhalo-blog-test@main/);
  assert.match(doc, /2902b284-f34e-40da-baef-79b75abb3c2b/);
  assert.match(doc, /POST \/api\/drafts\/test-direct-publish -> 401/);
});

test('Phase 101 evidence records the OAuth blocker instead of forging success', () => {
  const doc = read('docs/phase101-test-direct-publish-e2e-evidence.md');

  assert.match(doc, /E2E_BLOCKED_LIVE_OAUTH_SESSION_REQUIRED/);
  assert.match(doc, /No test-direct publish commit was created/);
  assert.match(doc, /No new Pages rebuild was triggered/);
  assert.match(doc, /Blocked, not passed/);
});

test('Phase 101 evidence records no production write boundary', () => {
  const doc = read('docs/phase101-test-direct-publish-e2e-evidence.md');

  assert.match(doc, /No ranbeioc\/hexo-blog@main mutation occurred/);
  assert.match(doc, /No production direct publish occurred/);
  assert.match(doc, /No production direct update occurred/);
  assert.match(doc, /No production R2 live upload occurred/);
  assert.match(doc, /No xhalo-admin project was modified/);
  assert.match(doc, /No xhalo-blog-admin project was created/);
  assert.match(doc, /No secrets were logged or committed/);
});

test('Phase 101 evidence records the stale article route mismatch', () => {
  const doc = read('docs/phase101-test-direct-publish-e2e-evidence.md');

  assert.match(doc, /ARTICLE_ROUTE_SOURCE_MISMATCH/);
  assert.match(doc, /source\/_posts\/xhalo-blog-first-test-post\.md: missing/);
  assert.match(doc, /older hand-written Phase 097 static article page/);
  assert.match(doc, /HOME_PAGE_NOT_UPDATED/);
});
