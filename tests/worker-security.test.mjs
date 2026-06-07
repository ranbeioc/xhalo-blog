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
  let prepSql = '';
  let prepBind = [];
  let prepRunCalled = false;

  const mockDb = {
    prepare: (sql) => {
      prepSql = sql;
      return {
        bind: (...args) => {
          prepBind = args;
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
    DB: mockDb
  });

  assert.equal(response.status, 200);
  assert.equal(json.mode, 'live');
  assert.equal(json.auth_mode, 'd1');
  assert.equal(json.pull_request, null);
  assert.equal(json.persisted, true);
  assert.ok(prepRunCalled);
  assert.ok(prepSql.includes('INSERT OR REPLACE INTO posts_index'));
  assert.equal(prepBind[1], 'd1-only-post'); // slug
  assert.equal(prepBind[2], 'D1 Only Post'); // title
  assert.ok(prepBind[10].includes('This post is stored directly in D1.')); // content
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
  const invalidSlugs = ['../traversal', 'slug/with/slash', 'UPPERCASE', 'invalid_char!', 'space slug'];
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
  assert.ok(json.details.includes('status must be either "draft" or "published"'));
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

