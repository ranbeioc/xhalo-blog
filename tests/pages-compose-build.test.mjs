import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();

test('build:test-pages script is registered and assembles Pages output paths', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['build:test-pages'], 'node scripts/build-test-pages.mjs');

  const script = fs.readFileSync(path.join(rootDir, 'scripts/build-test-pages.mjs'), 'utf8');
  assert.match(script, /dist', 'pages'/);
  assert.match(script, /_worker\.js/);
  assert.match(script, /XHALO_ADMIN_API_BASE_URL/);
  assert.match(script, /posts\/\$\{post\.slug\}/);
});

test('dist/pages contains full test site after build:test-pages', () => {
  if (!fs.existsSync(path.join(rootDir, 'dist/pages/index.html'))) {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(npmCommand, ['run', 'build:test-pages'], {
      cwd: rootDir,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }

  const indexPath = path.join(rootDir, 'dist/pages/index.html');
  const adminPath = path.join(rootDir, 'dist/pages/admin/index.html');
  const postPath = path.join(rootDir, 'dist/pages/posts/xhalo-blog-first-test-post/index.html');
  const workerPath = path.join(rootDir, 'dist/pages/_worker.js');

  assert.equal(fs.existsSync(indexPath), true, 'dist/pages/index.html should exist');
  assert.equal(fs.existsSync(adminPath), true, 'dist/pages/admin/index.html should exist');
  assert.equal(fs.existsSync(postPath), true, 'first test article page should exist');
  assert.equal(fs.existsSync(workerPath), true, 'Pages _worker.js should exist');

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const worker = fs.readFileSync(workerPath, 'utf8');

  assert.match(indexHtml, /xHalo Blog 测试站/);
  assert.match(indexHtml, /xhalo-blog-first-test-post/);
  assert.match(worker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(worker, /wrangler deploy/);
});
