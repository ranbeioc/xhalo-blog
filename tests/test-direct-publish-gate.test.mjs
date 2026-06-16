import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../workers/api/src/index.js';
import { signSessionPayload } from '../packages/core/src/auth-github-oauth.js';

const adminSecret = 'session-secret-test-32-chars-long-secret-key-1234';

async function adminCookie() {
  const token = await signSessionPayload({
    login: 'first-admin',
    id: 101,
    role: 'admin',
    isAdmin: true,
    expiresAt: Date.now() + 86400000
  }, adminSecret);
  return `xhalo_admin_session=${encodeURIComponent(token)}`;
}

function createDbMock() {
  return {
    prepare() {
      return {
        bind() {
          return {
            async run() {
              return { success: true };
            }
          };
        }
      };
    }
  };
}

async function requestJson(pathname, body, env = {}) {
  const request = new Request(`https://example.com${pathname}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Cookie: await adminCookie()
    },
    body: JSON.stringify(body)
  });
  const response = await worker.fetch(request, {
    GITHUB_OAUTH_CLIENT_ID: 'client',
    GITHUB_OAUTH_CLIENT_SECRET: 'secret',
    ADMIN_SESSION_SECRET: adminSecret,
    DB: createDbMock(),
    ...env
  });
  return { response, json: await response.json() };
}

const validPost = {
  title: 'xHalo Blog 测试文章',
  slug: 'xhalo-blog-first-test-post',
  category: 'Test',
  tags: ['xhalo-blog', 'test', 'Cloudflare'],
  body: 'Valid test post body.'
};

test('test-direct publish rejects when TEST_DIRECT_PUBLISH_ENABLED=false', async () => {
  const { response, json } = await requestJson('/api/drafts/test-direct-publish', validPost, {
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'false'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'TEST_DIRECT_PUBLISH_DISABLED');
});

test('test-direct publish rejects when DEPLOYMENT_ENV is not test', async () => {
  const { response, json } = await requestJson('/api/drafts/test-direct-publish', validPost, {
    DEPLOYMENT_ENV: 'production',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'TEST_DIRECT_PUBLISH_DISABLED');
});

test('test-direct publish rejects when PUBLISH_MODE is not test_direct', async () => {
  const { response, json } = await requestJson('/api/drafts/test-direct-publish', validPost, {
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'owner_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'TEST_DIRECT_PUBLISH_DISABLED');
});

test('test-direct publish forbids ranbeioc/hexo-blog main', async () => {
  const { response, json } = await requestJson('/api/drafts/test-direct-publish', validPost, {
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true',
    GITHUB_OWNER: 'ranbeioc',
    GITHUB_REPO: 'hexo-blog',
    GITHUB_BRANCH: 'main'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'PRODUCTION_BRANCH_FORBIDDEN');
});

test('test-direct publish succeeds against test-safe mock GitHub target', async () => {
  let putPayload = null;
  const mockGithubFetch = async (url, init = {}) => {
    const parsedUrl = new URL(url);
    const path = decodeURIComponent(parsedUrl.pathname);
    if (path.includes('/contents/source/_posts/xhalo-blog-first-test-post.md')) {
      if (!init.method || init.method === 'GET') {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      }
      if (init.method === 'PUT') {
        putPayload = JSON.parse(init.body);
        return new Response(JSON.stringify({
          content: { path: 'source/_posts/xhalo-blog-first-test-post.md' },
          commit: { sha: 'test-direct-commit-sha' }
        }), { status: 201 });
      }
    }
    return new Response('{}', { status: 404 });
  };

  const { response, json } = await requestJson('/api/drafts/test-direct-publish', validPost, {
    DEPLOYMENT_ENV: 'test',
    PUBLISH_MODE: 'test_direct',
    TEST_DIRECT_PUBLISH_ENABLED: 'true',
    GITHUB_OWNER: 'ranbeioc',
    GITHUB_REPO: 'xhalo-blog-test',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.equal(json.mode, 'test_direct');
  assert.equal(json.targetRepo, 'ranbeioc/xhalo-blog-test');
  assert.equal(json.targetBranch, 'main');
  assert.equal(json.commitSha, 'test-direct-commit-sha');
  assert.match(putPayload.message, /^\[test-direct\]/);
});
