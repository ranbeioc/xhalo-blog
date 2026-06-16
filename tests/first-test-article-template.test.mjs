import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { firstTestArticleTemplate } from '../packages/core/src/index.js';

const rootDir = process.cwd();

test('first test article template has fixed Phase 097-B identity', () => {
  assert.equal(firstTestArticleTemplate.title, 'xHalo Blog 测试文章');
  assert.equal(firstTestArticleTemplate.slug, 'xhalo-blog-first-test-post');
  assert.equal(firstTestArticleTemplate.category, 'Test');
  assert.deepEqual(firstTestArticleTemplate.tags, ['xhalo-blog', 'test', 'Cloudflare']);
});

test('Admin editor includes matching first test article template', () => {
  const editor = fs.readFileSync(path.join(rootDir, 'apps/admin/src/modules/editor.js'), 'utf8');
  assert.match(editor, /FIRST_TEST_ARTICLE_TEMPLATE/);
  assert.match(editor, /xHalo Blog 测试文章/);
  assert.match(editor, /xhalo-blog-first-test-post/);
  assert.match(editor, /xhalo-blog, test, Cloudflare/);
});
