import { exec } from 'child_process';

/**
 * xhalo-blog API Worker Smoke Testing Script
 * This script runs a suite of API request assertions against a running Worker instance.
 * 
 * Usage:
 *   SMOKE_TARGET_URL=http://localhost:8787 ADMIN_API_SHARED_SECRET=your_secret node scripts/smoke-worker-routes.mjs
 */

const targetUrl = (process.env.SMOKE_TARGET_URL || 'http://localhost:8787').replace(/\/$/, '');
const sharedSecret = process.env.ADMIN_API_SHARED_SECRET || 'test-admin-secret';

console.log(`Starting worker smoke tests...`);
console.log(`Target URL: ${targetUrl}`);
console.log(`Admin Secret: ${sharedSecret ? '********' : '(not set)'}\n`);

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
  // Test 1: Public Health Check
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

  // Test 2: Public Scaffold Endpoint
  await runTest(
    'GET /api/scaffold (Public Scaffold Endpoint)',
    '/api/scaffold',
    { method: 'GET' },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || json.repo !== 'xhalo-blog') return `Expected JSON with repo: 'xhalo-blog', got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 3: Protected Readiness Check (Without authorization header)
  await runTest(
    'GET /api/readiness (Missing authorization header)',
    '/api/readiness',
    { method: 'GET' },
    (status, json) => {
      if (status !== 401) return `Expected status 401, got ${status}`;
      if (!json || !json.error) return `Expected error message, got ${JSON.stringify(json)}`;
      return null;
    }
  );

  // Test 4: Protected Readiness Check (With authorization header)
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

  // Test 5: Input validation - Invalid JSON
  await runTest(
    'POST /api/drafts/publish (Invalid JSON payload)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': 'dummy-token'
      },
      body: '{invalid json'
    },
    (status, json) => {
      if (status !== 400) return `Expected status 400, got ${status}`;
      if (!json || json.error !== 'Invalid JSON request body.') {
        return `Expected 'Invalid JSON request body.' error, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 6: Input validation - Missing required fields
  await runTest(
    'POST /api/drafts/publish (Missing title & slug)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': 'dummy-token'
      },
      body: JSON.stringify({ mode: 'dry-run' })
    },
    (status, json) => {
      if (status !== 400) return `Expected status 400, got ${status}`;
      if (!json || json.error !== 'Validation failed.' || !Array.isArray(json.details)) {
        return `Expected validation failure list, got ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // Test 7: Write protection - Live publish with writes disabled (Default sandbox behavior)
  await runTest(
    'POST /api/drafts/publish (Live write gate validation)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'content-type': 'application/json',
        'cf-turnstile-token': 'dummy-token'
      },
      body: JSON.stringify({
        title: 'Smoke Test Post',
        slug: 'smoke-test-post',
        mode: 'live',
        publish_target: 'd1'
      })
    },
    (status, json) => {
      // If live writes are enabled, this might return 200 or another status depending on DB state.
      // But in dry-run/default testing environment it should either be 403 (writes disabled) or 200 (if enabled and D1 works).
      if (status !== 403 && status !== 200) {
        return `Expected status 403 (writes disabled) or 200 (success), got ${status}`;
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
