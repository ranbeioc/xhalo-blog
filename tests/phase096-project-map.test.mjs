import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.resolve('docs/phase096-owner-test-review-production-preview-gate.md');

describe('Phase 096 project map', () => {
  it('documents the required Cloudflare project map and repository boundaries', () => {
    const content = fs.readFileSync(DOC_PATH, 'utf8');

    assert.ok(content.includes('xhalo-blog-test'), 'Phase 096 document must include xhalo-blog-test');
    assert.ok(content.includes('xhalo-blog-staging-api'), 'Phase 096 document must include xhalo-blog-staging-api');
    assert.ok(content.includes('xhalo-blog-staging-queue'), 'Phase 096 document must include xhalo-blog-staging-queue');
    assert.ok(content.includes('xhalo-blog-production-api'), 'Phase 096 document must include xhalo-blog-production-api');
    assert.ok(content.includes('xhalo-blog-production-queue'), 'Phase 096 document must include xhalo-blog-production-queue');

    assert.ok(content.includes('ranbeioc/xhalo-blog'), 'Phase 096 document must include the main source repository');
    assert.ok(content.includes('ranbeioc/hexo-blog'), 'Phase 096 document must include the production content repository');
    assert.ok(content.includes('ranbeioc/xhalo-admin'), 'Phase 096 document must include the global admin repository boundary');
  });

  it('does not require creating xhalo-blog-admin or treating xhalo-admin as the blog admin target', () => {
    const content = fs.readFileSync(DOC_PATH, 'utf8');

    assert.ok(content.includes('xhalo-blog-admin does not exist and is not needed'), 'Phase 096 document must explicitly reject xhalo-blog-admin');
    assert.ok(content.includes('Not used for xhalo-blog admin'), 'Phase 096 document must state xhalo-admin is not the blog admin target');
  });
});
