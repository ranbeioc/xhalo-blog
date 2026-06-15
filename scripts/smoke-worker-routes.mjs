import { exec } from 'child_process';

/**
 * xhalo-blog API Worker Smoke Testing Script
 * This script runs an expanded suite of API request assertions against a running Worker instance.
 * Covers 17 distinct endpoints, query types, authentication blocks, and boundary conditions.
 *
 * NOTE: The 'dummy-token' value is ONLY valid for staging environments configured with
 * Cloudflare Turnstile's official test credentials (sitekey/secret = '1x0000000000000000000000000000000AA').
 * It must NEVER be documented or used as a production bypass.
 *
 * Usage:
 *   SMOKE_TARGET_URL=http://localhost:8787 \
 *   ADMIN_API_SHARED_SECRET=your_secret \
 *   SMOKE_TURNSTILE_TOKEN=dummy-token \
 *   SMOKE_EXPECT_LIVE_WRITES=false \
 *   node scripts/smoke-worker-routes.mjs
 */

const targetUrl = (process.env.SMOKE_TARGET_URL || 'http://localhost:8787').replace(/\/$/, '');
const sharedSecret = process.env.ADMIN_API_SHARED_SECRET || 'test-admin-secret';
const turnstileToken = process.env.SMOKE_TURNSTILE_TOKEN || 'dummy-token';
const expectLiveWrites = process.env.SMOKE_EXPECT_LIVE_WRITES === 'true';

console.log(`Starting expanded worker smoke tests...`);
console.log(`Target URL: ${targetUrl}`);
console.log(`Admin Secret: ${sharedSecret ? '********' : '(not set)'}`);
console.log(`Turnstile Token: ${turnstileToken}`);
console.log(`Expect Live Writes: ${expectLiveWrites}\n`);

let passedCount = 0;
let failedCount = 0;

async function runTest(name, path, options, validator) {
  const url = `${targetUrl}${path}`;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Not JSON
    }

    const errorMsg = validator(res.status, json, text);
    if (!errorMsg) {
      console.log(`✓ [PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`  Details: ${errorMsg}`);
      console.error(`  Status: ${res.status}`);
      console.error(`  Response: ${text.substring(0, 200)}`);
      failedCount++;
    }
  } catch (err) {
    console.error(`✗ [ERROR] ${name}`);
    console.error(`  Failed to connect or process request: ${err.message}`);
    failedCount++;
  }
}

async function main() {
  // Test 1: GET /api/health (Public Health Endpoint)
  await runTest(
    'GET /api/health (Public Health Endpoint)',
    '/api/health',
    { method: 'GET' },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || json.ok !== true) return `Expected JSON { ok: true }, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 2: GET /api/readiness (With valid admin shared secret)
  await runTest(
    'GET /api/readiness (With valid admin shared secret)',
    '/api/readiness',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !json.summary) return `Expected summary object, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 3: GET /api/posts (With valid admin shared secret)
  await runTest(
    'GET /api/posts (With valid admin shared secret)',
    '/api/posts',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !Array.isArray(json.items)) return `Expected list of posts under 'items', got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 4: GET /api/tasks (With valid admin shared secret)
  await runTest(
    'GET /api/tasks (With valid admin shared secret)',
    '/api/tasks',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !Array.isArray(json.items)) return `Expected list of tasks under 'items', got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 5: GET /api/audit-logs (With valid admin shared secret)
  await runTest(
    'GET /api/audit-logs (With valid admin shared secret)',
    '/api/audit-logs',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !Array.isArray(json.items)) return `Expected list of audit logs under 'items', got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 6: GET /api/drafts/template (With valid admin shared secret)
  await runTest(
    'GET /api/drafts/template (With valid admin shared secret)',
    '/api/drafts/template',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !json.template) return `Expected template object, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 7: POST /api/drafts/preview (With valid admin shared secret + Turnstile token)
  await runTest(
    'POST /api/drafts/preview (With valid auth and Turnstile token)',
    '/api/drafts/preview',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: JSON.stringify({
        title: 'Smoke Test Preview Post',
        slug: 'smoke-test-preview-post',
        body: 'This is the body content of the smoke test preview post.'
      })
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !json.preview || json.preview.draft.title !== 'Smoke Test Preview Post') {
        return `Expected preview of 'Smoke Test Preview Post', got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 8: POST /api/drafts/publish (Dry-run publish with writes disabled/dry-run mode)
  await runTest(
    'POST /api/drafts/publish (Dry-run publish targets)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: JSON.stringify({
        title: 'Smoke Test Publish Post',
        slug: 'smoke-test-publish-post',
        body: 'This is the body content of the smoke test publish post.',
        mode: 'dry-run',
        publish_target: 'd1'
      })
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || json.mode !== 'dry-run') return `Expected dry-run mode response, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 9: POST /api/assets/r2-preview (With valid admin shared secret + Turnstile token)
  await runTest(
    'POST /api/assets/r2-preview (With valid auth and Turnstile token)',
    '/api/assets/r2-preview',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: JSON.stringify({
        filename: 'smoke-test-asset.png',
        contentType: 'image/png',
        scope: 'global'
      })
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !json.preview || !json.preview.objectKey) {
        return `Expected R2 preview object, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 10: POST /api/assets/r2-signed-upload (Dry-run signed upload with mode=dry-run)
  await runTest(
    'POST /api/assets/r2-signed-upload (Dry-run signed upload)',
    '/api/assets/r2-signed-upload',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: JSON.stringify({
        filename: 'smoke-test-asset-signed.png',
        contentType: 'image/png',
        scope: 'global',
        mode: 'dry-run'
      })
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || json.mode !== 'dry-run' || !json.plan) {
        return `Expected dry-run signed plan, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 11: Access Rejection (No admin authentication secret)
  await runTest(
    'GET /api/readiness (Rejection: Missing auth)',
    '/api/readiness',
    { method: 'GET' },
    (status, json) => {
      if (status !== 401) return `Expected status 401, got ${status}`;
      if (!json || !json.error || !json.error.includes('Unauthorized')) {
        return `Expected 'Unauthorized' error, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 12: Turnstile Rejection (Mutation request without Turnstile token)
  await runTest(
    'POST /api/drafts/publish (Rejection: Missing Turnstile token)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Smoke Test Turnstile Failure',
        slug: 'smoke-test-turnstile-failure',
        mode: 'dry-run'
      })
    },
    (status, json) => {
      if (status !== 403) return `Expected status 403, got ${status}`;
      if (!json || !json.error || !json.error.includes('Turnstile')) {
        return `Expected 'Turnstile' rejection error, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 13: GitHub Webhook Rejection (Bad Signature)
  await runTest(
    'POST /webhooks/github (Rejection: Bad Signature)',
    '/webhooks/github',
    {
      method: 'POST',
      headers: {
        'x-github-event': 'pull_request',
        'x-hub-signature-256': 'sha256=invalidhashvaluehere1234567890123456789012345678901234567890'
      },
      body: JSON.stringify({ action: 'synchronize' })
    },
    (status, json) => {
      if (status !== 403) return `Expected status 403, got ${status}`;
      if (!json || !json.error) return `Expected webhook validation error, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 14: Preview Webhook Rejection (Bad Secret)
  await runTest(
    'POST /webhooks/deployments/preview (Rejection: Bad Secret)',
    '/webhooks/deployments/preview',
    {
      method: 'POST',
      headers: {
        'x-preview-webhook-secret': 'bad-preview-secret',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ branchName: 'main', status: 'preview-ready' })
    },
    (status, json) => {
      if (status !== 403) return `Expected status 403, got ${status}`;
      if (!json || !json.error) return `Expected preview webhook auth error, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 15: Malformed JSON Payload (Verify structured JSON error output)
  await runTest(
    'POST /api/drafts/publish (Rejection: Malformed JSON payload)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: '{invalid-json-structure'
    },
    (status, json) => {
      if (status !== 400) return `Expected status 400, got ${status}`;
      if (!json || json.error !== 'Invalid JSON request body.') {
        return `Expected 'Invalid JSON request body.' error, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 16: R2 MIME Rejection (Verify file constraints for disallowed MIME type)
  await runTest(
    'POST /api/assets/r2-preview (Rejection: Disallowed MIME type)',
    '/api/assets/r2-preview',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: JSON.stringify({
        filename: 'smoke-test-malware.exe',
        contentType: 'application/octet-stream',
        scope: 'global'
      })
    },
    (status, json) => {
      if (status !== 400) return `Expected status 400, got ${status}`;
      if (!json || !json.error || !json.error.includes('MIME type')) {
        return `Expected 'MIME type is not allowed' error, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 17: R2 Path Traversal Rejection (Verify protection against traversal characters)
  await runTest(
    'POST /api/assets/r2-preview (Rejection: Path traversal characters)',
    '/api/assets/r2-preview',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': turnstileToken
      },
      body: JSON.stringify({
        filename: '../evil.png',
        contentType: 'image/png',
        scope: 'global'
      })
    },
    (status, json) => {
      if (status !== 400) return `Expected status 400, got ${status}`;
      if (!json || !json.error || !json.error.includes('invalid path traversal')) {
        return `Expected 'invalid path traversal' error, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  console.log(`\nSmoke Test Summary:`);
  console.log(`  Passed: ${passedCount}`);
  console.log(`  Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n✗ Smoke tests failed!`);
    process.exit(1);
  } else {
    console.log(`\n✓ All smoke tests passed successfully!`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Smoke testing failed unexpectedly:', err);
  process.exit(1);
});
