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
  assert.equal(manifest.version, 2);
  assert.equal(manifest.mode, 'starter');
  assert.equal(manifest.sourceLabel, null);
  assert.ok(manifest.importedPosts >= 1);
  assert.ok(manifest.counts.configs >= 1);
  const pkg = fs.readFileSync(path.join(target, 'package.json'), 'utf8');
  assert.match(pkg, /hexo-theme-next/);
  assert.equal(fs.existsSync(path.join(target, '.xhalo-import-report.md')), true);
});

test('init:hexo-next imports full safe Hexo NexT project and reports rewrites', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xhalo-import-'));
  const source = path.join(tmp, 'source-blog');
  const target = path.join(tmp, 'target-site');

  writeFile(path.join(source, 'package.json'), JSON.stringify({
    scripts: {
      build: 'hexo generate',
      check: 'hexo generate --silent',
      deploy: 'hexo deploy'
    },
    dependencies: {
      hexo: '^7.0.0',
      '@waline/hexo-next': '^3.0.0',
      'hexo-generator-feed': '^3.0.0',
      'hexo-generator-searchdb': '^1.5.0',
      'hexo-generator-sitemap': '^3.0.0',
      'hexo-tag-mmedia': '^1.0.0'
    }
  }, null, 2));
  writeFile(path.join(source, 'package-lock.json'), '{"lockfileVersion":3}\n');
  writeFile(path.join(source, '_config.yml'), [
    'title: Source Blog',
    'url: https://production.example.com',
    'theme: next',
    'skip_render:',
    '  - custom/raw/**',
    'feed:',
    '  type: atom',
    'search:',
    '  path: search.xml',
    'mmedia:',
    '  enabled: true',
    'deploy:',
    '  type: git',
    '  repo: git@github.com:owner/prod.git',
    '  branch: main',
    'permalink: :year/:month/:day/:title/',
    ''
  ].join('\n'));
  writeFile(path.join(source, '_config.next.yml'), [
    'menu:',
    '  home: / || fa fa-home',
    '  archives: /archives/ || fa fa-archive',
    'waline:',
    '  enable: true',
    ''
  ].join('\n'));
  writeFile(path.join(source, '_config.custom.yml'), 'custom_feature: true\n');
  writeFile(path.join(source, 'source', '_posts', 'real-post.md'), '---\ntitle: Real Post\n---\nBody\n');
  writeFile(path.join(source, 'source', 'upload', 'asset.txt'), 'asset\n');
  writeFile(path.join(source, 'source', '_data', 'menu.yml'), 'menu: []\n');
  writeFile(path.join(source, 'source', 'about', 'index.md'), '---\ntitle: About\n---\nAbout\n');
  writeFile(path.join(source, 'source', 'project', 'index.md'), '---\ntitle: Project\n---\nProject\n');
  writeFile(path.join(source, 'source', 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://production.example.com/sitemap.xml\n');
  writeFile(path.join(source, 'source', '_headers'), '/\n  X-Test: ok\n');
  writeFile(path.join(source, 'scaffolds', 'post.md'), '---\ntitle: {{ title }}\n---\n');
  writeFile(path.join(source, 'scripts', 'custom-helper.js'), 'hexo.extend.filter.register("before_post_render", data => data);\n');
  writeFile(path.join(source, 'scripts', 'check-rb-blog-config.js'), "const expected = 'https://production.example.com';\n");
  writeFile(path.join(source, 'themes', 'next', '_config.yml'), 'scheme: Muse\n');
  writeFile(path.join(source, 'themes', 'next', 'source', 'css', 'main.styl'), 'body\n  color #333\n');
  writeFile(path.join(source, 'CNAME'), 'prod.example.com\n');
  writeFile(path.join(source, '.github', 'workflows', 'deploy.yml'), 'deploy\n');
  writeFile(path.join(source, '.env.production'), 'TOKEN=secret\n');
  writeFile(path.join(source, 'public', 'index.html'), 'generated\n');
  writeFile(path.join(source, 'node_modules', 'left-pad', 'index.js'), 'module.exports = 1\n');
  writeFile(path.join(source, 'db.json'), '{}\n');

  const result = spawnSync(nodeCommand, [
    scriptPath,
    '--target',
    target,
    '--source',
    source,
    '--mode',
    'import',
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
  assert.equal(fs.existsSync(path.join(target, 'source', 'about', 'index.md')), true);
  assert.equal(fs.existsSync(path.join(target, 'source', 'project', 'index.md')), true);
  assert.equal(fs.existsSync(path.join(target, 'scaffolds', 'post.md')), true);
  assert.equal(fs.existsSync(path.join(target, 'scripts', 'custom-helper.js')), true);
  assert.equal(fs.existsSync(path.join(target, 'themes', 'next', '_config.yml')), true);
  assert.equal(fs.existsSync(path.join(target, 'themes', 'next', 'source', 'css', 'main.styl')), true);
  assert.equal(fs.existsSync(path.join(target, '_config.next.yml')), true);
  assert.equal(fs.existsSync(path.join(target, '_config.custom.yml')), true);
  assert.equal(fs.existsSync(path.join(target, 'package-lock.json')), true);
  assert.equal(fs.existsSync(path.join(target, 'CNAME')), false);
  assert.equal(fs.existsSync(path.join(target, '.github')), false);
  assert.equal(fs.existsSync(path.join(target, '.env.production')), false);
  assert.equal(fs.existsSync(path.join(target, 'public')), false);
  assert.equal(fs.existsSync(path.join(target, 'node_modules')), false);
  assert.equal(fs.existsSync(path.join(target, 'db.json')), false);

  const config = fs.readFileSync(path.join(target, '_config.yml'), 'utf8');
  assert.match(config, /^title: Test Blog$/m);
  assert.match(config, /^url: https:\/\/test\.pages\.dev$/m);
  assert.match(config, /^deploy:\s*$/m);
  assert.match(config, /skip_render:\n(?:  - .+\n)*  - _worker\.js/m);
  assert.match(config, /  - admin\/\*\*/);
  assert.match(config, /  - landing\/\*\*/);
  assert.match(config, /  - custom\/raw\/\*\*/);
  assert.doesNotMatch(config, /git@github\.com/);

  const nextConfig = fs.readFileSync(path.join(target, '_config.next.yml'), 'utf8');
  assert.match(nextConfig, /archives: \/archives\/ \|\| fa fa-archive/);
  assert.match(nextConfig, /waline:/);

  const pkg = fs.readFileSync(path.join(target, 'package.json'), 'utf8');
  assert.match(pkg, /@waline\/hexo-next/);
  assert.match(pkg, /hexo-generator-searchdb/);
  assert.match(pkg, /hexo-tag-mmedia/);
  assert.doesNotMatch(pkg, /"deploy"/);

  const robots = fs.readFileSync(path.join(target, 'source', 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/test\.pages\.dev\/sitemap\.xml/);
  assert.doesNotMatch(robots, /production\.example\.com/);

  const configCheck = fs.readFileSync(path.join(target, 'scripts', 'check-rb-blog-config.js'), 'utf8');
  assert.match(configCheck, /https:\/\/test\.pages\.dev/);
  assert.doesNotMatch(configCheck, /production\.example\.com/);

  const manifest = JSON.parse(fs.readFileSync(path.join(target, '.xhalo-import-manifest.json'), 'utf8'));
  assert.equal(manifest.version, 2);
  assert.equal(manifest.mode, 'import');
  assert.equal(manifest.sourceLabel, 'source-blog');
  assert.equal(manifest.importedPosts, 1);
  assert.equal(manifest.counts.posts, 1);
  assert.equal(manifest.counts.uploads, 1);
  assert.equal(manifest.counts.dataFiles, 1);
  assert.ok(manifest.counts.themeFiles >= 2);
  assert.ok(manifest.counts.scripts >= 1);
  assert.ok(manifest.counts.configs >= 3);
  assert.ok(manifest.rewritten.some((entry) => entry.field === 'url'));
  assert.ok(manifest.rewritten.some((entry) => entry.path === 'source/robots.txt'));
  assert.ok(manifest.rewritten.some((entry) => entry.path === 'scripts/check-rb-blog-config.js'));
  assert.ok(manifest.disabled.some((entry) => entry.field === 'deploy'));
  assert.ok(manifest.disabled.some((entry) => entry.field === 'scripts.deploy'));
  assert.ok(manifest.needsReview.some((entry) => /waline/i.test(entry.reason)));
  assert.ok(manifest.blocked.some((entry) => entry.reason.includes('environment file')));
  assert.ok(manifest.blocked.some((entry) => entry.path.includes('CNAME')));

  const report = fs.readFileSync(path.join(target, '.xhalo-import-report.md'), 'utf8');
  assert.match(report, /# xHalo Hexo\/NexT Import Report/);
  assert.match(report, /Mode: import/);
  assert.match(report, /Posts: 1/);
  assert.match(report, /Production deploy targets disabled/);
  assert.doesNotMatch(report, new RegExp(escapeRegExp(tmp)));
});

test('init:hexo-next infers import mode from source and rejects invalid mode combinations', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xhalo-mode-'));
  const source = path.join(tmp, 'source-blog');
  const target = path.join(tmp, 'target-site');
  writeFile(path.join(source, '_config.yml'), 'title: Source\n');
  writeFile(path.join(source, 'source', '_posts', 'real-post.md'), '---\ntitle: Real\n---\n');

  const inferred = spawnSync(nodeCommand, [scriptPath, '--target', target, '--source', source], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  assert.equal(inferred.status, 0, inferred.stderr || inferred.stdout);
  const manifest = JSON.parse(fs.readFileSync(path.join(target, '.xhalo-import-manifest.json'), 'utf8'));
  assert.equal(manifest.mode, 'import');

  const invalid = spawnSync(nodeCommand, [scriptPath, '--target', path.join(tmp, 'invalid'), '--mode', 'import'], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /requires --source/);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
