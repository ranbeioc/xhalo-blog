# Staging API Worker Smoke Test Matrix

This document defines the automated and manual verification suite for the `xhalo-blog` Cloudflare API Worker. These tests are executed against a live staging environment (or local wrangler sandbox) to ensure code correctess, route integrity, input validation, and security enforcement.

## Turnstile Security Bypass Warning

> [!WARNING]
> The Turnstile bypass token `dummy-token` used in these tests is **only** valid when the environment (staging/local) is configured with Cloudflare's official testing keys:
> - Sitekey: `1x0000000000000000000000000000000AA`
> - Secret Key: `1x0000000000000000000000000000000AA`
>
> In production environments, Turnstile verification **must** use real secret keys, and `dummy-token` will be rejected with a `403 Turnstile verification failed` response. Never document or configure production environments to allow dummy bypass tokens.

## Smoke Test Matrix

The test suite in [smoke-worker-routes.mjs](file:///c:/Users/ranbe/Documents/Github/xhalo-blog/scripts/smoke-worker-routes.mjs) covers 17 distinct scenarios categorised into:
1. **Public Routes** (No Authentication)
2. **Protected Read-only Routes** (Admin Secret Authentication Required)
3. **Protected Mutation Routes** (Admin Secret + Turnstile Token Required)
4. **Webhook Enpoints** (GitHub HMAC / Deployment Secret Validation)
5. **Rejection & Error Paths** (Access, Input Validation, Path Traversal, MIME Type limitations)

| # | Test Case Name | Method | Path | Required Headers | Payload / Body | Expected Status | Expected Body Structure / Check |
|---|---|---|---|---|---|---|---|
| 1 | Health Check | `GET` | `/api/health` | None | None | `200` | `{ "ok": true }` |
| 2 | Readiness Check | `GET` | `/api/readiness` | `x-xhalo-admin-secret` | None | `200` | `{ "summary": ... }` |
| 3 | Read Posts | `GET` | `/api/posts` | `x-xhalo-admin-secret` | None | `200` | `{ "items": [...] }` |
| 4 | Read Tasks | `GET` | `/api/tasks` | `x-xhalo-admin-secret` | None | `200` | `{ "items": [...] }` |
| 5 | Read Audit Logs | `GET` | `/api/audit-logs` | `x-xhalo-admin-secret` | None | `200` | `{ "items": [...] }` |
| 6 | Read Draft Template | `GET` | `/api/drafts/template` | `x-xhalo-admin-secret` | None | `200` | `{ "template": ... }` |
| 7 | Preview Draft | `POST` | `/api/drafts/preview` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | JSON: `title`, `slug` | `200` | `{ "preview": { "draft": ... } }` |
| 8 | Publish (Dry-Run) | `POST` | `/api/drafts/publish` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | JSON: `title`, `slug`, `mode: "dry-run"`, `publish_target: "d1"` | `200` | `{ "mode": "dry-run", ... }` |
| 9 | R2 Upload Preview | `POST` | `/api/assets/r2-preview` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | JSON: `filename`, `contentType`, `scope` | `200` | `{ "preview": { "objectKey": ... } }` |
| 10 | R2 Signed Upload (Dry-Run) | `POST` | `/api/assets/r2-signed-upload` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | JSON: `filename`, `contentType`, `scope`, `mode: "dry-run"` | `200` | `{ "mode": "dry-run", "plan": ... }` |
| 11 | Access Rejection (No Auth) | `GET` | `/api/readiness` | None | None | `401` | `{ "error": "Unauthorized admin API request." }` |
| 12 | Turnstile Rejection (No Token) | `POST` | `/api/drafts/publish` | `x-xhalo-admin-secret` | JSON: `title`, `slug`, `mode: "dry-run"` | `403` | `{ "error": "Turnstile verification failed." }` |
| 13 | GitHub Webhook Bad Signature | `POST` | `/webhooks/github` | `x-github-event`<br>`x-hub-signature-256` (invalid) | JSON dummy | `403` | `{ "error": "..." }` |
| 14 | Preview Webhook Bad Secret | `POST` | `/webhooks/deployments/preview` | `x-preview-webhook-secret` (invalid) | JSON: `branchName`, `status` | `403` | `{ "error": "..." }` |
| 15 | Malformed JSON Payload | `POST` | `/api/drafts/publish` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | `{invalid-json` | `400` | `{ "error": "Invalid JSON request body." }` |
| 16 | R2 MIME Disallowed Reject | `POST` | `/api/assets/r2-preview` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | JSON: `.exe` filename, `application/octet-stream` | `400` | `{ "error": "MIME type '...' is not allowed." }` |
| 17 | R2 Path Traversal Reject | `POST` | `/api/assets/r2-preview` | `x-xhalo-admin-secret`<br>`cf-turnstile-token` | JSON: `../evil.png` filename, `image/png` | `400` | `{ "error": "Filename contains invalid path traversal characters." }` |

## Execution Runbook

### Local execution (Wrangler dev)

1. Launch Wrangler local dev server:
   ```bash
   npx wrangler dev
   ```
2. In a separate shell, run the smoke test suite:
   ```bash
   SMOKE_TARGET_URL=http://localhost:8787 ADMIN_API_SHARED_SECRET=your-admin-shared-secret npm run test:smoke
   ```

### Staging execution (Cloudflare Remote)

Run the script pointing to the live staging worker. Keep live writes disabled by default (`SMOKE_EXPECT_LIVE_WRITES=false`).
```bash
SMOKE_TARGET_URL=https://xhalo-blog-staging-api.ranbei.workers.dev \
ADMIN_API_SHARED_SECRET=your-admin-shared-secret \
SMOKE_TURNSTILE_TOKEN=dummy-token \
SMOKE_EXPECT_LIVE_WRITES=false \
npm run test:smoke
```
