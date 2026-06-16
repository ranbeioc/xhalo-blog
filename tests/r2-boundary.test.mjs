import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Phase 097-A evidence documents Pages hosting and R2 asset-only boundary', () => {
  const evidencePath = path.join(rootDir, 'docs/phase097a-pages-full-blog-admin-compose-evidence.md');
  assert.equal(fs.existsSync(evidencePath), true);

  const evidence = fs.readFileSync(evidencePath, 'utf8');
  assert.match(evidence, /Cloudflare Pages/);
  assert.match(evidence, /npm run build:test-pages/);
  assert.match(evidence, /dist\/pages/);
  assert.match(evidence, /R2 only retains media\/attachment asset responsibilities|R2 只保留为媒体\/附件资产层/);
  assert.doesNotMatch(evidence, /R2\s+whole-site hosting/i);
  assert.doesNotMatch(evidence, /R2\s+整站托管/);
});

test('Pages build script does not route whole-site HTML through R2', () => {
  const script = fs.readFileSync(path.join(rootDir, 'scripts/build-test-pages.mjs'), 'utf8');
  assert.match(script, /Static HTML\/Admin assets are served by Pages/);
  assert.match(script, /R2 remains media\/assets only/);
  assert.doesNotMatch(script, /ASSETS\.put\(/);
});
