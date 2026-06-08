# xhalo-blog Deployment Integration Runbook

This runbook provides step-by-step instructions for deploying, configuring, and smoke-testing `xhalo-blog` in a live Cloudflare environment. It covers both the HTTP API Worker and the background Queue consumer Worker.

---

## 1. Scope

This runbook handles:
1. Cloudflare Pages configuration and deployment validation.
2. D1 Database provisioning, preflight checks, and migrations.
3. R2 Bucket provisioning and signed-upload configuration.
4. Cloudflare Queues creation and Worker bindings.
5. Zero Trust Cloudflare Access policies configuration.
6. Cloudflare Turnstile spam validation widgets.
7. Verification smoke-test commands (using dry-run paths by default).

---

## 2. Prerequisites

Before starting, ensure you have:
1. A Cloudflare account with Access (Zero Trust) and Turnstile enabled.
2. The Cloudflare CLI tool `wrangler` installed locally (`npm install -g wrangler` or run via `npx`).
3. GitHub CLI `gh` installed and authenticated (if deploying custom GitHub Apps).
4. Local monorepo checks passing cleanly (`npm run check:all`).

---

## 3. Environment Matrix

Configure the following variables and secrets. Do not commit actual production credentials to Git.

| Variable / Secret | Type | Bound Worker | Description | Default / Value |
|---|---|---|---|---|
| `LIVE_WRITES_ENABLED` | Variable | API | Gates actual database writes and PR creation | `false` (Must stay `false` during tests) |
| `ASSETS_PUBLIC_BASE_URL` | Variable | API | Public domain serving R2 assets | `https://assets.example.com` |
| `GITHUB_OWNER` | Variable | API | Owner of the target Hexo Git repository | `your-github-username` |
| `GITHUB_REPO` | Variable | API | Repository name of the Hexo blog | `hexo-blog` |
| `GITHUB_BRANCH` | Variable | API | Base branch to target for drafts | `main` |
| `ACCESS_TEAM_DOMAIN` | Variable | API | Cloudflare Access team subdomain | `your-team-subdomain` |
| `ACCESS_AUDIENCE_TAG` | Variable | API | Access Application Audience Tag | `your-access-audience-tag` |
| `TURNSTILE_SITE_KEY` | Variable | API | Turnstile public widget Key | `your-turnstile-site-key` |
| `ADMIN_API_SHARED_SECRET`| Secret | API | Secret matching `x-xhalo-admin-secret` | Generate secure UUID |
| `ASSETS_SIGNING_SECRET` | Secret | API | Signing secret used to mint upload tokens | Generate secure random string |
| `GITHUB_WEBHOOK_SECRET`  | Secret | API | Signing secret to verify GitHub webhook pushes| Generate secure random string |
| `PREVIEW_WEBHOOK_SECRET` | Secret | API | Secret verifying Cloudflare Pages webhooks | Generate secure random string |
| `TURNSTILE_SECRET_KEY`  | Secret | API | Turnstile secret private verification Key | Secret |
| `GITHUB_APP_ID` | Secret | API | ID of the registered publisher GitHub App | Secret |
| `GITHUB_INSTALLATION_ID` | Secret | API | Installation ID of the GitHub App | Secret |
| `GITHUB_APP_PRIVATE_KEY` | Secret | API | Private PEM key content for the GitHub App | Secret (Multilined PEM block) |

---

## 4. Cloudflare Resource Provisioning

### 4.1 D1 Database
Create the database:
```bash
npx wrangler d1 create xhalo-blog
```
Locate the output `database_id` and add it to `workers/api/wrangler.toml` and `workers/queue/wrangler.toml` under `[[d1_databases]]`.

Run migrations:
```bash
# Local D1 database initialization
npx wrangler d1 migrations apply xhalo-blog --local

# Remote production D1 database initialization
npx wrangler d1 migrations apply xhalo-blog --remote
```
> [!CAUTION]
> Always run duplicate slug preflight checks (documented in [d1-migrations.md](./d1-migrations.md)) before applying migrations to a database with existing data.

### 4.2 R2 Bucket
Create the assets bucket:
```bash
npx wrangler r2 bucket create xhalo-blog-assets
```
Bind the bucket under `[[r2_buckets]]` inside `workers/api/wrangler.toml`. In your Cloudflare Dashboard, configure a Public Domain or Custom Domain for this bucket and map its URL to `ASSETS_PUBLIC_BASE_URL`.

### 4.3 Task Queue
Create the tasks queue:
```bash
npx wrangler queues create xhalo-blog-tasks
```
1. Bind as **producer** in `workers/api/wrangler.toml` (`TASK_QUEUE`).
2. Bind as **consumer** in `workers/queue/wrangler.toml`.

### 4.4 HTTP API Worker
Copy `workers/api/wrangler.toml.example` to `workers/api/wrangler.toml`, edit bindings/variables, then deploy:
```bash
npm --workspace @xhalo-blog/worker-api run deploy
```

### 4.5 Queue Consumer Worker
Copy `workers/queue/wrangler.toml.example` to `workers/queue/wrangler.toml`, edit D1 binding, then deploy:
```bash
npm --workspace @xhalo-blog/queue-worker run deploy
```

### 4.6 Cloudflare Access
Create a Zero Trust Access Application protecting path `/api/*` and extract the **Audience Tag (AUD)**. Configure `ACCESS_TEAM_DOMAIN` and `ACCESS_AUDIENCE_TAG` as environment variables on your API Worker.

### 4.7 Cloudflare Turnstile
Create a Turnstile widget, copy the public Site Key to `TURNSTILE_SITE_KEY` variable, and store the private Secret Key in `TURNSTILE_SECRET_KEY` secret.

---

## 5. GitHub App Setup

Refer to [github-app-setup.md](./github-app-setup.md) to:
1. Create a GitHub App with `Contents: Read/Write`, `Pull Requests: Read/Write`, and `Metadata: Read-only` permissions.
2. Generate a Private PEM Key.
3. Install the App on your blog repository and record the Installation ID.
4. Set `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY` secrets on your API worker.

---

## 6. Remote Deployment Verification (Smoke Tests)

To verify that the deployed API Worker operates correctly, we use both automated verification scripts and manual curl queries. 

For a complete reference of all tested routes, inputs, and expected response codes, refer to the [Staging API Worker Smoke Test Matrix](./deployment-smoke-test-matrix.md).

### 6.1 Automated Smoke Testing

We provide a Node.js verification script to execute the full suite of 17 validation assertions against a running endpoint.

Run the test suite against your staging worker (ensure `LIVE_WRITES_ENABLED` is `false` or dry-run modes are selected):
```bash
# Run against staging API Worker
SMOKE_TARGET_URL=https://<api-worker-domain> \
ADMIN_API_SHARED_SECRET=your-admin-shared-secret \
SMOKE_TURNSTILE_TOKEN=dummy-token \
SMOKE_EXPECT_LIVE_WRITES=false \
npm run test:smoke
```

### 6.2 Manual Verification Examples

You can also run manual curl commands to check key endpoints:

#### Public Health Check
```bash
curl -i https://<api-worker-domain>/api/health
```
- **Expected response**: `200 OK` with JSON `{"ok":true,"service":"..."}`.

#### Readiness Check (Requires Admin Shared Secret)
```bash
curl -i https://<api-worker-domain>/api/readiness \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```
- **Expected response**: `200 OK` with a JSON overview of bindings connectivity.

#### Audit Logs Retrieval
```bash
curl -i https://<api-worker-domain>/api/audit-logs \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```
- **Expected response**: `200 OK` showing recent audit logs array.

#### Draft Preview (Dry-run)
```bash
curl -i -X POST https://<api-worker-domain>/api/drafts/preview \
  -H "content-type: application/json" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret" \
  -H "cf-turnstile-token: dummy-token" \
  --data '{"title":"Smoke Test","slug":"smoke-test","body":"This is a dry-run test post."}'
```
- **Expected response**: `200 OK` returning the built pull request metadata envelope.


---

## 7. Escalation Policy to Live Writes

Only set `LIVE_WRITES_ENABLED = "true"` after:
1. All public and authenticated read-only smoke tests pass cleanly.
2. Cloudflare Access authorization is fully locked down and tested against expired JWTs.
3. Turnstile challenge verifies correctly.
4. D1 migrations are checked and confirmed stable.

To execute a controlled verification of the live-write publish and asset upload pipeline, refer to the [Staging Live-Write Closed-Loop Verification](./live-write-verification.md) guide.

---

## 8. Rollback Plan

If a deployment fails or crashes:
1. **Worker Rollback**:
   Use Wrangler rollback command to revert to the previous stable release:
   ```bash
   npx wrangler rollback --name xhalo-blog-api
   npx wrangler rollback --name xhalo-blog-queue
   ```
2. **D1 Rollback**:
   If a migration breaks constraints, manually drop added unique indexes:
   ```sql
   DROP INDEX IF EXISTS idx_posts_index_slug;
   DROP INDEX IF EXISTS idx_posts_index_status;
   DROP INDEX IF EXISTS idx_posts_index_published_at;
   ```
