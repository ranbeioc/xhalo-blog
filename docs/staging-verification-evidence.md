# Staging Verification Evidence

> [!NOTE]
> This file contains sanitized evidence templates and criteria for Cloudflare staging deployment verification runs. Do not write raw secrets, API tokens, account IDs, or private credentials into this repository.

## Phase 6.1 Smoke Test Run

- **Verification Date**: 2026-06-08
- **Staging Environment**: Staging API Worker deployed at `<staging-api-worker-url>`
- **Wrangler Bindings**:
  - D1 Database: `xhalo-blog-staging` (UUID: `f62ca342-dd3e-4fa8-a133-b739bece78d6`)
  - R2 Bucket: `xhalo-blog-staging-assets`
  - Cloudflare Queue: `xhalo-blog-staging-tasks`
- **Command Executed**:
  ```bash
  SMOKE_TARGET_URL="<staging-api-worker-url>" ADMIN_API_SHARED_SECRET="<redacted-staging-admin-secret>" npm run test:smoke
  ```
- **Result**: ✅ **17/17 smoke tests passed successfully**.
  - All public endpoints (`/api/health`, `/api/scaffold`) returned `200`.
  - All authentication checks rejected requests without headers with `401`.
  - Input schema validations rejected invalid slugs, large bodies, and injection payloads with `400`.
  - R2 validation checks successfully rejected forbidden MIME types and path traversals with `400`.
  - Turnstile and Webhook signature gates successfully rejected bad signatures with `403`.

---

## Historical Pre-Phase-7.1 Synchronous Live-Write Verification Run

> [!NOTE]
> This section describes the pre-Phase-7.1 synchronous verification run and must not be used as current active asynchronous publishing evidence.

- **Verification Date**: 2026-06-08
- **Target Repository**: `<owner>/<test-repo>` (GitHub App installed on staging test repository)
- **Status of LIVE_WRITES_ENABLED**: Temporarily set to `true` on staging Worker for verification run, and reverted to `false` afterwards.

### 1. GitHub PR Creation (POST /api/drafts/publish)
- **Slug**: `staging-live-closed-loop-verification-post`
- **Result**: ✅ Created branch `drafts/staging-live-closed-loop-verification-post` and opened Pull Request #1 in the test repository.
- **Idempotency**: Rerunning request successfully returned `200` pointing to the existing PR URL (no duplicate PRs created).

### 2. Preview Webhook Reconciliation (POST /webhooks/deployments/preview)
- **Mock Body**:
  ```json
  {
    "branchName": "drafts/staging-live-closed-loop-verification-post",
    "postSlug": "staging-live-closed-loop-verification-post",
    "previewUrl": "https://preview-post-1234.pages.dev",
    "provider": "cloudflare-pages",
    "status": "preview-ready"
  }
  ```
- **Result**: ✅ `200` Accepted. D1 database reconciled and `/api/posts` returns correct `preview_url`.

### 3. R2 Signed Upload (POST /api/assets/r2-signed-upload & PUT /api/assets/r2-upload/:token)
- **Object Key**: `uploads/global/hello-world.png`
- **Result**: ✅ Image successfully uploaded to staging R2 bucket.

### 4. D1 Audit Trail Verification (GET /api/audit-logs)
- **D1 Audit Log Actions Persisted**:
  - `draft_publish` (status 200)
  - `r2_signed_upload` (status 201)
  - `preview_deployment` (status 200)
  - `turnstile_rejected` (status 403, verification boundary check)

### 5. Post-Test Cleanup
- [x] Closed test PR #1 and deleted branch on GitHub.
- [x] Deleted R2 object `uploads/global/hello-world.png` from R2 staging bucket.
- [x] Deleted D1 database records for test slug `staging-live-closed-loop-verification-post`.
- [x] Reverted `LIVE_WRITES_ENABLED` to `false` on Cloudflare staging Worker dashboard.

---

## Phase 7.1 Async Publish Evidence

> [!IMPORTANT]
> This section must be completed only after running the Queue Worker async publish loop against staging-only resources.

| Field | Value |
|---|---|
| Date | YYYY-MM-DD (Placeholder) |
| Environment | staging |
| API Worker | `<staging-api-worker-url>` |
| Queue Worker | `<staging-queue-worker-name>` |
| Test repository | `<owner>/<test-repo>` |
| LIVE_WRITES_ENABLED | temporarily `true`, reverted `false` |
| API publish response | `202 Accepted` |
| task_id | `<redacted-task-id-or-format-only>` |
| Initial task status | `queued` |
| Queue processing status | `completed` / `failed` |
| Final post status | `preview-ready` / `failed` |
| GitHub branch | `drafts/<slug>` |
| GitHub PR | `<sanitized-pr-reference>` |
| Audit actions | `draft_publish_queued`, `draft_publish_completed` |
| Cleanup | `completed` / `pending` |

### Required verification queries
- `GET /api/tasks` shows task lifecycle (status moves: `queued` -> `processing` -> `completed`).
- `GET /api/posts` shows post status = `preview-ready`.
- `GET /api/audit-logs` includes `draft_publish_queued` and `draft_publish_completed` (or `draft_publish_failed` if failed).
- Test branch and PR are cleaned up.
- `LIVE_WRITES_ENABLED` is reverted to `false` on the staging environment.
