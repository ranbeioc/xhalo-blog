# Cloudflare Setup Guide

This guide walks you through provisioning, configuring, and deploying the Cloudflare services required to run the `xhalo-blog` CMS platform in production.

---

## 1. Cloudflare Pages (Static Site Deployment)

Cloudflare Pages hosts the compiled Hexo site (HTML/JS/CSS).

For the current `xhalo-blog-test` full test site, use these Pages settings:

| Setting | Value |
| --- | --- |
| Project | `xhalo-blog-test` |
| GitHub source | `ranbeioc/xhalo-blog` |
| Build command | `npm run build:test-pages` |
| Build output directory | `dist/pages` |
| Branch | PR preview branch, then `main` after merge |

The generated Pages `_worker.js` proxies `/api/*` and `/auth/*` to the staging API configured through `XHALO_ADMIN_API_BASE_URL`. It does not add a deployment step to CI.

1. Go to the Cloudflare Dashboard → **Workers & Pages** → **Pages** → **Create a project**.
2. Connect your Git repository.
3. Select your project directory and set the build settings:
   - **Framework preset**: `None`
   - **Root directory**: `examples/next-theme-blog` (or your customized blog workspace)
   - **Build command**: `npm run build`
   - **Build output directory**: `public`
4. In **Settings** → **Environment variables**, add:
   - `NODE_VERSION`: `20` (or greater)
5. Save and deploy.

---

## 2. Cloudflare D1 Database (Article Store)

D1 stores post index data, tasks, and audit logs.

### 2.1 Creation
Run wrangler command to create the database:
```bash
wrangler d1 create xhalo-blog
```
This will output the `database_id`. Save it for your Wrangler configuration.

### 2.2 Local & Remote Migration
Apply D1 migrations to set up tables:
```bash
# Apply to local development database
wrangler d1 migrations apply xhalo-blog --local

# Apply to remote production database
wrangler d1 migrations apply xhalo-blog --remote
```

> [!IMPORTANT]
> **Non-destructive Migration Policy**: Forward migrations must never contain destructive commands such as `DROP TABLE` or `DROP COLUMN` on existing tables. Rollback scripts must only be kept as reference documentation.
> Before running migrations in production, always perform a database backup:
> ```bash
> wrangler d1 export xhalo-blog --remote --output backup.sql
> ```
> Refer to [d1-local-remote-verification.md](./d1-local-remote-verification.md) for detailed preflight check procedures.

---

## 3. Cloudflare R2 Bucket (Media Storage)

R2 stores uploaded images, files, and assets.

In Phase 097, R2 remains an asset/media layer only. Pages serves blog HTML, `/admin`, and normal static assets. Do not configure R2 as whole-site hosting for `xhalo-blog-test`.

1. Go to **Workers & Pages** → **R2** → **Create bucket**.
2. Name it `xhalo-blog-assets` (or a name of your choice).
3. In bucket **Settings**, configure a **Public Domain** (e.g. `assets.yourdomain.com`) or enable the Cloudflare-managed subdomain.
4. Save the public URL domain. You will set this as `ASSETS_PUBLIC_BASE_URL` in the API Worker environment variables.

---

## 4. Cloudflare Queues (Asynchronous Task Queue)

Queues manage background tasks, such as publishing pipelines and asset processing.

1. Create the Queue via Wrangler:
   ```bash
   wrangler queues create xhalo-blog-tasks
   ```
2. This queue is bound as a **producer** in the API Worker (`TASK_QUEUE`) and as a **consumer** in the Queue Worker.

---

## 5. Deploying the Workers

`xhalo-blog` separates HTTP operations and queue consumption into two decoupled workers:

### 5.1 HTTP API Worker (`workers/api`)
1. Copy `workers/api/wrangler.toml.example` to `workers/api/wrangler.toml`.
2. Update the `database_id` under `[[d1_databases]]` with your D1 database ID.
3. Update `bucket_name` under `[[r2_buckets]]` and `queue` name under `[[queues.producers]]`.
4. Deploy the worker:
   ```bash
   npm --workspace @xhalo-blog/worker-api run deploy
   ```

### 5.2 Queue Worker (`workers/queue`)
1. Copy `workers/queue/wrangler.toml.example` to `workers/queue/wrangler.toml`.
2. Update the `database_id` under `[[d1_databases]]` and the consumer `queue` name.
3. Deploy the worker:
   ```bash
   npm --workspace @xhalo-blog/queue-worker run deploy
   ```

---

## 6. Cloudflare Access (Admin Authentication)

Cloudflare Access secures `/api/*` and `/admin/*` routes. Protected endpoints include `/api/readiness`, `/api/posts`, `/api/tasks`, and `/api/audit-logs`.

1. Go to your Cloudflare Zero Trust dashboard.
2. Go to **Access** → **Applications** → **Add an Application** → **Self-hosted**.
3. Configure Application Settings:
   - **Application name**: `xhalo-blog`
   - **Domain**: `yourdomain.com/api` (and `/admin` path of your domain)
4. Create an authentication policy (e.g., allow specific emails or identity providers).
5. Obtain your **Access Audience Tag (AUD)** from the application settings.
6. Configure the Worker environment variables:
   - `ACCESS_TEAM_DOMAIN`: `your-team-subdomain` (from Zero Trust settings)
   - `ACCESS_AUDIENCE_TAG`: The AUD tag obtained above.

---

## 7. Cloudflare Turnstile (Spam Prevention)

Turnstile protects publish and upload forms from automated abuse.

1. Go to **Turnstile** → **Add site**.
2. Set Site Name and Domain, and select **Widget Type** (e.g., Managed or Non-interactive).
3. Retrieve your **Site Key** and **Secret Key**.
4. Configure keys:
   - Set `TURNSTILE_SITE_KEY` variable in the worker configuration.
   - Set `TURNSTILE_SECRET_KEY` secret in the worker secrets environment.

---

## 8. Environmental Secrets Configuration

Once services are deployed, set the production secrets on your deployed Workers.

### 8.1 API Worker Secrets
Run these commands to write secrets securely (do not check these into git):
```bash
# Shared secret for direct API checks (inner gate)
wrangler secret put ADMIN_API_SHARED_SECRET --name xhalo-blog-api

# Secret key used to sign R2 upload tokens
wrangler secret put ASSETS_SIGNING_SECRET --name xhalo-blog-api

# Webhook secret to verify incoming GitHub pushes
wrangler secret put GITHUB_WEBHOOK_SECRET --name xhalo-blog-api

# Webhook secret to verify incoming Pages deployment notifications
wrangler secret put PREVIEW_WEBHOOK_SECRET --name xhalo-blog-api

# Secret key for Turnstile siteverify verification
wrangler secret put TURNSTILE_SECRET_KEY --name xhalo-blog-api
```

For setting up the GitHub App credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` PEM, etc.), refer to [github-app-setup.md](./github-app-setup.md).

---

## 9. Deployment Verification (Smoke Testing)

To verify the correct configuration of all Cloudflare bindings, secrets, and routes, run the automated smoke testing script against your staging or production endpoint:

```bash
# Run the 17-point route verification suite
SMOKE_TARGET_URL="https://your-account.workers.dev" \
ADMIN_API_SHARED_SECRET="your-admin-shared-secret" \
npm run test:smoke
```

See [deployment-smoke-test-matrix.md](./deployment-smoke-test-matrix.md) for details on the 17-point test matrix, which verifies public, protected, mutation (dry-run), rejection, and security boundaries.
