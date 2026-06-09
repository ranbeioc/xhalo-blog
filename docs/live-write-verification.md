# Staging Live-Write Closed-Loop Verification

This document details the verification plan and steps to execute a controlled, live-write closed-loop validation of the publishing and asset upload pipeline using staging-only Cloudflare resources and an isolated test GitHub repository.

---

## Current Implementation Boundary

As of `v0.1.0-alpha.0` (with Phase 7.1 integrated):
- **Asynchronous Publishing**: The HTTP API Worker (`workers/api`) owns and executes request validation, Turnstile verification, and admin authorization. It creates a task record in D1, pushes it to `TASK_QUEUE`, and returns `202 Accepted` immediately (no direct GitHub writes are executed in the API Worker for live publishing).
- **Queue Worker Execution**: The Queue Worker (`workers/queue`) consumes the `draft_publish` task and executes the live GitHub API publishing logic asynchronously (including App JWT/token exchange, branch creation, file commits, PR creation, D1 status updates, and audit logging).
- **Dry-run Planning**: Dry-run publishing requests (`mode != 'live'`) are still handled synchronously by the API Worker, returning the generated git operation plan without executing any writes.

---

## 1. Prerequisites & Environment State

To run the live-write tests, the Cloudflare staging API Worker and Queue Worker must be configured in the Cloudflare dashboard (or via local secrets) with the following environment variables:

```bash
LIVE_WRITES_ENABLED=true
GITHUB_OWNER=ranbeioc
GITHUB_REPO=xhalo-blog-test
GITHUB_BRANCH=main
# Secrets (set via wrangler secret put or dashboard)
ADMIN_API_SHARED_SECRET=your-admin-shared-secret
ASSETS_SIGNING_SECRET=your-secret
GITHUB_WEBHOOK_SECRET=dummy-github-webhook-secret
PREVIEW_WEBHOOK_SECRET=dummy-preview-webhook-secret
GITHUB_APP_ID=...
GITHUB_INSTALLATION_ID=...
GITHUB_APP_PRIVATE_KEY=<placeholder>
```

Verify that the readiness API (`GET /api/readiness`) reports `status: "ready"` or `status: "partial"` (for live writes) across all active components.

---

## 2. Step-by-Step Live Loop Verification

### 2.1 Asynchronous Staging Path (Queue Worker Async Publish)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Blog Administrator
    participant API as Staging API Worker
    participant Queue as Task Queue
    participant Consumer as Queue Worker
    participant Github as Test GitHub Repo
    participant Pages as Pages Preview Webhook
    participant D1 as D1 Database (audit_logs)

    Admin->>API: 1. POST /api/drafts/publish (mode=live, target=github)
    API->>D1: Insert task record (status=queued) & upsert posts_index (status=queued)
    API->>Queue: 2. Enqueue draft_publish task
    API->>D1: Log draft_publish_queued success (status=202)
    API-->>Admin: 202 Accepted (Task ID returned)

    Queue->>Consumer: Dispatch task
    Consumer->>Github: 3. Create branch, commit Markdown, open PR (Asynchronous)
    Consumer->>D1: Update task status to "completed" / "failed"
    Consumer->>D1: Upsert posts_index (status=preview-ready / failed)
    Consumer->>D1: Log draft_publish_completed / draft_publish_failed (Asynchronous)

    Pages->>API: 4. POST /webhooks/deployments/preview (Status update)
    API->>D1: Reconcile post state & save preview_url
    API->>D1: Log preview_deployment success (status=200)
    API-->>Pages: 200 Accepted

    Admin->>API: 5. GET /api/audit-logs
    API-->>Admin: Return complete audit log history
```
```

---

## 3. API Request and Response Verification Templates

### Test A: R2 Signed Upload Loop

#### 1. Request Signed Upload Plan
- **Method**: `POST`
- **Path**: `/api/assets/r2-signed-upload`
- **Headers**:
  ```http
  x-xhalo-admin-secret: your-admin-shared-secret
  cf-turnstile-token: dummy-token
  content-type: application/json
  ```
- **Body**:
  ```json
  {
    "filename": "hello-world.png",
    "contentType": "image/png",
    "scope": "global",
    "mode": "live",
    "ttlSeconds": 120
  }
  ```

#### 2. Execute Asset Upload PUT
- **Method**: `PUT`
- **Path**: `/api/assets/r2-upload/<signed-token-string>`
- **Headers**:
  ```http
  content-type: image/png
  ```
- **Body**: *Raw binary image data (less than 1 MiB)*

#### 3. Expected Outcomes
- **PUT Response**: `201 Created` with payload:
  ```json
  {
    "mode": "signed-upload",
    "objectKey": "uploads/global/hello-world.png",
    "publicUrl": "https://assets-staging.example.com/uploads/global/hello-world.png"
  }
  ```
- **Audit Log Entry**: Check `audit_logs` has action `r2_signed_upload` for resource `asset` with `resource_id = uploads/global/hello-world.png` and `status_code = 201`.

---

### Test B: GitHub Publishing Loop

#### 1. Request Draft Publish
- **Method**: `POST`
- **Path**: `/api/drafts/publish`
- **Headers**:
  ```http
  x-xhalo-admin-secret: your-admin-shared-secret
  cf-turnstile-token: dummy-token
  content-type: application/json
  ```
- **Body**:
  ```json
  {
    "title": "Staging Live Closed-Loop Verification Post",
    "slug": "staging-live-closed-loop-verification-post",
    "body": "---\ntitle: Staging Live Closed-Loop Verification Post\ndate: 2026-06-08\n---\n\nThis is a live test article published via the staging closed-loop pipeline.",
    "mode": "live",
    "publish_target": "github"
  }
  ```

#### 2. Expected Outcomes
- **API Response**: `202 Accepted` with payload:
  ```json
  {
    "mode": "live",
    "status": "queued",
    "task_id": "<task-uuid>",
    "preview": { ... },
    "plan": { ... }
  }
  ```
- **Test Repository PR**:
  - A branch named `draft/staging-live-closed-loop-verification-post` is created.
  - A commit adding `source/_posts/2026-06-08-staging-live-closed-loop-verification-post.md` is pushed.
  - A Pull Request into `main` is opened by the GitHub App.
- **Idempotency Check**: Re-running the identical publish request returns `202 Accepted` with a new task ID. The Queue Worker will process the task, check the GitHub repository, and update task status to `completed` while reusing the **same** Pull Request URL (no duplicate PRs created).
- **Audit Log Entries**:
  - API Worker logs `draft_publish_queued` with `status_code = 202` for resource `post`.
  - Queue Worker logs `draft_publish_completed` with `status_code = 200` for resource `post` upon successful asynchronous completion.

---

### Test C: Preview Webhook Reconciliation Loop

#### 1. Dispatch Mock Preview Webhook
- **Method**: `POST`
- **Path**: `/webhooks/deployments/preview`
- **Headers**:
  ```http
  x-preview-webhook-secret: dummy-preview-webhook-secret
  content-type: application/json
  ```
- **Body**:
  ```json
  {
    "branchName": "draft/staging-live-closed-loop-verification-post",
    "postSlug": "staging-live-closed-loop-verification-post",
    "previewUrl": "https://preview-post-1234.pages.dev",
    "provider": "cloudflare-pages",
    "status": "preview-ready"
  }
  ```

#### 2. Expected Outcomes
- **API Response**: `200 OK`
- **D1 posts_index Update**: Querying `/api/posts` returns the post with `status = "preview-ready"` and `preview_url = "https://preview-post-1234.pages.dev"`.
- **Audit Log Entry**: Check `audit_logs` has action `preview_deployment` for resource `deployment` with `resource_id = staging-live-closed-loop-verification-post`.

---

### Test D: Boundary Constraint Enforcement

Verify the following security boundary rejections:

| Test Scenario | Action | Payload | Expected Status | Error Message / Pattern |
|---|---|---|---|---|
| Access Block | `GET /api/posts` | No admin header | `401` | `Unauthorized admin API request.` |
| Turnstile Block | `POST /api/drafts/publish` | Missing turnstile header | `403` | `Turnstile verification failed.` |
| MIME Limit Block | `POST /api/assets/r2-preview` | `test.exe` / `application/octet-stream` | `400` | `MIME type 'application/octet-stream' is not allowed.` |
| Path Traversal Block | `POST /api/assets/r2-preview` | `../hello.png` / `image/png` | `400` | `Filename contains invalid path traversal characters.` |
| Payload Size Block | `PUT /api/assets/r2-upload/:token` | 2 MiB payload file | `413` | `Prototype signed uploads are limited to 1 MiB.` |
| GitHub Signature Block | `POST /webhooks/github` | Bad signature header | `403` | `GitHub webhook signature mismatch.` |

---

## 4. Rollback & Staging Clean-Up Guide

After verification is complete, clean up the testing artifacts:
1. **GitHub Repository**: Close the created Pull Request and delete the `draft/staging-live-closed-loop-verification-post` branch in the `<owner>/<test-repo>` repository.
2. **R2 Bucket**: Delete the uploaded object `uploads/global/hello-world.png` in the `xhalo-blog-staging-assets` bucket.
3. **D1 Database**: Run clean-up commands to remove test database records:
   ```sql
   DELETE FROM posts_index WHERE slug = 'staging-live-closed-loop-verification-post';
   DELETE FROM tasks WHERE payload LIKE '%staging-live-closed-loop-verification-post%';
   ```
4. **Disable Live Writes**: Revoke the `LIVE_WRITES_ENABLED=true` variable in your Cloudflare staging Worker dashboard (reset it to `false`).
