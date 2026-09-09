/**
 * Local storage utility for managing draft autosaves and offline post cache.
 */

const DRAFT_KEY_PREFIX = 'xhalo_draft_';
const DRAFTS_INDEX_KEY = 'xhalo_drafts_index';

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

function isStorageAvailable() {
  try {
    const storage = getStorage();
    if (!storage) return false;
    const testKey = '__xhalo_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getDraftIndex() {
  const storage = getStorage();
  if (!storage || !isStorageAvailable()) return [];
  try {
    const raw = storage.getItem(DRAFTS_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDraftIndex(index) {
  const storage = getStorage();
  if (!storage || !isStorageAvailable()) return;
  try {
    storage.setItem(DRAFTS_INDEX_KEY, JSON.stringify(index));
  } catch {
    // Ignore storage quota errors
  }
}

export function saveLocalDraft(slug, draft) {
  if (!isStorageAvailable() || !slug) return null;
  const key = `${DRAFT_KEY_PREFIX}${slug}`;
  const record = {
    slug,
    title: draft.title || '',
    category: draft.category || '',
    tags: draft.tags || '',
    body: draft.body || '',
    filePath: draft.filePath || '',
    savedAt: Date.now()
  };

  try {
    const storage = getStorage();
    if (!storage) return null;
    storage.setItem(key, JSON.stringify(record));
    const index = getDraftIndex();
    if (!index.includes(slug)) {
      index.unshift(slug);
      saveDraftIndex(index.slice(0, 50)); // Keep max 50 recent drafts in index
    }
    return record;
  } catch {
    return null;
  }
}

export function getLocalDraft(slug) {
  if (!isStorageAvailable() || !slug) return null;
  const key = `${DRAFT_KEY_PREFIX}${slug}`;
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeLocalDraft(slug) {
  if (!isStorageAvailable() || !slug) return;
  const key = `${DRAFT_KEY_PREFIX}${slug}`;
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(key);
    const index = getDraftIndex().filter((item) => item !== slug);
    saveDraftIndex(index);
  } catch {
    // Ignore errors
  }
}

export function listLocalDrafts() {
  if (!isStorageAvailable()) return [];
  const index = getDraftIndex();
  const drafts = [];
  for (const slug of index) {
    const draft = getLocalDraft(slug);
    if (draft) {
      drafts.push(draft);
    }
  }
  return drafts.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

export function hasUnsavedChanges(currentDraft, savedDraft) {
  if (!savedDraft) return false;
  return (
    (currentDraft.title || '') !== (savedDraft.title || '') ||
    (currentDraft.body || '') !== (savedDraft.body || '') ||
    (currentDraft.category || '') !== (savedDraft.category || '') ||
    (currentDraft.tags || '') !== (savedDraft.tags || '')
  );
}
