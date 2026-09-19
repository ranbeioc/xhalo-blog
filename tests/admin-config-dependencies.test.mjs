import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import worker from '../workers/api/src/index.js';
import { changedDependencies, findLockfile } from '../workers/api/src/lib/package-deps.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminSecret = 'config-deps-admin-secret';
const basePackage = { name: 'site', scripts: { build: 'hexo generate' }, dependencies: { hexo: '^8.1.2', 'hexo-theme-next': '^8.27.0' } };

test('changedDependencies lists added, removed and re-specified packages only', () => {
  const current = JSON.stringify(basePackage);
  assert.deepEqual(changedDependencies(current, JSON.stringify({ ...basePackage, scripts: { build: 'hexo g' } })), []);
  assert.deepEqual(changedDependencies(current, JSON.stringify({
    ...basePackage,
    dependencies: { hexo: '^8.2.0', 'hexo-filter-mathjax': 'latest' },
    devDependencies: { eslint: '^9.0.0' }
  })), [
    'dependencies:hexo',
    'dependencies:hexo-filter-mathjax',
    'dependencies:hexo-theme-next',
    'devDependencies:eslint'
  ]);
  assert.deepEqual(changedDependencies(current, '{not json'), []);
});

test('findLockfile treats a >1 MB lockfile (FILE_CONTENT_EMPTY) as present and rethrows real errors', async () => {
  const notFound = Object.assign(new Error('nf'), { status: 404 });
  const tooLarge = Object.assign(new Error('empty'), { status: 404, code: 'FILE_CONTENT_EMPTY' });
  assert.equal(await findLockfile(async () => { throw notFound; }), '');
  assert.equal(await findLockfile(async (p) => { if (p === 'package-lock.json') return {}; throw notFound; }), 'package-lock.json');
  assert.equal(await findLockfile(async (p) => { throw p === 'package-lock.json' ? tooLarge : notFound; }), 'package-lock.json');
  await assert.rejects(findLockfile(async () => { throw Object.assign(new Error('boom'), { status: 500 }); }), /boom/);
});

function mockGithub({ lockfile }) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    const u = decodeURIComponent(String(url));
    const method = init.method || 'GET';
    calls.push({ url: u, method });
    if (u.includes('/contents/package.json') && method === 'GET') {
      return new Response(JSON.stringify({ sha: 'sha-package', content: btoa(JSON.stringify(basePackage, null, 2)) }), { status: 200 });
    }
    if (u.includes('/contents/package-lock.json') && method === 'GET') {
      return lockfile
        ? new Response(JSON.stringify({ sha: 'sha-lock', content: btoa('{"lockfileVersion":3}') }), { status: 200 })
        : new Response('{"message":"Not Found"}', { status: 404 });
    }
    if (u.includes('/git/ref/heads/main')) return new Response(JSON.stringify({ object: { sha: 'head-1' } }), { status: 200 });
    if (u.includes('/git/commits/head-1') && method === 'GET') return new Response(JSON.stringify({ tree: { sha: 'tree-1' } }), { status: 200 });
    if (u.includes('/git/trees') && method === 'POST') return new Response(JSON.stringify({ sha: 'tree-2' }), { status: 200 });
    if (u.includes('/git/commits') && method === 'POST') return new Response(JSON.stringify({ sha: 'commit-config-1234567890' }), { status: 200 });
    if (u.includes('/git/refs/heads/main') && method === 'PATCH') return new Response(JSON.stringify({ object: { sha: 'commit-config-1234567890' } }), { status: 200 });
    return new Response('{"message":"Not Found"}', { status: 404 });
  };
  return { calls, fetch };
}

async function saveConfig(nextPackage, { lockfile }) {
  const github = mockGithub({ lockfile });
  const response = await worker.fetch(new Request('https://example.com/api/site/config/test-direct-update', {
    method: 'POST',
    headers: { 'x-xhalo-admin-secret': adminSecret, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [{ path: 'package.json', content: JSON.stringify(nextPackage, null, 2) }] })
  }), {
    ADMIN_API_SHARED_SECRET: adminSecret,
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true',
    TEST_TURNSTILE_BYPASS_ENABLED: 'true',
    TURNSTILE_SECRET_KEY: 'config-deps-turnstile',
    GITHUB_OWNER: 'ranbeioc',
    GITHUB_REPO: 'xhalo-blog-test',
    GITHUB_BRANCH: 'main',
    GITHUB_FETCH: github.fetch
  });
  return { response, json: await response.json(), commits: github.calls.filter((call) => call.method === 'PATCH').length, calls: github.calls };
}

test('config save refuses dependency changes when the site has a lockfile, without committing', async () => {
  const withPlugin = { ...basePackage, dependencies: { ...basePackage.dependencies, 'hexo-filter-mathjax': 'latest' } };
  const { response, json, commits } = await saveConfig(withPlugin, { lockfile: true });
  assert.equal(response.status, 409);
  assert.equal(json.code, 'DEPENDENCY_CHANGE_REQUIRES_LOCKFILE');
  assert.equal(json.lockfile, 'package-lock.json');
  assert.deepEqual(json.dependencyChanges, ['dependencies:hexo-filter-mathjax']);
  assert.equal(commits, 0);
});

test('config save still allows dependency changes for a site without a lockfile', async () => {
  const withPlugin = { ...basePackage, dependencies: { ...basePackage.dependencies, 'hexo-filter-mathjax': '^0.11.1' } };
  const { response, json, commits } = await saveConfig(withPlugin, { lockfile: false });
  assert.equal(response.status, 200, JSON.stringify(json));
  assert.equal(commits, 1);
});

test('config save allows non-dependency package.json edits without looking up the lockfile', async () => {
  const { response, json, commits, calls } = await saveConfig({ ...basePackage, scripts: { build: 'hexo generate --bail' } }, { lockfile: true });
  assert.equal(response.status, 200, JSON.stringify(json));
  assert.equal(commits, 1);
  assert.equal(calls.some((call) => call.url.includes('package-lock.json')), false);
});

test('admin configuration no longer maps pjax to a package or writes "latest" dependencies', () => {
  const config = fs.readFileSync(path.join(rootDir, 'apps/admin/src/modules/configuration.js'), 'utf8');
  assert.doesNotMatch(config, /theme-next-pjax/);
  assert.doesNotMatch(config, /'latest'/);
  assert.doesNotMatch(config, /pkgJson\.dependencies\s*=/);
  assert.match(config, /npm install \$\{detection\.packageName\}/);
});
