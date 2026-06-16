import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Admin editor exposes Publish to Test only through test_direct readiness gates', () => {
  const editor = fs.readFileSync(path.join(rootDir, 'apps/admin/src/modules/editor.js'), 'utf8');

  assert.match(editor, /Publish to Test/);
  assert.match(editor, /\/api\/drafts\/test-direct-publish/);
  assert.match(editor, /deploymentEnv === 'test'/);
  assert.match(editor, /publishMode === 'test_direct'/);
  assert.match(editor, /testDirectPublishEnabled === true/);
  assert.match(editor, /testDirectTargetSafe === true/);
});

test('readiness snapshot exposes test_direct target fields for Admin UI', () => {
  const core = fs.readFileSync(path.join(rootDir, 'packages/core/src/index.js'), 'utf8');

  assert.match(core, /testDirectPublishEnabled/);
  assert.match(core, /testDirectTargetRepo/);
  assert.match(core, /testDirectTargetBranch/);
  assert.match(core, /testDirectTargetSafe/);
});
