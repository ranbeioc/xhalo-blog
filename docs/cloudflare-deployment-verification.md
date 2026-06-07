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

Before running `npx wrangler deploy`, verify that your `wrangler.toml` (created from `wrangler.toml.example`) meets the following criteria:

- [ ] **Name**: The worker name is set correctly (e.g. `xhalo-blog-api`).
- [ ] **Main Entrypoint**: `main` is set to `"workers/api/src/index.js"`.
- [ ] **Compatibility Date**: `compatibility_date` is configured to `"2026-06-01"` or later to enable current ES features.
- [ ] **D1 Databases**: The `d1_databases` array contains a binding `binding = "DB"` and has your active D1 `database_id` specified.
- [ ] **R2 Buckets**: The `r2_buckets` array contains a binding `binding = "ASSETS"` pointing to your active R2 `bucket_name`.
- [ ] **Queues Producer**: The `queues.producers` array contains a binding `binding = "TASK_QUEUE"` and the queue name matches your queue.
- [ ] **Queues Consumers**: The `queues.consumers` array binds the same queue name with reasonable settings (`max_batch_size = 10`, `max_batch_timeout = 30`).

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
