import test from 'node:test';
import assert from 'node:assert';
import {
  normalizeDraftInput,
  buildDraftFrontMatter,
  buildDraftFilePath,
  buildPullRequestBody,
  buildPullRequestPreview,
  validateDraftSlug,
  validateDraftPath,
  validateDraftInput
} from '../packages/core/src/index.js';

test('Admin Publishing MVP: normalizeDraftInput categories and tags', () => {
  const input1 = {
    title: 'Hello World',
    slug: 'hello-world',
    summary: 'A summary',
    body: 'Body text',
    categories: ['notes', 'tech'],
    tags: ['cloudflare', 'stage4'],
    status: 'review'
  };

  const norm1 = normalizeDraftInput(input1);
  assert.equal(norm1.title, 'Hello World');
  assert.equal(norm1.slug, 'hello-world');
  assert.equal(norm1.summary, 'A summary');
  assert.equal(norm1.body, 'Body text');
  assert.deepEqual(norm1.categories, ['notes', 'tech']);
  assert.deepEqual(norm1.tags, ['cloudflare', 'stage4']);
  assert.equal(norm1.status, 'review');
  assert.equal(norm1.category, 'notes'); // fallback category
});

test('Admin Publishing MVP: normalizeDraftInput fallback category', () => {
  const input2 = {
    title: 'Hello World',
    slug: 'hello-world',
    category: 'tech',
    tags: 'should-be-array-empty' // invalid tags format should become empty array
  };

  const norm2 = normalizeDraftInput(input2);
  assert.deepEqual(norm2.categories, ['tech']);
  assert.deepEqual(norm2.tags, []);
  assert.equal(norm2.category, 'tech');
});

test('Admin Publishing MVP: buildDraftFrontMatter outputs date, updated, categories array', () => {
  const input = {
    title: 'My Title',
    slug: 'my-title',
    date: '2026-06-15T00:00:00Z',
    updated: '2026-06-15T01:00:00Z',
    categories: ['tech', 'personal'],
    tags: ['stage4'],
    status: 'review'
  };

  const fm = buildDraftFrontMatter(input);
  assert.equal(fm.title, 'My Title');
  assert.equal(fm.date, '2026-06-15T00:00:00Z');
  assert.equal(fm.updated, '2026-06-15T01:00:00Z');
  assert.deepEqual(fm.categories, ['tech', 'personal']);
  assert.deepEqual(fm.tags, ['stage4']);
  assert.equal(fm.status, 'review');
});

test('Admin Publishing MVP: buildDraftFilePath checks source/_posts/', () => {
  const input = { slug: 'valid-slug' };
  const path = buildDraftFilePath(input);
  assert.equal(path, 'source/_posts/valid-slug.md');
});

test('Admin Publishing MVP: buildPullRequestBody contains safety checklist and review markers', () => {
  const draft = {
    title: 'Test PR Body',
    slug: 'test-pr-body',
    status: 'review',
    categories: ['news', 'updates'],
    tags: ['one', 'two']
  };

  const body = buildPullRequestBody(draft);
  assert.ok(body.includes('## Summary'));
  assert.ok(body.includes('## Article'));
  assert.ok(body.includes('- Title: Test PR Body'));
  assert.ok(body.includes('- Slug: test-pr-body'));
  assert.ok(body.includes('- Path: source/_posts/test-pr-body.md'));
  assert.ok(body.includes('- Status: review'));
  assert.ok(body.includes('- Categories: news, updates'));
  assert.ok(body.includes('- Tags: one, two'));
  assert.ok(body.includes('## Safety'));
  assert.ok(body.includes('- Direct main write: no'));
  assert.ok(body.includes('- Auto-merge: no'));
  assert.ok(body.includes('## Review Checklist'));
  assert.ok(body.includes('- [ ] Title is correct'));
  assert.ok(body.includes('- [ ] Slug is correct'));
});

test('Admin Publishing MVP: buildPullRequestPreview attaches pullRequestBody', () => {
  const input = {
    title: 'Preview Title',
    slug: 'preview-slug',
    status: 'draft'
  };
  const preview = buildPullRequestPreview(input, { repoOwner: 'owner-test', repoName: 'repo-test' });
  assert.equal(preview.pullRequestTitle, 'Add draft: Preview Title');
  assert.ok(preview.pullRequestBody);
  assert.ok(preview.pullRequestBody.includes('- Title: Preview Title'));
  assert.equal(preview.repository, 'owner-test/repo-test');
});

test('Core Validation: validateDraftSlug negative test cases', () => {
  assert.ok(validateDraftSlug(null).some(e => e.includes('Missing required field')));
  assert.ok(validateDraftSlug('').some(e => e.includes('slug cannot be empty')));
  assert.ok(validateDraftSlug('UPPERCASE').some(e => e.includes('slug contains invalid characters') || e.includes('lowercase')));
  assert.ok(validateDraftSlug('slug_with_underscore').some(e => e.includes('slug contains invalid characters')));
  assert.ok(validateDraftSlug('slug/with/slash').some(e => e.includes('Path traversal')));
  assert.ok(validateDraftSlug('slug\\with\\backslash').some(e => e.includes('Path traversal')));
  assert.ok(validateDraftSlug('../evil').some(e => e.includes('Path traversal')));
  assert.ok(validateDraftSlug('c:path').some(e => e.includes('Path traversal')));
  assert.ok(validateDraftSlug('-leading').some(e => e.includes('slug contains invalid characters')));
  assert.ok(validateDraftSlug('trailing-').some(e => e.includes('slug contains invalid characters')));
  assert.equal(validateDraftSlug('valid-slug-123').length, 0);
});

test('Core Validation: validateDraftPath validation boundaries', () => {
  assert.ok(validateDraftPath({ slug: '../evil' }).some(e => e.includes('Path traversal')));
  assert.ok(validateDraftPath({ slug: 'a\\b' }).some(e => e.includes('Path traversal')));
  assert.ok(validateDraftPath({ slug: 'c:path' }).some(e => e.includes('Path traversal')));
  assert.equal(validateDraftPath({ slug: 'valid-slug' }).length, 0);
});

test('Core Validation: validateDraftInput checks', () => {
  const missingBody = {
    title: 'Valid Title',
    slug: 'valid-slug',
    status: 'draft'
  };
  assert.ok(validateDraftInput(missingBody).some(e => e.includes('Missing required field: body')));

  const invalidStatus = {
    title: 'Valid Title',
    slug: 'valid-slug',
    status: 'invalid-status',
    body: 'Valid Body'
  };
  assert.ok(validateDraftInput(invalidStatus).some(e => e.includes('status must be')));

  const validDraftInput = {
    title: 'Valid Title',
    slug: 'valid-slug',
    status: 'draft',
    body: 'Valid Body'
  };
  assert.equal(validateDraftInput(validDraftInput).length, 0);
});

import { readFileSync, existsSync } from 'node:fs';
test('Admin UI Static Check: layout correctness', () => {
  const html = readFileSync('apps/admin/src/index.html', 'utf8');

  // New modular layout requires sidebar, topbar, content-area, and toast-container
  assert.ok(html.includes('id="sidebar"'), 'Missing sidebar element');
  assert.ok(html.includes('id="topbar"'), 'Missing topbar element');
  assert.ok(html.includes('id="content-area"'), 'Missing content-area element');
  assert.ok(html.includes('id="toast-container"'), 'Missing toast-container element');

  // Must load app.js as ES module
  assert.ok(html.includes('type="module"'), 'app.js must be loaded as ES module');
  assert.ok(html.includes('src="./app.js"'), 'Must reference ./app.js');

  // Must not contain old publish-d1 value
  assert.ok(!html.includes('value="publish-d1"'));

  // app.js must keep startup imports small and lazy-load route modules.
  const appJs = readFileSync('apps/admin/src/app.js', 'utf8');
  const expectedStaticImports = [
    './modules/auth.js',
    './modules/ui.js'
  ];
  for (const mod of expectedStaticImports) {
    assert.ok(appJs.includes(mod), `Missing static import in app.js: ${mod}`);
  }
  const expectedLazyImports = [
    './modules/dashboard.js',
    './modules/posts.js',
    './modules/editor.js',
    './modules/media.js',
    './modules/menus.js',
    './modules/publishing.js',
    './modules/audit.js',
    './modules/settings.js'
  ];
  for (const mod of expectedLazyImports) {
    assert.ok(appJs.includes(`import('${mod}')`), `Missing lazy import in app.js: ${mod}`);
    assert.ok(!appJs.includes(`from '${mod}'`), `Route module should not be statically imported: ${mod}`);
  }

  // Verify key module files exist
  const expectedModules = [
    'apps/admin/src/modules/api-client.js',
    'apps/admin/src/modules/auth.js',
    'apps/admin/src/modules/dashboard.js',
    'apps/admin/src/modules/posts.js',
    'apps/admin/src/modules/editor.js',
    'apps/admin/src/modules/media.js',
    'apps/admin/src/modules/menus.js',
    'apps/admin/src/modules/publishing.js',
    'apps/admin/src/modules/audit.js',
    'apps/admin/src/modules/settings.js',
    'apps/admin/src/modules/ui.js'
  ];
  for (const mod of expectedModules) {
    assert.ok(existsSync(mod), `Missing module file: ${mod}`);
  }

  // Editor module should have disabled direct publish buttons
  const editorJs = readFileSync('apps/admin/src/modules/editor.js', 'utf8');
  assert.ok(editorJs.includes('disabled'), 'Direct publish buttons should be disabled by default');

  // Publishing module should reference safety gates
  const publishingJs = readFileSync('apps/admin/src/modules/publishing.js', 'utf8');
  assert.ok(publishingJs.includes('Safety'), 'Publishing module should reference safety');
  assert.ok(publishingJs.includes('Gated'), 'Publishing module should reference gate status');

  // Media module should render snippet elements at runtime
  const mediaJs = readFileSync('apps/admin/src/modules/media.js', 'utf8');
  assert.ok(mediaJs.includes('media-slug'), 'Media module should include slug input');
  assert.ok(mediaJs.includes('media-filename'), 'Media module should include filename input');
  assert.ok(mediaJs.includes('btn-copy-snippet'), 'Media module should include copy button');

  // Menus module should render diff preview at runtime
  const menusJs = readFileSync('apps/admin/src/modules/menus.js', 'utf8');
  assert.ok(menusJs.includes('btn-preview-menu-diff'), 'Menus module should include diff button');
});

