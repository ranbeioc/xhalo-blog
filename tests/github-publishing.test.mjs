import test from 'node:test';
import assert from 'node:assert/strict';

import { createDirectMainCommit } from '../packages/core/src/index.js';

test('createDirectMainCommit creates file on main', async () => {
  let committedFile = false;
  let getFileAttempt = false;

  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = decodeURIComponent(parsedUrl.pathname);

    if (path.includes('/contents/source/_posts/test-post.md')) {
      if (!init.method || init.method === 'GET') {
        getFileAttempt = true;
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      }
      if (init.method === 'PUT') {
        committedFile = true;
        const body = JSON.parse(init.body);
        assert.equal(body.branch, 'main');
        assert.match(body.message, /^\[owner-direct\]/);
        return new Response(JSON.stringify({
          content: { path: 'source/_posts/test-post.md' },
          commit: { sha: 'direct-commit-sha-123' }
        }), { status: 201 });
      }
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const env = {
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  };

  const result = await createDirectMainCommit(env, {
    branch: 'main',
    filePath: 'source/_posts/test-post.md',
    content: 'hello main direct publish',
    commitMessage: 'add test post'
  });

  assert.ok(getFileAttempt);
  assert.ok(committedFile);
  assert.equal(result.commitSha, 'direct-commit-sha-123');
  assert.equal(result.commitUrl, 'https://github.com/test-owner/test-repo/commit/direct-commit-sha-123');
});

test('createDirectMainCommit fails if the target file already exists on main', async () => {
  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = decodeURIComponent(parsedUrl.pathname);

    if (path.includes('/contents/source/_posts/existing-post.md')) {
      if (!init.method || init.method === 'GET') {
        return new Response(JSON.stringify({ sha: 'existing-sha' }), { status: 200 });
      }
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const env = {
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  };

  await assert.rejects(
    async () => {
      await createDirectMainCommit(env, {
        branch: 'main',
        filePath: 'source/_posts/existing-post.md',
        content: 'should fail',
        commitMessage: 'should fail'
      });
    },
    (err) => {
      assert.equal(err.message, 'Target post already exists. Use explicit update flow in a separate phase.');
      return true;
    }
  );
});
