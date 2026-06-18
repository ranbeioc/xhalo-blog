import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../workers/api/src/index.js';

const adminSecret = 'test-admin-secret';

async function requestJson(pathname, init = {}, env = {}) {
  const request = new Request(`https://example.com${pathname}`, init);
  const response = await worker.fetch(request, env);
  const json = await response.json();
  return { response, json };
}

test('GET /api/health is public', async () => {
  const { response, json } = await requestJson('/api/health');
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
});

test('GET /api/scaffold is public', async () => {
  const { response, json } = await requestJson('/api/scaffold');
  assert.equal(response.status, 200);
  assert.equal(json.repo, 'xhalo-blog');
});

test('GET /api/readiness returns 401 when admin secret is not configured', async () => {
  const { response, json } = await requestJson('/api/readiness');
  assert.equal(response.status, 401);
  assert.match(json.error, /Unauthorized admin API request/);
});

test('GET /api/readiness returns 200 with the correct admin secret', async () => {
  const { response, json } = await requestJson('/api/readiness', {
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 200);
  assert.ok(json.summary);
});

test('GET /api/posts returns 401 without the required admin header', async () => {
  const { response, json } = await requestJson('/api/posts', {}, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });
  assert.equal(response.status, 401);
  assert.match(json.error, /Unauthorized admin API request/);
});

test('GET /api/posts lists migrated GitHub source posts when available', async () => {
  const rawPost = [
    '---',
    'title: "历史文章一"',
    'date: 2020-01-02',
    'tags:',
    '  - imported',
    'categories:',
    '  - Blog',
    '---',
    '',
    '历史正文第一段。'
  ].join('\n');
  const mockGithubFetch = async (url) => {
    const decodedUrl = decodeURIComponent(String(url));
    if (decodedUrl.includes('/git/ref/heads/main')) {
      return new Response(JSON.stringify({ object: { sha: 'head-sha-123' } }), { status: 200 });
    }
    if (decodedUrl.includes('/git/trees/head-sha-123?recursive=1')) {
      return new Response(JSON.stringify({
        tree: [
          { type: 'blob', path: 'source/_posts/2020-01-02-history-post.md' },
          { type: 'blob', path: 'source/about/index.md' }
        ]
      }), { status: 200 });
    }
    if (decodedUrl.includes('/contents/source/_posts/2020-01-02-history-post.md')) {
      return new Response(JSON.stringify({
        sha: 'post-sha-123',
        content: Buffer.from(rawPost).toString('base64')
      }), { status: 200 });
    }
    return new Response('', { status: 404 });
  };

  const { response, json } = await requestJson('/api/posts', {
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.equal(json.backend, 'github');
  assert.equal(json.source_of_truth, 'git');
  assert.equal(json.count, 1);
  assert.equal(json.items[0].title, '历史文章一');
  assert.equal(json.items[0].slug, '2020-01-02-history-post');
  assert.equal(json.items[0].filePath, 'source/_posts/2020-01-02-history-post.md');
});

test('POST /api/drafts/publish dry-run returns 401 without admin secret', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Draft title',
      mode: 'dry-run'
    })
  });

  assert.equal(response.status, 401);
  assert.match(json.error, /Unauthorized admin API request/);
});

test('POST /api/drafts/publish live returns 403 when live writes are disabled', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Draft title',
      slug: 'draft-title',
      body: 'Valid post body content',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 403);
  assert.equal(json.required_env, 'LIVE_WRITES_ENABLED=true');
});

test('POST /api/assets/r2-upload live returns 403 when live writes are disabled', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: 'demo.txt',
      contentType: 'text/plain',
      content: 'hello',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 403);
  assert.equal(json.required_env, 'LIVE_WRITES_ENABLED=true');
});

test('POST /webhooks/github returns 403 without webhook secret', async () => {
  const { response, json } = await requestJson('/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'pull_request'
    },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 403);
  assert.match(json.error, /GITHUB_WEBHOOK_SECRET is required/);
});

test('POST /webhooks/deployments/preview returns 403 without webhook secret', async () => {
  const { response, json } = await requestJson('/webhooks/deployments/preview', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 403);
  assert.match(json.error, /PREVIEW_WEBHOOK_SECRET is required/);
});

test('POST /api/drafts/publish with admin secret but missing Turnstile token when TURNSTILE_SECRET_KEY is configured returns 403', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Draft title',
      slug: 'draft-title',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret'
  });

  assert.equal(response.status, 403);
  assert.match(json.error, /Turnstile verification failed/);
});

test('POST /api/drafts/publish with incorrect Turnstile token returns 403', async () => {
  const mockTurnstileFetch = async (url, init) => {
    return {
      ok: true,
      json: async () => ({ success: false })
    };
  };

  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret,
      'x-xhalo-turnstile-token': 'bad-token'
    },
    body: JSON.stringify({
      title: 'Draft title',
      slug: 'draft-title',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    TURNSTILE_FETCH: mockTurnstileFetch
  });

  assert.equal(response.status, 403);
  assert.match(json.error, /Turnstile verification failed/);
});

test('POST /api/drafts/publish with valid Turnstile token passes verification', async () => {
  let fetchedUrl = '';
  let fetchedBody = '';
  const mockTurnstileFetch = async (url, init) => {
    fetchedUrl = url;
    fetchedBody = init.body;
    return {
      ok: true,
      json: async () => ({ success: true })
    };
  };

  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret,
      'cf-turnstile-token': 'good-token',
      'cf-connecting-ip': '1.2.3.4'
    },
    body: JSON.stringify({
      title: 'Draft title',
      slug: 'draft-title',
      body: 'Valid post body content',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    TURNSTILE_FETCH: mockTurnstileFetch
  });

  assert.equal(response.status, 403);
  assert.equal(json.required_env, 'LIVE_WRITES_ENABLED=true');
  assert.equal(fetchedUrl, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.ok(fetchedBody.includes('secret=test-turnstile-secret'));
  assert.ok(fetchedBody.includes('response=good-token'));
  assert.ok(fetchedBody.includes('remoteip=1.2.3.4'));
});

test('POST /api/drafts/publish with direct D1 target successfully persists and returns D1 metadata', async () => {
  let allSql = [];
  let prepBind = [];
  let prepRunCalled = false;
  let enqueued = false;
  let taskPayload = null;

  const mockQueue = {
    send: async (payload) => {
      enqueued = true;
      taskPayload = payload;
    }
  };

  const mockDb = {
    prepare: (sql) => {
      allSql.push(sql);
      return {
        bind: (...args) => {
          if (sql.includes('INSERT INTO posts_index')) {
            prepBind = args;
          }
          return {
            run: async () => {
              prepRunCalled = true;
              return { success: true };
            }
          };
        }
      };
    }
  };

  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'D1 Only Post',
      slug: 'd1-only-post',
      body: 'This post is stored directly in D1.',
      publish_target: 'd1',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'true',
    TASK_QUEUE: mockQueue,
    DB: mockDb
  });

  assert.equal(response.status, 202);
  assert.equal(json.mode, 'live');
  assert.equal(json.status, 'queued');
  assert.ok(json.task_id);
  assert.ok(enqueued);
  assert.equal(taskPayload.payload.publish_target, 'd1');
  assert.ok(prepRunCalled);
  assert.ok(allSql.some(sql => sql.includes('INSERT INTO posts_index')));
  assert.equal(prepBind[1], 'd1-only-post'); // slug
  assert.equal(prepBind[2], 'D1 Only Post'); // title
  assert.ok(prepBind[11].includes('This post is stored directly in D1.')); // content
});

function makeMockJwt(header, payload) {
  const encode = (str) => {
    let base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  return encode(JSON.stringify(header)) + '.' + encode(JSON.stringify(payload)) + '.mock-signature';
}

test('GET /api/readiness with valid Cloudflare Access JWT authorizes successfully', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    {
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'https://test-team.cloudflareaccess.com',
      aud: 'test-audience-tag'
    }
  );

  const { response, json } = await requestJson('/api/readiness', {
    headers: {
      'cf-access-jwt-assertion': jwt
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    ACCESS_TEAM_DOMAIN: 'test-team',
    ACCESS_AUDIENCE_TAG: 'test-audience-tag',
    ACCESS_BYPASS_SIGNATURE_FOR_TESTING: 'true'
  });

  assert.equal(response.status, 200);
  assert.ok(json.summary);
});

test('GET /api/readiness with expired or mismatching Access JWT is rejected with 401', async () => {
  const jwtExpired = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    {
      exp: Math.floor(Date.now() / 1000) - 10, // expired 10s ago
      iss: 'https://test-team.cloudflareaccess.com',
      aud: 'test-audience-tag'
    }
  );

  const resExpired = await requestJson('/api/readiness', {
    headers: {
      'cf-access-jwt-assertion': jwtExpired
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    ACCESS_TEAM_DOMAIN: 'test-team',
    ACCESS_AUDIENCE_TAG: 'test-audience-tag',
    ACCESS_BYPASS_SIGNATURE_FOR_TESTING: 'true'
  });

  assert.equal(resExpired.response.status, 401);

  const jwtBadAud = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    {
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'https://test-team.cloudflareaccess.com',
      aud: 'wrong-audience-tag'
    }
  );

  const resBadAud = await requestJson('/api/readiness', {
    headers: {
      'cf-access-jwt-assertion': jwtBadAud
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    ACCESS_TEAM_DOMAIN: 'test-team',
    ACCESS_AUDIENCE_TAG: 'test-audience-tag',
    ACCESS_BYPASS_SIGNATURE_FOR_TESTING: 'true'
  });

  assert.equal(resBadAud.response.status, 401);
});

// ─── JWT Hardening Tests (Claude Opus 4) ────────────────────────────────

const jwtEnv = {
  ADMIN_API_SHARED_SECRET: adminSecret,
  ACCESS_TEAM_DOMAIN: 'test-team',
  ACCESS_AUDIENCE_TAG: 'test-audience-tag',
  ACCESS_BYPASS_SIGNATURE_FOR_TESTING: 'true'
};

test('JWT hardening: missing exp is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    { iss: 'https://test-team.cloudflareaccess.com', aud: 'test-audience-tag' }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

test('JWT hardening: non-numeric exp is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    { exp: 'never', iss: 'https://test-team.cloudflareaccess.com', aud: 'test-audience-tag' }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

test('JWT hardening: wrong alg is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'HS256', kid: 'test-kid' },
    { exp: Math.floor(Date.now() / 1000) + 3600, iss: 'https://test-team.cloudflareaccess.com', aud: 'test-audience-tag' }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

test('JWT hardening: missing kid is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256' },
    { exp: Math.floor(Date.now() / 1000) + 3600, iss: 'https://test-team.cloudflareaccess.com', aud: 'test-audience-tag' }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

test('JWT hardening: wrong issuer is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    { exp: Math.floor(Date.now() / 1000) + 3600, iss: 'https://evil-team.cloudflareaccess.com', aud: 'test-audience-tag' }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

test('JWT hardening: missing iss is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    { exp: Math.floor(Date.now() / 1000) + 3600, aud: 'test-audience-tag' }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

test('JWT hardening: aud array containing tag is accepted', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    { exp: Math.floor(Date.now() / 1000) + 3600, iss: 'https://test-team.cloudflareaccess.com', aud: ['other-tag', 'test-audience-tag'] }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 200);
});

test('JWT hardening: aud array missing tag is rejected', async () => {
  const jwt = makeMockJwt(
    { alg: 'RS256', kid: 'test-kid' },
    { exp: Math.floor(Date.now() / 1000) + 3600, iss: 'https://test-team.cloudflareaccess.com', aud: ['wrong-tag-1', 'wrong-tag-2'] }
  );
  const { response } = await requestJson('/api/readiness', {
    headers: { 'cf-access-jwt-assertion': jwt }
  }, jwtEnv);
  assert.equal(response.status, 401);
});

// ─── Input Schema Validation Tests (Gemini 3.5 Flash) ───────────────────

const validationEnv = {
  ADMIN_API_SHARED_SECRET: adminSecret
};

test('Schema Validation: missing title is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'valid-slug',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('Missing required field: title'));
});

test('Schema Validation: empty title is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: '   ',
      slug: 'valid-slug',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('title cannot be empty'));
});

test('Schema Validation: missing slug is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('Missing required field: slug'));
});

test('Schema Validation: invalid slug characters are rejected with 400', async () => {
  const invalidSlugs = ['../traversal', 'slug/with/slash', 'UPPERCASE', 'invalid_char!', 'space slug', '-slug', 'slug-'];
  for (const slug of invalidSlugs) {
    const { response, json } = await requestJson('/api/drafts/publish', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-xhalo-admin-secret': adminSecret
      },
      body: JSON.stringify({
        title: 'Valid Title',
        slug: slug,
        mode: 'dry-run'
      })
    }, validationEnv);

    assert.equal(response.status, 400);
    assert.equal(json.error, 'Validation failed.');
    assert.ok(json.details.some(d => d.includes('slug contains invalid characters')));
  }
});

test('Schema Validation: invalid status values are rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      status: 'archived',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('status must be either "draft", "review" or "published"'));
});

test('Schema Validation: valid inputs pass validation with 200', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      status: 'draft',
      body: 'Valid post body content',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 200);
  assert.equal(json.mode, 'dry-run');
  assert.equal(json.persisted, undefined); // dry-run doesn't persist
});

test('Schema Validation: invalid JSON request body is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: '{invalid json'
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Invalid JSON request body.');
});

test('Schema Validation: invalid mode value is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      mode: 'invalid-mode'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('mode must be either "dry-run" or "live"'));
});

test('Schema Validation: invalid publish_target is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      publish_target: 'invalid-target'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('publish_target must be either "github" or "d1"'));
});

test('Schema Validation: body content too large is rejected with 400', async () => {
  const largeBody = 'a'.repeat(200 * 1024 + 1);
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: largeBody
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('body content size cannot exceed 200 KiB'));
});

test('Schema Validation: summary too long is rejected with 400', async () => {
  const longSummary = 'a'.repeat(501);
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      summary: longSummary
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('summary cannot be longer than 500 characters'));
});

test('Schema Validation: category too long is rejected with 400', async () => {
  const longCategory = 'a'.repeat(101);
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      category: longCategory
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('category cannot be longer than 100 characters'));
});

test('Schema Validation: too many tags are rejected with 400', async () => {
  const manyTags = Array(21).fill('tag');
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      tags: manyTags
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('tags list cannot contain more than 20 items'));
});

test('Schema Validation: tag too long is rejected with 400', async () => {
  const longTag = 'a'.repeat(51);
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      tags: [longTag]
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.some(d => d.includes('cannot be longer than 50 characters')));
});

test('Schema Validation: slug with underscore is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'slug_with_underscore',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.some(d => d.includes('slug contains invalid characters')));
});

test('Schema Validation: optional fields summary, category, tags are validated successfully', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      summary: 'A brief summary of the post.',
      category: 'Technology',
      tags: ['cloudflare', 'workers', 'sqlite'],
      body: 'Valid post body content',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 200);
  assert.equal(json.mode, 'dry-run');
});

test('R2 Upload: filename with path traversal is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: '../../evil.png',
      contentType: 'image/png',
      content: 'fake-content'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /invalid path traversal characters/);
});

test('R2 Upload: content type extension mismatch is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: 'image.png',
      contentType: 'text/plain',
      content: 'fake-content'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /extension does not match the Content-Type/);
});

test('R2 Upload: forbidden MIME type is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: 'script.js',
      contentType: 'application/javascript',
      content: 'console.log(1)'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /not allowed/);
});

test('R2 Upload: path traversal in scope is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: 'image.png',
      contentType: 'image/png',
      scope: '../../evil',
      content: 'fake-content'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /Scope contains invalid path/);
});

test('R2 Upload: path traversal in postSlug is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: 'image.png',
      contentType: 'image/png',
      postSlug: '../../evil',
      content: 'fake-content'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /postSlug contains invalid path/);
});

test('R2 Signed Upload: filename with traversal is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-signed-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: '../../evil.png',
      contentType: 'image/png'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /invalid path traversal characters/);
});

test('R2 Preview: filename with traversal is rejected with 400', async () => {
  const { response, json } = await requestJson('/api/assets/r2-preview', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: '../../evil.png',
      contentType: 'image/png'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.match(json.error, /invalid path traversal characters/);
});

test('GitHub Publish: live publish enqueues task and returns 202', async () => {
  let enqueued = false;
  let taskPayload = null;
  const mockQueue = {
    send: async (payload) => {
      enqueued = true;
      taskPayload = payload;
    }
  };

  let d1Binds = [];
  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => {
        d1Binds.push({ sql, args });
        return {
          run: async () => ({ success: true })
        };
      }
    })
  };

  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Post Title',
      slug: 'post-title',
      body: 'Valid post body content',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'true',
    TASK_QUEUE: mockQueue,
    DB: mockDb
  });

  assert.equal(response.status, 202);
  assert.equal(json.status, 'queued');
  assert.ok(json.task_id);
  assert.ok(enqueued);
  assert.equal(taskPayload.type, 'draft_publish');
  assert.equal(taskPayload.payload.preview.draft.title, 'Post Title');

  // Verify D1 records
  const hasTaskInsert = d1Binds.some(b => b.sql.includes('INSERT INTO tasks'));
  const hasPostInsert = d1Binds.some(b => b.sql.includes('INSERT INTO posts_index'));
  assert.ok(hasTaskInsert, 'Should insert task record');
  assert.ok(hasPostInsert, 'Should insert post record');
});

test('POST /api/drafts/publish rejects path traversal slug', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: '../path-traversal-slug',
      body: 'Valid post body content',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.some(d => d.includes('Path traversal or absolute path is not allowed')));
});

test('POST /api/drafts/publish rejects missing body', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.includes('Missing required field: body'));
});

test('POST /api/drafts/publish rejects invalid status', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      status: 'invalid-status',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
  assert.ok(json.details.some(d => d.includes('status must be either "draft", "review" or "published"')));
});

test('POST /api/drafts/publish dry-run valid input returns 200', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      mode: 'dry-run'
    })
  }, validationEnv);

  assert.equal(response.status, 200);
  assert.equal(json.mode, 'dry-run');
});

test('POST /api/drafts/publish live still returns 403 when LIVE_WRITES_ENABLED=false', async () => {
  const { response, json } = await requestJson('/api/drafts/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'false'
  });

  assert.equal(response.status, 403);
  assert.equal(json.required_env, 'LIVE_WRITES_ENABLED=true');
});

test('POST /api/drafts/direct-publish rejects when PUBLISH_MODE=pr_only', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      confirmationPhrase: 'DIRECT PUBLISH TO MAIN'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'pr_only',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'OWNER_DIRECT_DISABLED');
});

test('POST /api/drafts/direct-publish rejects when OWNER_DIRECT_PUBLISH_ENABLED=false', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      confirmationPhrase: 'DIRECT PUBLISH TO MAIN'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'false'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'OWNER_DIRECT_DISABLED');
});

test('POST /api/drafts/direct-publish rejects wrong confirmation phrase', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      confirmationPhrase: 'WRONG PHRASE'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_CONFIRMATION_PHRASE: 'DIRECT PUBLISH TO MAIN'
  });

  assert.equal(response.status, 400);
  assert.equal(json.code, 'INVALID_CONFIRMATION');
});

test('POST /api/drafts/direct-publish rejects invalid slug or path traversal', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: '../traversal-slug',
      body: 'Valid post body content',
      confirmationPhrase: 'DIRECT PUBLISH TO MAIN'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_CONFIRMATION_PHRASE: 'DIRECT PUBLISH TO MAIN'
  });

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
});

test('POST /api/drafts/direct-publish succeeds with mock GitHub when all gates pass', async () => {
  let directCommitCalled = false;
  const mockGithubFetch = async (url, init) => {
    const parsedUrl = new URL(url);
    const path = decodeURIComponent(parsedUrl.pathname);

    if (path.includes('/contents/source/_posts/valid-slug.md')) {
      if (!init.method || init.method === 'GET') {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      }
      if (init.method === 'PUT') {
        directCommitCalled = true;
        return new Response(JSON.stringify({
          content: { path: 'source/_posts/valid-slug.md' },
          commit: { sha: 'direct-commit-sha-456' }
        }), { status: 201 });
      }
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const mockDb = {
    prepare: () => ({
      bind: () => ({
        run: async () => ({ success: true })
      })
    })
  };

  const { response, json } = await requestJson('/api/drafts/direct-publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      title: 'Valid Title',
      slug: 'valid-slug',
      body: 'Valid post body content',
      confirmationPhrase: 'DIRECT PUBLISH TO MAIN'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_CONFIRMATION_PHRASE: 'DIRECT PUBLISH TO MAIN',
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch,
    DB: mockDb
  });

  assert.equal(response.status, 200);
  assert.ok(json.ok);
  assert.equal(json.commitSha, 'direct-commit-sha-456');
  assert.equal(json.targetBranch, 'main');
  assert.ok(directCommitCalled);
});

test('GET /api/posts/source rejects invalid slug', async () => {
  const { response, json } = await requestJson('/api/posts/source?slug=invalid_slug', {
    method: 'GET',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret
  });

  assert.equal(response.status, 400);
  assert.equal(json.error, 'Validation failed.');
});

test('GET /api/posts/source returns 404 if missing', async () => {
  const mockGithubFetch = async (url, init) => {
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const { response, json } = await requestJson('/api/posts/source?slug=missing-post', {
    method: 'GET',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 404);
  assert.equal(json.code, 'TARGET_NOT_FOUND');
});

test('GET /api/posts/source returns raw/frontmatter/body/sha if exists', async () => {
  const mockGithubFetch = async (url, init) => {
    const rawContent = `---\ntitle: "Existing Article"\ndate: 2026-06-15\ntags:\n  - test\ncategories:\n  - notes\nsummary: "summary"\nstatus: "published"\n---\n\nhello world body`;
    const base64Content = Buffer.from(rawContent).toString('base64');
    return new Response(JSON.stringify({
      content: base64Content,
      sha: 'existing-sha-111'
    }), { status: 200 });
  };

  const { response, json } = await requestJson('/api/posts/source?slug=existing-post', {
    method: 'GET',
    headers: {
      'x-xhalo-admin-secret': adminSecret
    }
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.ok(json.ok);
  assert.equal(json.sha, 'existing-sha-111');
  assert.equal(json.frontmatter.title, 'Existing Article');
  assert.equal(json.body, 'hello world body');
});

test('POST /api/drafts/direct-update-preview returns diff summary', async () => {
  const mockGithubFetch = async (url, init) => {
    const rawContent = `---\ntitle: "Existing Article"\ndate: 2026-06-15\ntags:\n  - test\ncategories:\n  - notes\nsummary: "summary"\nstatus: "published"\n---\n\nhello world body`;
    const base64Content = Buffer.from(rawContent).toString('base64');
    return new Response(JSON.stringify({
      content: base64Content,
      sha: 'existing-sha-111'
    }), { status: 200 });
  };

  const { response, json } = await requestJson('/api/drafts/direct-update-preview', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'New Title',
      body: 'new body text',
      summary: 'new summary',
      categories: ['notes'],
      tags: ['test']
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 200);
  assert.ok(json.ok);
  assert.equal(json.mode, 'owner_direct_update_preview');
  assert.ok(json.diffSummary);
  assert.ok(json.diffSummary.frontmatterChanged);
  assert.ok(json.diffSummary.bodyChanged);
  assert.ok(json.previewHtml.includes('New Title'));
});

test('POST /api/drafts/direct-update rejects in pr_only mode', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'New Title',
      body: 'new body text',
      baseSha: 'existing-sha-111',
      confirmationPhrase: 'DIRECT UPDATE EXISTING POST'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'pr_only',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_UPDATE_ENABLED: 'true'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'OWNER_DIRECT_UPDATE_DISABLED');
});

test('POST /api/drafts/direct-update rejects when OWNER_DIRECT_UPDATE_ENABLED=false', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'New Title',
      body: 'new body text',
      baseSha: 'existing-sha-111',
      confirmationPhrase: 'DIRECT UPDATE EXISTING POST'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_UPDATE_ENABLED: 'false'
  });

  assert.equal(response.status, 403);
  assert.equal(json.code, 'OWNER_DIRECT_UPDATE_DISABLED');
});

test('POST /api/drafts/direct-update rejects missing or wrong confirmation', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'New Title',
      body: 'new body text',
      baseSha: 'existing-sha-111',
      confirmationPhrase: 'WRONG PHRASE'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_UPDATE_ENABLED: 'true'
  });

  assert.equal(response.status, 400);
  assert.equal(json.code, 'INVALID_CONFIRMATION');
});

test('POST /api/drafts/direct-update rejects missing baseSha', async () => {
  const { response, json } = await requestJson('/api/drafts/direct-update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'New Title',
      body: 'new body text',
      confirmationPhrase: 'DIRECT UPDATE EXISTING POST'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_UPDATE_ENABLED: 'true'
  });

  assert.equal(response.status, 400);
  assert.equal(json.code, 'MISSING_BASE_SHA');
});

test('POST /api/drafts/direct-update rejects stale baseSha', async () => {
  const mockGithubFetch = async (url, init) => {
    return new Response(JSON.stringify({ sha: 'fresh-sha-from-server' }), { status: 200 });
  };

  const { response, json } = await requestJson('/api/drafts/direct-update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'New Title',
      body: 'new body text',
      baseSha: 'stale-sha-from-client',
      confirmationPhrase: 'DIRECT UPDATE EXISTING POST'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_UPDATE_ENABLED: 'true',
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch
  });

  assert.equal(response.status, 409);
  assert.equal(json.code, 'STALE_BASE_SHA');
});

test('POST /api/drafts/direct-update succeeds with mock GitHub when all gates pass', async () => {
  let putCalled = false;
  let putUrl = '';

  const mockGithubFetch = async (url, init) => {
    if (!init.method || init.method === 'GET') {
      return new Response(JSON.stringify({ sha: 'current-sha-123' }), { status: 200 });
    }
    if (init.method === 'PUT') {
      putCalled = true;
      putUrl = url;
      return new Response(JSON.stringify({
        content: { path: 'source/_posts/existing-post.md' },
        commit: { sha: 'updated-commit-sha-999' }
      }), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };

  const mockDb = {
    prepare: () => ({
      bind: () => ({
        run: async () => ({ success: true })
      })
    })
  };

  const { response, json } = await requestJson('/api/drafts/direct-update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      slug: 'existing-post',
      title: 'Updated Title',
      body: 'new body content text',
      baseSha: 'current-sha-123',
      confirmationPhrase: 'DIRECT UPDATE EXISTING POST'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    PUBLISH_MODE: 'owner_direct',
    OWNER_DIRECT_PUBLISH_ENABLED: 'true',
    OWNER_DIRECT_UPDATE_ENABLED: 'true',
    GITHUB_OWNER: 'test-owner',
    GITHUB_REPO: 'test-repo',
    GITHUB_BRANCH: 'main',
    GITHUB_TOKEN: 'mock-token',
    GITHUB_FETCH: mockGithubFetch,
    DB: mockDb
  });

  assert.equal(response.status, 200);
  assert.ok(json.ok);
  assert.equal(json.commitSha, 'updated-commit-sha-999');
  assert.ok(putCalled);
  assert.ok(putUrl.endsWith('/contents/source/_posts/existing-post.md'));
  assert.ok(!putUrl.includes('%2F'));
});




