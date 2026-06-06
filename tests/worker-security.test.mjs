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
