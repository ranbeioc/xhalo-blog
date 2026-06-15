import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  createDirectMainCommit,
  createDirectMainUpdateCommit,
  getPostFileFromMain,
  generateUnifiedDiff 
} from '../packages/core/src/index.js';

test('createDirectMainCommit creates file on main with unencoded path', async () => {
  let committedFile = false;
  let getFileAttempt = false;
  let putUrl = '';

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
        putUrl = url;
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
  assert.ok(putUrl.endsWith('/contents/source/_posts/test-post.md'));
  assert.ok(!putUrl.includes('%2F'));
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

test('getPostFileFromMain reads existing post from main', async () => {
  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = decodeURIComponent(parsedUrl.pathname);
    if (path.includes('/contents/source/_posts/test-post.md')) {
      const rawContent = `---\ntitle: "Test Title"\ndate: 2026-06-15\ntags:\n  - xhalo-blog\ncategories:\n  - notes\nsummary: "summary text"\nstatus: "published"\n---\n\nhello world body`;
      const base64Content = Buffer.from(rawContent).toString('base64');
      return new Response(JSON.stringify({
        content: base64Content,
        sha: 'mock-sha-456'
      }), { status: 200 });
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

  const result = await getPostFileFromMain(env, { slug: 'test-post' });
  assert.equal(result.slug, 'test-post');
  assert.equal(result.sha, 'mock-sha-456');
  assert.equal(result.frontmatter.title, 'Test Title');
  assert.deepEqual(result.frontmatter.tags, ['xhalo-blog']);
  assert.equal(result.body, 'hello world body');
});

test('createDirectMainUpdateCommit requires existing file', async () => {
  const mockGithubFetch = async (url, init) => {
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
      await createDirectMainUpdateCommit(env, {
        filePath: 'source/_posts/non-existing.md',
        content: 'new content',
        baseSha: 'some-sha',
        commitMessage: 'update post'
      });
    },
    { status: 404, code: 'TARGET_NOT_FOUND' }
  );
});

test('createDirectMainUpdateCommit requires baseSha', async () => {
  const env = {};
  await assert.rejects(
    async () => {
      await createDirectMainUpdateCommit(env, {
        filePath: 'source/_posts/test.md',
        content: 'new content',
        commitMessage: 'update post'
      });
    },
    /baseSha is required/
  );
});

test('createDirectMainUpdateCommit rejects stale baseSha', async () => {
  const mockGithubFetch = async (url, init) => {
    return new Response(JSON.stringify({ sha: 'new-server-sha' }), { status: 200 });
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
      await createDirectMainUpdateCommit(env, {
        filePath: 'source/_posts/test.md',
        content: 'new content',
        baseSha: 'stale-client-sha',
        commitMessage: 'update post'
      });
    },
    { status: 409, code: 'STALE_BASE_SHA' }
  );
});

test('createDirectMainUpdateCommit updates file with sha and unencoded path', async () => {
  let putRequestUrl = '';
  let putBody = null;

  const mockGithubFetch = async (url, init) => {
    if (!init.method || init.method === 'GET') {
      return new Response(JSON.stringify({ sha: 'current-sha-123' }), { status: 200 });
    }
    if (init.method === 'PUT') {
      putRequestUrl = url;
      putBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        content: { path: 'source/_posts/test.md' },
        commit: { sha: 'new-commit-sha-999' }
      }), { status: 200 });
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

  const result = await createDirectMainUpdateCommit(env, {
    filePath: 'source/_posts/test-post.md',
    content: 'updated content body',
    baseSha: 'current-sha-123',
    commitMessage: 'update post info'
  });

  assert.ok(putRequestUrl.endsWith('/contents/source/_posts/test-post.md'));
  assert.ok(!putRequestUrl.includes('%2F'));
  assert.equal(putBody.sha, 'current-sha-123');
  assert.match(putBody.message, /^\[owner-direct-update\]/);
  assert.equal(result.commitSha, 'new-commit-sha-999');
});

test('generateUnifiedDiff generates a unified diff with stats', () => {
  const oldText = `---\ntitle: "Old Title"\n---\nbody text line 1\nbody text line 2`;
  const newText = `---\ntitle: "New Title"\n---\nbody text line 1\nbody text line 2 modified`;
  
  const diff = generateUnifiedDiff(oldText, newText, 'article.md');
  assert.ok(diff.diffText.includes('--- a/article.md'));
  assert.ok(diff.diffText.includes('+++ b/article.md'));
  assert.ok(diff.frontmatterChanged);
  assert.ok(diff.bodyChanged);
  assert.ok(diff.addedLines > 0);
  assert.ok(diff.removedLines > 0);
});
