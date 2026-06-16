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

test('POST /api/assets/r2-upload live returns 403 with specific error semantics when writes are disabled', async () => {
  const { response, json } = await requestJson('/api/assets/r2-upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-xhalo-admin-secret': adminSecret
    },
    body: JSON.stringify({
      filename: 'image.png',
      contentType: 'image/png',
      content: 'fake-base64-content',
      mode: 'live'
    })
  }, {
    ADMIN_API_SHARED_SECRET: adminSecret,
    LIVE_WRITES_ENABLED: 'false'
  });

  assert.equal(response.status, 403);
  assert.equal(json.error, 'Live writes are disabled.');
  assert.equal(json.code, 'LIVE_WRITES_DISABLED');
  assert.equal(json.required_env, 'LIVE_WRITES_ENABLED=true');
  
  // Ensure no success-oriented keys exist
  assert.equal(json.etag, undefined);
  assert.equal(json.uploaded, undefined);
  assert.equal(json.persisted, undefined);
  assert.equal(json.objectKey, undefined);
});
