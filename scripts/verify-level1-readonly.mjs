/**
 * xhalo-blog Level 1 Read-Only Connection Validation Script
 * Verifies that the API Worker can parse configurations and execute dry-runs,
 * but is successfully blocked from performing any live writes or Git updates.
 *
 * Usage:
 *   LEVEL1_TARGET_URL=http://localhost:8787 \
 *   ADMIN_API_SHARED_SECRET=your-admin-shared-secret \
 *   LEVEL1_TURNSTILE_TOKEN=dummy-token \
 *   GITHUB_OWNER=ranbeioc \
 *   GITHUB_REPO=hexo-blog \
 *   GITHUB_TOKEN=your-github-token \
 *   node scripts/verify-level1-readonly.mjs
 */

const targetUrl = (process.env.LEVEL1_TARGET_URL || 'http://localhost:8787').replace(/\/$/, '');
const sharedSecret = process.env.ADMIN_API_SHARED_SECRET || 'test-admin-secret';
const turnstileToken = process.env.LEVEL1_TURNSTILE_TOKEN || 'dummy-token';
const githubOwner = process.env.GITHUB_OWNER || '';
const githubRepo = process.env.GITHUB_REPO || '';
const githubToken = process.env.GITHUB_TOKEN || '';

console.log(`Starting Level 1 Read-Only Validation...`);
console.log(`Target URL: ${targetUrl}`);
console.log(`Admin Secret: ${sharedSecret ? '********' : '(not set)'}`);
console.log(`Turnstile Token: ${turnstileToken}`);
console.log(`GitHub Repo: ${githubOwner && githubRepo ? `${githubOwner}/${githubRepo}` : '(not configured for GitHub API checks)'}\n`);

let passedCount = 0;
let failedCount = 0;

async function runTest(name, path, options, validator) {
  const url = `${targetUrl}${path}`;
  let res = null;
  let text = '';
  let json = null;
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      res = await fetch(url, options);
      text = await res.text();
      try {
        json = JSON.parse(text);
      } catch (e) {
        // Not JSON
      }
      break; // Request succeeded, break retry loop
    } catch (err) {
      if (attempt >= maxAttempts) {
        console.error(`✗ [ERROR] ${name}`);
        console.error(`  Failed to connect or process request: ${err.message}`);
        failedCount++;
        return { success: false, error: err };
      }
      console.warn(`[WARNING] Connection failed on attempt ${attempt}/${maxAttempts}: ${err.message}. Retrying in 1.5s...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  const errorMsg = validator(res.status, json, text);
  if (!errorMsg) {
    console.log(`✓ [PASS] ${name}`);
    passedCount++;
    return { status: res.status, json, success: true };
  } else {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`  Details: ${errorMsg}`);
    console.error(`  Status: ${res.status}`);
    console.error(`  Response: ${text.substring(0, 200)}`);
    failedCount++;
    return { status: res.status, json, success: false };
  }
}

async function verifyGitHubState() {
  if (!githubToken || !githubOwner || !githubRepo) {
    console.log(`[INFO] GITHUB_TOKEN or repository config missing; skipping remote GitHub branch/PR existence checks.`);
    return;
  }

  const slug = 'level1-smoke-test-dry-run';
  const branchName = `drafts/${slug}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${githubToken}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'xhalo-blog-level1-verifier'
  };

  console.log(`\nVerifying remote GitHub state for branch '${branchName}'...`);

  // 1. Verify branch does not exist (expect 404)
  try {
    const branchRes = await fetch(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/branches/${branchName}`,
      { headers }
    );
    if (branchRes.status === 404) {
      console.log(`✓ [PASS] GitHub: branch '${branchName}' does not exist (404 OK)`);
      passedCount++;
    } else if (branchRes.status === 200) {
      console.error(`✗ [FAIL] GitHub: branch '${branchName}' exists but should NOT exist!`);
      failedCount++;
    } else {
      console.warn(`[WARNING] GitHub API branch check returned status ${branchRes.status}`);
    }
  } catch (err) {
    console.error(`✗ [ERROR] GitHub API branch check failed: ${err.message}`);
    failedCount++;
  }

  // 2. Verify Pull Request does not exist
  try {
    const prRes = await fetch(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls?state=all&head=${githubOwner}:${branchName}`,
      { headers }
    );
    if (prRes.status === 200) {
      const json = await prRes.json();
      if (Array.isArray(json) && json.length === 0) {
        console.log(`✓ [PASS] GitHub: no Pull Request exists for branch '${branchName}'`);
        passedCount++;
      } else {
        console.error(`✗ [FAIL] GitHub: Pull Request exists for '${branchName}' but should NOT exist!`);
        failedCount++;
      }
    } else {
      console.warn(`[WARNING] GitHub API Pull Request check returned status ${prRes.status}`);
    }
  } catch (err) {
    console.error(`✗ [ERROR] GitHub API Pull Request check failed: ${err.message}`);
    failedCount++;
  }
}

async function main() {
  // 1. Verify /api/readiness
  await runTest(
    'GET /api/readiness (Authentication and D1 Connection)',
    '/api/readiness',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !json.summary || typeof json.summary.ready !== 'number') {
        return `Expected structured readiness snapshot with summary, got: ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // 2. Verify /api/posts
  await runTest(
    'GET /api/posts (Retrieve Posts Index)',
    '/api/posts',
    {
      method: 'GET',
      headers: { 'x-xhalo-admin-secret': sharedSecret }
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      if (!json || !Array.isArray(json.items)) return `Expected JSON body containing posts items list, got: ${JSON.stringify(json)}`;
      return null;
    }
  );

  // 3. Verify /api/drafts/publish dry-run
  const slug = 'level1-smoke-test-dry-run';
  await runTest(
    'POST /api/drafts/publish (Dry-Run mode returns plan)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'cf-turnstile-token': turnstileToken,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Level 1 Smoke Test Dry Run',
        slug,
        body: 'Dry run publish compatibility test body content.',
        mode: 'dry-run',
        publish_target: 'github'
      })
    },
    (status, json) => {
      if (status !== 200) return `Expected status 200, got ${status}`;
      const planArray = json && json.plan && (json.plan.actions || json.plan.ops);
      if (!json || json.mode !== 'dry-run' || !json.plan || !Array.isArray(planArray)) {
        return `Expected dry-run mode and operation plan, got: ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // 4. Verify /api/drafts/publish live is BLOCKED
  await runTest(
    'POST /api/drafts/publish (Live write is BLOCKED by gateway)',
    '/api/drafts/publish',
    {
      method: 'POST',
      headers: {
        'x-xhalo-admin-secret': sharedSecret,
        'cf-turnstile-token': turnstileToken,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Level 1 Smoke Test Dry Run',
        slug,
        body: 'Unauthorized live publish request attempt.',
        mode: 'live',
        publish_target: 'github'
      })
    },
    (status, json) => {
      if (status !== 403) return `Expected status 403 (Forbidden), got ${status}`;
      if (!json || !json.error || !json.error.includes('disabled')) {
        return `Expected write disabled error payload, got: ${JSON.stringify(json)}`;
      }
      return null;
    }
  );

  // 5. Verify GitHub Remote State
  await verifyGitHubState();

  console.log(`\nLevel 1 Read-Only Validation Summary:`);
  console.log(`  Passed: ${passedCount}`);
  console.log(`  Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n✗ Level 1 Read-Only Validation failed!`);
    process.exit(1);
  } else {
    console.log(`\n✓ Level 1 Read-Only Validation completed successfully!`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Validation failed unexpectedly:', err);
  process.exit(1);
});
