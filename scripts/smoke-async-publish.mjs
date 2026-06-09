/**
 * xhalo-blog Asynchronous Publish Smoke Testing Script
 * Validates the async queue publish flow endpoints, task structures, and audit trail.
 *
 * NOTE: The 'dummy-token' value is ONLY valid for staging environments configured with
 * Cloudflare Turnstile's official test credentials (sitekey/secret = '1x0000000000000000000000000000000AA').
 * It must NEVER be documented or used as a production bypass.
 *
 * Usage:
 *   ASYNC_PUBLISH_TARGET_URL=http://localhost:8787 \
 *   ADMIN_API_SHARED_SECRET=your_secret \
 *   SMOKE_TURNSTILE_TOKEN=dummy-token \
 *   ASYNC_PUBLISH_EXPECT_LIVE_WRITES=false \
 *   ASYNC_PUBLISH_MODE=local \
 *   node scripts/smoke-async-publish.mjs
 */

const targetUrl = (process.env.ASYNC_PUBLISH_TARGET_URL || 'http://localhost:8787').replace(/\/$/, '');
const sharedSecret = process.env.ADMIN_API_SHARED_SECRET || 'test-admin-secret';
const turnstileToken = process.env.SMOKE_TURNSTILE_TOKEN || 'dummy-token';
const expectLiveWrites = process.env.ASYNC_PUBLISH_EXPECT_LIVE_WRITES === 'true';
const publishMode = process.env.ASYNC_PUBLISH_MODE || 'local';
const pollTimeout = parseInt(process.env.ASYNC_PUBLISH_POLL_TIMEOUT_MS || '120000', 10);
const pollInterval = parseInt(process.env.ASYNC_PUBLISH_POLL_INTERVAL_MS || '5000', 10);
const expectFailure = process.env.ASYNC_PUBLISH_EXPECT_FAILURE === 'true';

console.log(`Starting asynchronous publish smoke tests...`);
console.log(`Target URL: ${targetUrl}`);
console.log(`Admin Secret: ${sharedSecret ? '********' : '(not set)'}`);
console.log(`Turnstile Token: ${turnstileToken}`);
console.log(`Expect Live Writes: ${expectLiveWrites}`);
console.log(`Publish Mode: ${publishMode}\n`);

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
      return { status: res.status, json, success: true };
    } else {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`  Details: ${errorMsg}`);
      console.error(`  Status: ${res.status}`);
      console.error(`  Response: ${text.substring(0, 200)}`);
      failedCount++;
      return { status: res.status, json, success: false };
    }
  } catch (err) {
    console.error(`✗ [ERROR] ${name}`);
    console.error(`  Failed to connect or process request: ${err.message}`);
    failedCount++;
    return { success: false, error: err };
  }
}

async function pollTask(taskId, timeout, interval, expectFailure) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${targetUrl}/api/tasks`, {
        method: 'GET',
        headers: { 'x-xhalo-admin-secret': sharedSecret }
      });
      if (res.status === 200) {
        const json = await res.json();
        const task = json.items ? json.items.find(item => item.id === taskId) : null;
        if (task) {
          const status = task.status;
          console.log(`Polling task ${taskId}... status: ${status}`);
          if (status === 'completed' || status === 'failed') {
            if (expectFailure && status === 'failed') {
              return { status, success: true };
            }
            if (!expectFailure && status === 'completed') {
              return { status, success: true };
            }
            return {
              status,
              success: false,
              error: `Task finished with status '${status}' but expected failure is ${expectFailure}`
            };
          }
        } else {
          console.warn(`Task ${taskId} not found in listing response, retrying...`);
        }
      } else {
        console.warn(`Failed to query tasks list (status: ${res.status}), retrying...`);
      }
    } catch (err) {
      console.warn(`Error polling task: ${err.message}, retrying...`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return { success: false, error: `Task polling timed out after ${timeout}ms` };
}

async function main() {
  if (publishMode !== 'local' && publishMode !== 'staging' && publishMode !== 'e2e') {
    console.error(`Invalid ASYNC_PUBLISH_MODE: ${publishMode}`);
    process.exit(1);
  }

  if ((publishMode === 'staging' || publishMode === 'e2e') && !expectLiveWrites) {
    console.error(`Error: ASYNC_PUBLISH_EXPECT_LIVE_WRITES=true is required when ASYNC_PUBLISH_MODE is '${publishMode}'.`);
    process.exit(1);
  }

  // 1. Dry-run safety rejection check (only in local mode when expectLiveWrites is false)
  if (publishMode === 'local' && !expectLiveWrites) {
    await runTest(
      'POST /api/drafts/publish (Rejection: expectLiveWrites is false)',
      '/api/drafts/publish',
      {
        method: 'POST',
        headers: {
          'x-xhalo-admin-secret': sharedSecret,
          'content-type': 'application/json',
          'cf-turnstile-token': turnstileToken
        },
        body: JSON.stringify({
          title: 'Smoke Test Async Disabled',
          slug: 'smoke-test-async-disabled',
          body: 'Content',
          mode: 'live'
        })
      },
      (status, json) => {
        if (status !== 403) return `Expected status 403 (Forbidden), got ${status}`;
        if (!json || !json.error || !json.error.includes('disabled')) {
          return `Expected live write disabled error message, got ${JSON.stringify(json)}`;
        }
        return null;
      }
    );
  } else {
    // For local (with live writes enabled), staging, or e2e modes:
    console.log(`Initiating live publishing verification request in '${publishMode}' mode...`);
    const publishResult = await runTest(
      'POST /api/drafts/publish (Live publish queueing)',
      '/api/drafts/publish',
      {
        method: 'POST',
        headers: {
          'x-xhalo-admin-secret': sharedSecret,
          'content-type': 'application/json',
          'cf-turnstile-token': turnstileToken
        },
        body: JSON.stringify({
          title: 'Staging Async E2E Smoke Test',
          slug: 'staging-async-e2e-smoke',
          body: 'This is a synthetic staging async E2E smoke test post. It must not be merged into production.',
          mode: 'live',
          publish_target: 'github'
        })
      },
      (status, json, text) => {
        if (publishMode === 'local') {
          if (status !== 202 && status !== 500) {
            return `Expected status 202 or 500, got ${status}`;
          }
          if (status === 500) {
            if (!text.includes('TASK_QUEUE is not bound')) {
              return `Expected 500 error message to be 'TASK_QUEUE is not bound', got: ${text}`;
            }
          }
        } else {
          // staging or e2e
          if (status !== 202) {
            return `Expected status 202, got ${status}`;
          }
        }
        if (status === 202) {
          if (!json || json.status !== 'queued' || !json.task_id) {
            return `Expected queued status and task_id in payload, got ${JSON.stringify(json)}`;
          }
        }
        return null;
      }
    );

    if (publishResult.success && publishResult.status === 202) {
      const taskId = publishResult.json.task_id;
      console.log(`\nSuccessfully enqueued publish task (ID: ${taskId}).`);

      // Verify the task exists in the tasks list
      await runTest(
        'GET /api/tasks (Confirm task registration)',
        '/api/tasks',
        {
          method: 'GET',
          headers: { 'x-xhalo-admin-secret': sharedSecret }
        },
        (status, json) => {
          if (status !== 200) return `Expected status 200, got ${status}`;
          if (!json || !Array.isArray(json.items)) return `Expected items list, got ${JSON.stringify(json)}`;
          const found = json.items.some(item => item.id === taskId);
          if (!found) return `Task with ID ${taskId} was not found in the database task history list.`;
          return null;
        }
      );

      // Verify the audit trail queued log exists
      await runTest(
        'GET /api/audit-logs (Confirm audit trail logged)',
        '/api/audit-logs',
        {
          method: 'GET',
          headers: { 'x-xhalo-admin-secret': sharedSecret }
        },
        (status, json) => {
          if (status !== 200) return `Expected status 200, got ${status}`;
          if (!json || !Array.isArray(json.items)) return `Expected items list, got ${JSON.stringify(json)}`;
          const found = json.items.some(item => item.action === 'draft_publish_queued' && item.resource_id === 'staging-async-e2e-smoke');
          if (!found) return `Audit log action 'draft_publish_queued' was not found for slug 'staging-async-e2e-smoke'.`;
          return null;
        }
      );

      // E2E Polling Verification
      if (publishMode === 'e2e') {
        console.log(`\nStarting E2E task execution polling...`);
        console.log(`Timeout: ${pollTimeout}ms, Interval: ${pollInterval}ms, Expect Failure: ${expectFailure}`);
        
        const pollResult = await pollTask(taskId, pollTimeout, pollInterval, expectFailure);
        if (!pollResult.success) {
          console.error(`✗ [FAIL] E2E task execution failed`);
          console.error(`  Details: ${pollResult.error}`);
          failedCount++;
        } else {
          console.log(`✓ [PASS] E2E task execution completed (terminal state: ${pollResult.status})`);
          passedCount++;

          // Verify audit log completed or failed actions
          const expectedAction = expectFailure ? 'draft_publish_failed' : 'draft_publish_completed';
          await runTest(
            `GET /api/audit-logs (Confirm terminal audit log '${expectedAction}')`,
            '/api/audit-logs',
            {
              method: 'GET',
              headers: { 'x-xhalo-admin-secret': sharedSecret }
            },
            (status, json) => {
              if (status !== 200) return `Expected status 200, got ${status}`;
              if (!json || !Array.isArray(json.items)) return `Expected items list, got ${JSON.stringify(json)}`;
              const found = json.items.some(item => item.action === expectedAction && item.resource_id === 'staging-async-e2e-smoke');
              if (!found) return `Audit log action '${expectedAction}' was not found for slug 'staging-async-e2e-smoke'.`;
              return null;
            }
          );
        }
      }
    } else if (publishResult.status === 500) {
      console.log(`\n[INFO] Publish route hit successfully but returned 500 (TASK_QUEUE missing). This is expected in local mode.`);
    }
  }

  console.log(`\nAsynchronous Smoke Test Summary:`);
  console.log(`  Passed: ${passedCount}`);
  console.log(`  Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n✗ Asynchronous publish smoke tests failed!`);
    process.exit(1);
  } else {
    console.log(`\n✓ Asynchronous publish smoke tests completed successfully!`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Smoke testing failed unexpectedly:', err);
  process.exit(1);
});
