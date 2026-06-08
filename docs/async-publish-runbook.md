# Asynchronous Publish Smoke Testing Runbook

This document defines the instructions for executing and evaluating the asynchronous publish integration smoke test suite against local or staging Cloudflare Worker environments.

---

## 1. Scope and Configuration Variables

The integration testing script [`smoke-async-publish.mjs`](../scripts/smoke-async-publish.mjs) validates the end-to-end task queueing API, task registration in D1, and audit log generation. 

It is controlled via the following environment variables:

| Variable | Description | Default | Rationale |
|---|---|---|---|
| `ASYNC_PUBLISH_TARGET_URL` | The HTTP target URL of the active API Worker instance. | `http://localhost:8787` | Targets local dev server or remote staging endpoint. |
| `ADMIN_API_SHARED_SECRET` | The administrative key matched with the worker secret. | `test-admin-secret` | Required to bypass authentication limits. |
| `SMOKE_TURNSTILE_TOKEN` | The Turnstile challenge token passed in the headers. | `dummy-token` | Cloudflare staging/testing sitekey bypass token. |
| `ASYNC_PUBLISH_EXPECT_LIVE_WRITES` | Boolean flag enabling or disabling live enqueue testing. | `false` | **Critical safety gate**; must default to `false` to block writes. |

---

## 2. Testing Procedures

### A. Dry-run / Safety Rejection Verification (Writes Disabled)

This test confirms that when `ASYNC_PUBLISH_EXPECT_LIVE_WRITES` is disabled, any attempt to request a live publish is blocked immediately by the API Worker with a `403 Forbidden` response.

```bash
# Set target environment variables
$env:ASYNC_PUBLISH_TARGET_URL="http://localhost:8787"
$env:ADMIN_API_SHARED_SECRET="your-admin-shared-secret"
$env:SMOKE_TURNSTILE_TOKEN="dummy-token"
$env:ASYNC_PUBLISH_EXPECT_LIVE_WRITES="false"

# Execute the smoke script
node scripts/smoke-async-publish.mjs
```

**Expected Output**:
```text
Starting asynchronous publish smoke tests...
Target URL: http://localhost:8787
Admin Secret: ********
Turnstile Token: dummy-token
Expect Live Writes: false

✓ [PASS] POST /api/drafts/publish (Rejection: expectLiveWrites is false)

Asynchronous Smoke Test Summary:
  Passed: 1
  Failed: 0

✓ All asynchronous publish smoke tests completed successfully!
```

---

### B. Live Queueing Verification (Writes Enabled)

*This test should be run against a staging environment (or a local Wrangler container running with active Queue/D1 emulation).*

When `ASYNC_PUBLISH_EXPECT_LIVE_WRITES=true` is set:
1. The script requests a live publishing task from `POST /api/drafts/publish`.
2. The endpoint verifies authentication, registers a task/post in D1 tables, enqueues the task to the queue, and returns `202 Accepted` with a `task_id`.
3. The script queries `/api/tasks` to assert that the task record with the returned `task_id` is registered in D1.
4. The script queries `/api/audit-logs` to assert that the `draft_publish_queued` audit entry has been logged.

```bash
# Set environment variables for live writes
$env:ASYNC_PUBLISH_TARGET_URL="<staging-api-worker-url>"
$env:ADMIN_API_SHARED_SECRET="your-admin-shared-secret"
$env:SMOKE_TURNSTILE_TOKEN="dummy-token"
$env:ASYNC_PUBLISH_EXPECT_LIVE_WRITES="true"

# Run testing script
node scripts/smoke-async-publish.mjs
```

**Expected Output**:
```text
Starting asynchronous publish smoke tests...
Target URL: <staging-api-worker-url>
Admin Secret: ********
Turnstile Token: dummy-token
Expect Live Writes: true

Initiating live publishing verification request...
✓ [PASS] POST /api/drafts/publish (Live publish queueing)

Successfully enqueued publish task (ID: 9f7a5b3c-abcd-1234-efgh-567890123456).
✓ [PASS] GET /api/tasks (Confirm task registration)
✓ [PASS] GET /api/audit-logs (Confirm audit trail logged)

Asynchronous Smoke Test Summary:
  Passed: 3
  Failed: 0

✓ All asynchronous publish smoke tests completed successfully!
```

---

## 3. Post-Test Cleanup Checklist

Whenever a live writes test is executed:
* [ ] **Delete Git Branch**: Go to the testing repository on GitHub, delete the generated branch `drafts/smoke-test-async-live`.
* [ ] **Close Pull Request**: Close the generated Pull Request on GitHub.
* [ ] **Clean D1 Records**: Connect to your database shell and purge the test post/task:
  ```sql
  DELETE FROM posts_index WHERE slug = 'smoke-test-async-live';
  DELETE FROM tasks WHERE payload LIKE '%smoke-test-async-live%';
  ```
* [ ] **Reset Environment**: Revert the worker env variables and local variables to `ASYNC_PUBLISH_EXPECT_LIVE_WRITES=false`.
