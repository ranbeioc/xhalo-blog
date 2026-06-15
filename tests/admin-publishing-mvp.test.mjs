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

import { readFileSync } from 'node:fs';
test('Admin UI Static Check: layout correctness', () => {
  const html = readFileSync('apps/admin/src/index.html', 'utf8');
  assert.ok(!html.includes('value="publish-d1"'));
  assert.ok(html.includes('name="ownerApprovedWindow"'));
  assert.ok(html.includes('data-field="draft-task-branch"'));
  assert.ok(html.includes('data-field="draft-task-error"'));
  assert.ok(html.includes('data-field="draft-task-retry-count"'));
  assert.ok(html.includes('data-field="draft-task-updated-at"'));

  // Direct Publish elements
  assert.ok(html.includes('id="owner-direct-publish-section"'));
  assert.ok(html.includes('id="direct-publish-confirm-check"'));
  assert.ok(html.includes('id="direct-publish-confirm-phrase"'));
  assert.ok(html.includes('id="btn-owner-direct-publish"'));
  assert.ok(html.includes('id="direct-publish-status-panel"'));
  assert.ok(html.includes('data-field="direct-publish-sha"'));
  assert.ok(html.includes('data-field="direct-publish-commit-url"'));
  assert.ok(html.includes('data-field="direct-publish-repo"'));
  assert.ok(html.includes('data-field="direct-publish-branch"'));
  assert.ok(html.includes('data-field="direct-publish-path"'));
  assert.ok(html.includes('data-field="direct-publish-build-note"'));
  assert.ok(html.includes('data-field="direct-publish-audit-id"'));
  assert.ok(html.includes('data-field="direct-publish-created-at"'));

  // Direct Update elements
  assert.ok(html.includes('id="edit-existing-article-section"'));
  assert.ok(html.includes('id="load-existing-slug"'));
  assert.ok(html.includes('id="btn-load-existing"'));
  assert.ok(html.includes('id="existing-article-meta"'));
  assert.ok(html.includes('id="existing-article-path"'));
  assert.ok(html.includes('id="existing-article-sha"'));
  assert.ok(html.includes('id="existing-article-loaded-at"'));

  assert.ok(html.includes('id="btn-preview-update-diff"'));
  assert.ok(html.includes('id="diff-preview-panel"'));
  assert.ok(html.includes('data-field="diff-target-path"'));
  assert.ok(html.includes('data-field="diff-base-sha"'));
  assert.ok(html.includes('data-field="diff-added-lines"'));
  assert.ok(html.includes('data-field="diff-removed-lines"'));
  assert.ok(html.includes('data-field="diff-frontmatter-changed"'));
  assert.ok(html.includes('data-field="diff-body-changed"'));
  assert.ok(html.includes('data-field="diff-text"'));

  assert.ok(html.includes('id="owner-direct-update-section"'));
  assert.ok(html.includes('id="direct-update-confirm-check"'));
  assert.ok(html.includes('id="direct-update-confirm-phrase"'));
  assert.ok(html.includes('id="btn-owner-direct-update"'));
  assert.ok(html.includes('id="direct-update-status-panel"'));
  assert.ok(html.includes('data-field="direct-update-sha"'));
  assert.ok(html.includes('data-field="direct-update-commit-url"'));
  assert.ok(html.includes('data-field="direct-update-repo"'));
  assert.ok(html.includes('data-field="direct-update-branch"'));
  assert.ok(html.includes('data-field="direct-update-path"'));
  assert.ok(html.includes('data-field="direct-update-old-sha"'));
  assert.ok(html.includes('data-field="direct-update-audit-id"'));
  assert.ok(html.includes('data-field="direct-update-updated-at"'));

  // Phase 081 OAuth/Media/Menu UI elements
  assert.ok(html.includes('id="panel-oauth-login"'));
  assert.ok(html.includes('id="oauth-user-info"'));
  assert.ok(html.includes('id="btn-github-login"'));
  assert.ok(html.includes('id="btn-github-logout"'));
  assert.ok(html.includes('id="btn-check-session"'));

  assert.ok(html.includes('id="panel-media-manager"'));
  assert.ok(html.includes('id="media-slug"'));
  assert.ok(html.includes('id="media-filename"'));
  assert.ok(html.includes('id="media-content-type"'));
  assert.ok(html.includes('id="media-storage-target"'));
  assert.ok(html.includes('id="media-size"'));
  assert.ok(html.includes('id="media-label"'));
  assert.ok(html.includes('id="media-preview-result"'));
  assert.ok(html.includes('id="btn-copy-media-snippet"'));

  assert.ok(html.includes('id="panel-menu-manager"'));
  assert.ok(html.includes('id="btn-load-menu"'));
  assert.ok(html.includes('id="menu-current-display"'));
  assert.ok(html.includes('id="menu-items-container"'));
  assert.ok(html.includes('id="menu-item-label"'));
  assert.ok(html.includes('id="menu-item-path"'));
  assert.ok(html.includes('id="menu-item-icon"'));
  assert.ok(html.includes('id="btn-preview-menu-diff"'));
  assert.ok(html.includes('id="menu-diff-result"'));
});

