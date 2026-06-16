import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const nodeCommand = process.execPath;
const scriptPath = path.join(rootDir, 'scripts', 'init-hexo-next-site.mjs');

test('init:hexo-next creates a NexT starter with default welcome article', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xhalo-starter-'));
  const target = path.join(tmp, 'site');

  const result = spawnSync(nodeCommand, [scriptPath, '--target', target, '--site-url', 'https://example.pages.dev'], {
    cwd: rootDir,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(target, '_config.yml')), true);
  assert.equal(fs.existsSync(path.join(target, 'source', '_posts', 'welcome-to-xhalo-blog.md')), true);
  assert.equal(fs.existsSync(path.join(target, 'source', '_headers')), true);

  const config = fs.readFileSync(path.join(target, '_config.yml'), 'utf8');
  assert.match(config, /^theme: next$/m);
  assert.match(config, /^url: https:\/\/example\.pages\.dev$/m);
  assert.match(config, /^deploy:\s*$/m);

  const manifest = JSON.parse(fs.readFileSync(path.join(target, '.xhalo-import-manifest.json'), 'utf8'));
  assert.equal(manifest.mode, 'starter-template');
  assert.ok(manifest.importedPosts >= 1);
});

test('init:hexo-next imports only safe Hexo paths and disables deploy targets', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xhalo-import-'));
  const source = path.join(tmp, 'source-blog');
  const target = path.join(tmp, 'target-site');

  writeFile(path.join(source, 'package.json'), '{"scripts":{"build":"hexo generate"}}\n');
  writeFile(path.join(source, '_config.yml'), [
    'title: Source Blog',
    'url: https://production.example.com',
    'theme: next',
    'deploy:',
    '  type: git',
    '  repo: git@github.com:owner/prod.git',
    '  branch: main',
    'permalink: :year/:month/:day/:title/',
    ''
  ].join('\n'));
  writeFile(path.join(source, 'source', '_posts', 'real-post.md'), '---\ntitle: Real Post\n---\nBody\n');
  writeFile(path.join(source, 'source', 'upload', 'asset.txt'), 'asset\n');
  writeFile(path.join(source, 'source', '_data', 'menu.yml'), 'menu: []\n');
  writeFile(path.join(source, 'themes', 'next', '_config.yml'), 'menu:\n  home: / || fa fa-home\n');
  writeFile(path.join(source, 'CNAME'), 'prod.example.com\n');
  writeFile(path.join(source, '.github', 'workflows', 'deploy.yml'), 'deploy\n');
  writeFile(path.join(source, 'public', 'index.html'), 'generated\n');
  writeFile(path.join(source, 'node_modules', 'left-pad', 'index.js'), 'module.exports = 1\n');
  writeFile(path.join(source, 'db.json'), '{}\n');

  const result = spawnSync(nodeCommand, [
    scriptPath,
    '--target',
    target,
    '--source',
    source,
    '--site-url',
    'https://test.pages.dev',
    '--site-title',
    'Test Blog'
  ], {
    cwd: rootDir,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(target, 'source', '_posts', 'real-post.md')), true);
  assert.equal(fs.existsSync(path.join(target, 'source', '_posts', 'welcome-to-xhalo-blog.md')), false);
  assert.equal(fs.existsSync(path.join(target, 'source', 'upload', 'asset.txt')), true);
  assert.equal(fs.existsSync(path.join(target, 'source', '_data', 'menu.yml')), true);
  assert.equal(fs.existsSync(path.join(target, 'themes', 'next', '_config.yml')), true);
  assert.equal(fs.existsSync(path.join(target, 'CNAME')), false);
  assert.equal(fs.existsSync(path.join(target, '.github')), false);
  assert.equal(fs.existsSync(path.join(target, 'public')), false);
  assert.equal(fs.existsSync(path.join(target, 'node_modules')), false);
  assert.equal(fs.existsSync(path.join(target, 'db.json')), false);

  const config = fs.readFileSync(path.join(target, '_config.yml'), 'utf8');
  assert.match(config, /^title: Test Blog$/m);
  assert.match(config, /^url: https:\/\/test\.pages\.dev$/m);
  assert.match(config, /^deploy:\s*$/m);
  assert.doesNotMatch(config, /git@github\.com/);

  const manifest = JSON.parse(fs.readFileSync(path.join(target, '.xhalo-import-manifest.json'), 'utf8'));
  assert.equal(manifest.mode, 'hexo-source-import');
  assert.equal(manifest.importedPosts, 1);
});

test('init:hexo-next refuses to overwrite non-empty targets', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xhalo-nonempty-'));
  const target = path.join(tmp, 'site');
  writeFile(path.join(target, 'existing.txt'), 'keep\n');

  const result = spawnSync(nodeCommand, [scriptPath, '--target', target], {
    cwd: rootDir,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Target directory must be empty/);
  assert.equal(fs.readFileSync(path.join(target, 'existing.txt'), 'utf8'), 'keep\n');
});

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}
