# Level 2 PR Generator Mode Trial Runbook

This document defines the instructions for conducting a **Level 2 (PR Generator Mode)** trial run against a production or staging Hexo blog repository. In Level 2, write privileges are enabled but strictly restricted to creating draft branches (`draft/*`) and opening Pull Requests. Direct pushes to `main` and auto-merges are entirely prohibited.

---

## 1. Safety Gates & Prerequisites

Before initiating a Level 2 trial:
1. **Level 1 Validation**: Must have successfully passed without errors.
2. **Owner Approval**: Explicit manual approval from the repository owner must be obtained.
3. **Branch Protection**: Verify that the target repository has branch protection enabled for `main` (blocking direct pushes and force-pushes).
4. **No Auto-Merge**: Verify that auto-merge is disabled at both the GitHub repository configuration level and within the worker code configuration.

---

## 2. Configuration Settings

Temporarily adjust the target Worker environment variables to enable writes:

| Variable | Target Value | Rationale |
|---|---|---|
| `LIVE_WRITES_ENABLED` | `true` | Enables active write and queue processing loops. |
| `ADMIN_API_SHARED_SECRET` | `your-admin-shared-secret` | For admin route authorization. |
| `TURNSTILE_TOKEN` | `<operator-completed-turnstile-token>` | Turnstile challenge token for validating the request. |

*Note: For staging/testing environments utilizing Cloudflare Turnstile test keys, the sitekey bypass token `dummy-token` may be used. For production-like trials, use a real Turnstile challenge token. Immediately after the trial completes, `LIVE_WRITES_ENABLED` must be reverted to `false`.*

---

## 3. Execution Steps

### Step 1: Trigger Live Publish Request
Submit a POST request with `mode: "live"` to enqueue the publish task. A valid Turnstile challenge token must be included:
```bash
curl -X POST "https://<production-api-url>/api/drafts/publish" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret" \
  -H "cf-turnstile-token: <turnstile-token>" \
  -H "content-type: application/json" \
  -d '{
    "title": "Level 2 Trial Post",
    "slug": "level-2-trial-post",
    "body": "This is a Level 2 PR Generator trial post content.",
    "mode": "live",
    "publish_target": "github"
  }'
```

**Expected Response (202 Accepted)**:
```json
{
  "mode": "live",
  "status": "queued",
  "task_id": "<returned-task-id>",
  "preview": {
    "draft": {
      "title": "Level 2 Trial Post",
      "slug": "level-2-trial-post"
    },
    "filePath": "source/_posts/level-2-trial-post.md",
    "branchName": "draft/level-2-trial-post"
  },
  "persisted": true
}
```

### Step 2: Track Task Lifecycle in D1
Verify the task status transitions from `queued` to `processing` and finally `completed`:
```bash
curl -X GET "https://<production-api-url>/api/tasks" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```

Verify that the task with `<returned-task-id>` reaches `status: "completed"`.

### Step 3: Verify GitHub Changes
1. Log in to GitHub and check the target repository.
2. Confirm that a new branch named `draft/level-2-trial-post` was created.
3. Confirm that a Pull Request was opened to merge `draft/level-2-trial-post` into `main`.
4. Inspect the PR content to verify that the Markdown file format, title metadata, and front-matter are correct.
5. **Verify that no direct commits or merges to `main` took place.**

### Step 4: Verify Audit Trail
Check the audit log to ensure the creation and completion events are registered:
```bash
curl -X GET "https://<production-api-url>/api/audit-logs" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```

Verify that both `draft_publish_queued` and `draft_publish_completed` actions exist.

---

## 4. Post-Trial Cleanup Checklist

Immediately upon completing the trial:
* [ ] **Revert Safety Gate**: Set `LIVE_WRITES_ENABLED=false` in the Cloudflare Worker settings.
* [ ] **Delete Git Branch**: Go to GitHub and delete the generated branch `draft/level-2-trial-post`.
* [ ] **Close Pull Request**: Close the generated Pull Request on GitHub. Do not merge it.
* [ ] **Clean D1 Records**: Purge the test post index and task history records:
  ```sql
  DELETE FROM posts_index WHERE slug = 'level-2-trial-post';
  DELETE FROM tasks WHERE id = '<returned-task-id>' OR payload LIKE '%level-2-trial-post%';
  ```
