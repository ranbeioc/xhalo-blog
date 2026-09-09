import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test runner
const mockStore = new Map();
globalThis.localStorage = {
  getItem(key) {
    return mockStore.has(key) ? mockStore.get(key) : null;
  },
  setItem(key, value) {
    mockStore.set(key, String(value));
  },
  removeItem(key) {
    mockStore.delete(key);
  },
  clear() {
    mockStore.clear();
  }
};

import {
  saveLocalDraft,
  getLocalDraft,
  removeLocalDraft,
  listLocalDrafts,
  hasUnsavedChanges
} from '../apps/admin/src/modules/storage.js';

test('storage: save and retrieve a local draft', () => {
  mockStore.clear();
  const draft = {
    title: 'My Test Post',
    category: 'Life',
    tags: 'test, blog',
    body: 'Hello world content',
    filePath: 'source/_posts/my-test-post.md'
  };

  const saved = saveLocalDraft('my-test-post', draft);
  assert.ok(saved);
  assert.equal(saved.slug, 'my-test-post');
  assert.equal(saved.title, 'My Test Post');
  assert.ok(saved.savedAt > 0);

  const retrieved = getLocalDraft('my-test-post');
  assert.deepEqual(retrieved.title, 'My Test Post');
  assert.deepEqual(retrieved.body, 'Hello world content');
});

test('storage: hasUnsavedChanges detects differences', () => {
  const serverPost = {
    title: 'Original Title',
    category: 'Tech',
    tags: 'js',
    body: 'Original text'
  };

  assert.equal(hasUnsavedChanges(serverPost, serverPost), false);

  const modifiedPost = {
    ...serverPost,
    body: 'Modified text'
  };
  assert.equal(hasUnsavedChanges(modifiedPost, serverPost), true);

  const modifiedTitle = {
    ...serverPost,
    title: 'New Title'
  };
  assert.equal(hasUnsavedChanges(modifiedTitle, serverPost), true);
});

test('storage: list and remove drafts', () => {
  mockStore.clear();
  saveLocalDraft('post-1', { title: 'Post 1', body: 'Body 1' });
  saveLocalDraft('post-2', { title: 'Post 2', body: 'Body 2' });

  const list = listLocalDrafts();
  assert.equal(list.length, 2);
  assert.ok(list.some((d) => d.slug === 'post-1'));
  assert.ok(list.some((d) => d.slug === 'post-2'));

  removeLocalDraft('post-1');
  assert.equal(getLocalDraft('post-1'), null);
  assert.ok(getLocalDraft('post-2'));
  assert.equal(listLocalDrafts().length, 1);
});
