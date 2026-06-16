import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.resolve('docs/phase096-owner-test-review-production-preview-gate.md');
const WORKFLOW_PATH = path.resolve('.github/workflows/check.yml');

describe('Production preview gate', () => {
  it('documents the no-production-write boundary and the required owner approval phrase', () => {
    const content = fs.readFileSync(DOC_PATH, 'utf8');

    assert.ok(content.includes('Phase 097 - Production Read-only Preview Verification'), 'Phase 096 document must name Phase 097');
    assert.ok(content.includes('No production direct publish is approved.'), 'Phase 096 document must state no production direct publish is approved');
    assert.ok(content.includes('No production direct update is approved.'), 'Phase 096 document must state no production direct update is approved');
    assert.ok(content.includes('No production R2 live upload is approved.'), 'Phase 096 document must state no production R2 live upload is approved');
    assert.ok(content.includes('No production queue live-write task is approved.'), 'Phase 096 document must state no production queue live-write task is approved');
    assert.ok(content.includes('read-only'), 'Phase 096 document must preserve read-only preview scope');
    assert.ok(content.includes('dry-run'), 'Phase 096 document must preserve dry-run preview scope');
    assert.ok(content.includes('auth-check'), 'Phase 096 document must preserve auth-check preview scope');
    assert.ok(
      content.includes('I approve Phase 097 production read-only preview verification. No production writes are approved.'),
      'Phase 096 document must contain the exact owner approval phrase'
    );
  });

  it('keeps the visible CI workflow validation-only', () => {
    const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');

    assert.ok(workflow.includes('npm run build:admin'), 'check.yml must include npm run build:admin');
    assert.ok(!workflow.includes('wrangler deploy'), 'check.yml must not include wrangler deploy');
    assert.ok(!workflow.includes('wrangler pages deploy'), 'check.yml must not include wrangler pages deploy');
  });
});
