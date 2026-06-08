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
> Always run duplicate slug preflight checks (documented in [d1-migrations.md](file:///c:/Users/ranbe/Documents/Github/xhalo-blog/docs/d1-migrations.md)) before applying migrations to a database with existing data.

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

Refer to [github-app-setup.md](file:///c:/Users/ranbe/Documents/Github/xhalo-blog/docs/github-app-setup.md) to:
1. Create a GitHub App with `Contents: Read/Write`, `Pull Requests: Read/Write`, and `Metadata: Read-only` permissions.
2. Generate a Private PEM Key.
3. Install the App on your blog repository and record the Installation ID.
4. Set `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY` secrets on your API worker.

---

## 6. Remote Deployment Verification (Smoke Tests)

Use the following curl commands to verify that routes behave correctly. Replace `<api-worker-domain>` with your live Worker staging/preview URL.

### 6.1 Public Health Check
```bash
curl -i https://<api-worker-domain>/api/health
```
- **Expected response**: `200 OK` with JSON `{"ok":true,"version":"..."}`.

### 6.2 Readiness Check (Requires Admin Shared Secret)
```bash
curl -i https://<api-worker-domain>/api/readiness \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```
- **Expected response**: `200 OK` with a JSON overview of bindings connectivity.

### 6.3 Audit Logs Retrieval
```bash
curl -i https://<api-worker-domain>/api/audit-logs \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```
- **Expected response**: `200 OK` showing recent audit logs array.

### 6.4 Draft Preview (Dry-run)
```bash
curl -i -X POST https://<api-worker-domain>/api/drafts/preview \
  -H "content-type: application/json" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret" \
  --data '{"title":"Smoke Test","slug":"smoke-test","body":"This is a dry-run test post."}'
```
- **Expected response**: `200 OK` returning the built pull request metadata envelope.

### 6.5 Draft Publish (Dry-run)
```bash
curl -i -X POST https://<api-worker-domain>/api/drafts/publish \
  -H "content-type: application/json" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret" \
  --data '{"mode":"dry-run","title":"Smoke Test","slug":"smoke-test","body":"This is a dry-run publish."}'
```
- **Expected response**: `200 OK` showing publish plans without altering git files.

---

## 7. Escalation Policy to Live Writes

Only set `LIVE_WRITES_ENABLED = "true"` after:
1. All public and authenticated read-only smoke tests pass cleanly.
2. Cloudflare Access authorization is fully locked down and tested against expired JWTs.
3. Turnstile challenge verifies correctly.
4. D1 migrations are checked and confirmed stable.

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
