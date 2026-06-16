import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.resolve('docs');
const PHASE096_PATH = path.join(DOCS_DIR, 'phase096-owner-test-review-production-preview-gate.md');

describe('Admin real test links checks', () => {
  it('phase096 document must exist and record the real xhalo-blog-test links', () => {
    assert.ok(fs.existsSync(PHASE096_PATH), 'Phase 096 document must exist');
    const content = fs.readFileSync(PHASE096_PATH, 'utf8');

    assert.ok(content.includes('xhalo-blog-test'), 'Phase 096 document must contain xhalo-blog-test');
    assert.ok(content.includes('https://xhalo-blog-test.pages.dev/'), 'Phase 096 document must contain the real test home URL');
    assert.ok(content.includes('https://xhalo-blog-test.pages.dev/admin'), 'Phase 096 document must contain the real test admin URL');
    assert.ok(content.includes('GitHub account can authorize and login successfully.'), 'Phase 096 document must record the owner-reported OAuth result');
  });

  it('phase096 and supporting docs must not point the blog admin to xhalo-admin or xhalo-blog-admin pages URLs', () => {
    const phase096 = fs.readFileSync(PHASE096_PATH, 'utf8');
    const runbook = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-staging-preview-runbook.md'), 'utf8');
    const boundary = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-deployment-boundary.md'), 'utf8');

    for (const content of [phase096, runbook, boundary]) {
      assert.ok(!content.includes('xhalo-blog-admin.pages.dev'), 'Docs must not reference xhalo-blog-admin Pages URLs');
      assert.ok(!content.includes('xhalo-admin.pages.dev'), 'Docs must not reference xhalo-admin Pages URLs');
    }
  });
});
