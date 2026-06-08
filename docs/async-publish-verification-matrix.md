# Async Publish Verification Matrix

This matrix describes the 17 integration verification test cases designed to validate the **Phase 7.1 Queue Worker Asynchronous Publish Loop** against a staging environment before promotion to production.

---

## Verification Test Cases

| ID | Scenario / Action | Pre-conditions | Expected Result / Outcome |
|---|---|---|---|
| **1** | Request live publish with writes disabled | `LIVE_WRITES_ENABLED=false` | Returns `403 Forbidden` with a "live write disabled" error. No D1 task or queue entry is created. |
| **2** | Request live publish with missing Queue | `TASK_QUEUE` binding missing | Returns `500 Internal Server Error` with a structured payload. |
| **3** | Request live publish with valid configuration | `LIVE_WRITES_ENABLED=true`, Turnstile & Access authenticated | Returns `202 Accepted` with a structured payload containing `task_id` and status `queued`. |
| **4** | D1 task registration | Case 3 successfully executes | A task row is inserted into D1 `tasks` table with status `queued` and type `draft_publish`. |
| **5** | D1 posts index registration | Case 3 successfully executes | A post record is upserted into D1 `posts_index` table with status `queued`. |
| **6** | Queue message delivery | Case 3 successfully executes | A Cloudflare Queue message wrapping the task envelope is sent and delivered to the Queue Worker. |
| **7** | Task state transition: Processing | Queue Worker begins execution | D1 `tasks` row status is updated from `queued` to `processing`. |
| **8** | GitHub draft branch creation | Staging GitHub App credentials verified | A new Git branch `draft/<slug>` is created from the repository default branch (`main`). |
| **9** | Markdown commit to branch | Staging GitHub App credentials verified | Hexo-formatted Markdown file is committed at `source/_posts/<slug>.md` on the new branch. |
| **10** | Pull Request creation | Staging GitHub App credentials verified | A new Pull Request from `draft/<slug>` to `main` is opened on GitHub. |
| **11** | Idempotent Branch Reuse | Branch `draft/<slug>` already exists | Worker fetches the existing branch's head SHA and commits to it successfully. No branch duplication error is thrown. |
| **12** | Idempotent PR Reuse | Pull Request for branch already open | Worker detects the existing open PR and returns it. No "validation failed" error is thrown. |
| **13** | GitHub API Conflict (409) | Concurrent edit on branch file | Worker catches `409 Conflict`, updates D1 task and post status to `failed`, logs a structured error, and flags the failure. |
| **14** | Missing GitHub Configuration | `GITHUB_TOKEN` and App credentials both missing | Worker flags missing config early, updates D1 task and post status to `failed`, and logs a structured config error (`533`). |
| **15** | Audit Log: Queued | Case 3 successfully executes | An audit log entry is written to D1 `audit_logs` with action `draft_publish_queued` and status `202`. |
| **16** | Audit Log: Success | Asynchronous loop completes successfully | An audit log entry is written to D1 `audit_logs` with action `draft_publish_completed` and status `200`. |
| **17** | Audit Log: Failure | Asynchronous loop fails (e.g. 409, 533) | An audit log entry is written to D1 `audit_logs` with action `draft_publish_failed` containing the sanitized error message. |

---

## Execution Constraints

1. **Staging Isolation**:
   * Staging runs **must** target a mock/test repository (e.g. `<owner>/xhalo-blog-test`), not the live production repository.
   * `LIVE_WRITES_ENABLED=true` must only be set temporarily on the Cloudflare staging environment variables panel during the verification run.
2. **Post-Test Cleanup**:
   * After the verification matrix is executed:
     * Delete staging test branches (`draft/<slug>`) and close the test PRs.
     * Revert the `LIVE_WRITES_ENABLED` environment variable back to `false`.
     * Clean up test records from D1 staging tables (`tasks`, `posts_index`, `audit_logs`).
