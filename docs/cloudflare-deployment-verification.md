# Cloudflare Deployment Verification Guide

This guide describes how to verify that your Cloudflare workspace and bindings are properly configured before performing a production deployment of `xhalo-blog`.

## 1. Cloudflare Service Bindings Checklist

Ensure the following Cloudflare services are provisioned in your Cloudflare dashboard and match the bindings in your `wrangler.toml`:

| Binding Name | Binding Type | Cloudflare Resource Type | Purpose |
|---|---|---|---|
| `DB` | D1 Database | D1 Database | Stores article indices, audit logs, and task reconciliation details. |
| `ASSETS` | R2 Bucket | R2 Storage Bucket | Stores uploaded media assets, video poster images, and attachments. |
| `TASK_QUEUE` | Queue Producer | Cloudflare Queue | Offloads asynchronous webhook processing and background sync tasks. |

---

## 2. Wrangler Configuration Audit

`xhalo-blog` splits HTTP API operations and Queue consumption into two decoupled workers. Verify that their respective `wrangler.toml` configurations (created from their `wrangler.toml.example` templates) meet the following criteria:

### 2.1 HTTP API Worker (`workers/api/wrangler.toml`)
- [ ] **Name**: Set correctly (e.g. `xhalo-blog-api`).
- [ ] **Main Entrypoint**: `main` is set to `"src/index.js"`.
- [ ] **Compatibility Date**: `compatibility_date` is set to `"2026-06-01"` or later.
- [ ] **Live Write Gate**: `[vars] LIVE_WRITES_ENABLED = "false"` is set by default.
- [ ] **D1 Databases**: Binding `binding = "DB"` matches your active D1 `database_id`.
- [ ] **R2 Buckets**: Binding `binding = "ASSETS"` points to your active R2 `bucket_name`.
- [ ] **Queues Producer**: Binding `binding = "TASK_QUEUE"` points to your queue name (e.g. `xhalo-blog-tasks`).
- [ ] **No Queue Consumer**: Confirm **no** `[[queues.consumers]]` block is present in this worker configuration.

### 2.2 Queue Worker (`workers/queue/wrangler.toml`)
- [ ] **Name**: Set correctly (e.g. `xhalo-blog-queue`).
- [ ] **Main Entrypoint**: `main` is set to `"src/index.js"`.
- [ ] **Compatibility Date**: `compatibility_date` is set to `"2026-06-01"` or later.
- [ ] **D1 Databases**: Binding `binding = "DB"` matches your active D1 `database_id` (so it can reconcile task statuses).
- [ ] **Queues Consumer**: The `[[queues.consumers]]` block is present, specifying `queue = "xhalo-blog-tasks"`, `max_batch_size = 10`, and `max_batch_timeout = 30`.
- [ ] **No Producer/R2 Buckets**: Confirm **no** `TASK_QUEUE` producer binding or `ASSETS` R2 bucket binding is present.

---

## 3. Environment Variables & Secret Configuration

Production secrets must **never** be checked into version control. Ensure all variables mapped in the environment matrix (`docs/cloudflare-env-matrix.md`) are configured either in the Cloudflare Worker's Dashboard or via Wrangler commands:

```bash
npx wrangler secret put ADMIN_API_SHARED_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put GITHUB_TOKEN
```

---

## 4. Admin Panel & Access Integration Checklist

If you are using Cloudflare Access and Cloudflare Turnstile to protect your admin dashboard:

- [ ] **Turnstile Site Key**: Ensure `TURNSTILE_SITE_KEY` is set as a public environment variable in `wrangler.toml` (or inside the Worker dashboard).
- [ ] **Turnstile Secret Key**: Enforce that `TURNSTILE_SECRET_KEY` is uploaded as a Worker secret.
- [ ] **Access Team Domain**: `ACCESS_TEAM_DOMAIN` matches the domain of your Cloudflare Access account (e.g. `my-team.cloudflareaccess.com`).
- [ ] **Access Audience Tag**: `ACCESS_AUDIENCE_TAG` matches the Application Audience Tag from your Cloudflare Access dashboard to prevent token replay attacks.
