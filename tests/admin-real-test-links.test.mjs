import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.resolve('docs');
const EVIDENCE_PATH = path.join(DOCS_DIR, 'xhalo-blog-test-real-deployment-links-20260616.md');

describe('Admin Real Test Links checks', () => {
  it('Evidence file must exist and contain correct content references', () => {
    assert.ok(fs.existsSync(EVIDENCE_PATH), 'Evidence file must exist');
    const content = fs.readFileSync(EVIDENCE_PATH, 'utf8');

    assert.ok(!content.includes('your-account.workers.dev'), 'Evidence file must not contain placeholder your-account.workers.dev');
    assert.ok(!content.includes('<placeholder>'), 'Evidence file must not contain <placeholder>');
    assert.ok(!content.includes('<TODO>'), 'Evidence file must not contain <TODO>');
    
    assert.ok(content.includes('xhalo-blog-test'), 'Evidence file must contain project name xhalo-blog-test');
    assert.ok(content.includes('https://xhalo-blog-test.pages.dev/admin'), 'Evidence file must contain Admin path URL');
    assert.ok(content.includes('https://xhalo-blog-staging-api.ranbei.workers.dev/api/health'), 'Evidence file must contain Health path URL');
    assert.ok(content.includes('https://xhalo-blog-staging-api.ranbei.workers.dev/auth/github/start'), 'Evidence file must contain OAuth Start path URL');
  });

  it('No hardcoded xhalo-admin.pages.dev or xhalo-blog-admin.pages.dev is allowed in documentation', () => {
    const runbook = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-staging-preview-runbook.md'), 'utf8');
    const boundary = fs.readFileSync(path.join(DOCS_DIR, 'xhalo-blog-admin-deployment-boundary.md'), 'utf8');

    assert.ok(!runbook.includes('xhalo-blog-admin.pages.dev'), 'Runbook must not reference hardcoded xhalo-blog-admin Pages project URL');
    assert.ok(!boundary.includes('xhalo-blog-admin.pages.dev'), 'Boundary must not reference hardcoded xhalo-blog-admin Pages project URL');
    assert.ok(!runbook.includes('xhalo-admin.pages.dev'), 'Runbook must not reference hardcoded xhalo-admin Pages project URL');
    assert.ok(!boundary.includes('xhalo-admin.pages.dev'), 'Boundary must not reference hardcoded xhalo-admin Pages project URL');
  });
});
