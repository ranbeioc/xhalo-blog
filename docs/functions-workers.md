# Pages Functions and Workers

Dynamic routes should stay isolated from the public static site.

Current scaffold entry:

```text
workers/api/src/index.js
```

Current queue binding:

```text
TASK_QUEUE
```

## Public routes

```text
GET /api/health
GET /api/scaffold
POST /webhooks/github
POST /webhooks/deployments/preview
```

## Protected admin-facing routes

These routes require `ADMIN_API_SHARED_SECRET` and the `x-xhalo-admin-secret` header:

```text
GET /api/readiness
GET /api/posts
GET /api/tasks
POST /api/tasks/example
GET /api/drafts/template
POST /api/drafts/preview
POST /api/drafts/tasks
POST /api/drafts/github-plan
POST /api/drafts/publish
GET /api/assets/r2-template
POST /api/assets/r2-preview
POST /api/assets/r2-signed-upload
PUT /api/assets/r2-upload/:token
POST /api/assets/r2-upload
POST /api/assets/r2-tasks
GET /api/publish/notifications/template
POST /api/publish/notifications/preview
POST /api/publish/notifications/tasks
GET /api/moderation/template
POST /api/moderation/preview
POST /api/moderation/tasks
```

This request secret is a prototype-grade inner gate. It does not replace Cloudflare Access. The admin scaffold now stores the secret in session scope and only enables protected actions after it is provided.

## Live write gate

These live write paths are disabled unless `LIVE_WRITES_ENABLED=true`:

- `POST /api/drafts/publish`
- `POST /api/assets/r2-signed-upload`
- `PUT /api/assets/r2-upload/:token`
- `POST /api/assets/r2-upload`

Dry-run behavior remains available when the admin secret is configured.

## Current prototype behavior

- `GET /api/readiness` summarizes whether the current worker environment looks ready for GitHub PR publishing, R2 assets, queue tasks, Turnstile, and Access-adjacent checks
- `GET /api/posts` reads from `posts_index` when D1 is bound, otherwise falls back to example rows
- `GET /api/tasks` reads from `tasks` when D1 is bound, otherwise falls back to example rows
- `POST /api/drafts/publish` supports `dry-run` and a prototype `live` path; the live path prefers GitHub App env, falls back to `GITHUB_TOKEN`, and opens a PR without writing directly to `main`
- `POST /api/assets/r2-signed-upload` supports `dry-run` and a prototype `live` path that issues a short-lived signed worker upload URL
- `PUT /api/assets/r2-upload/:token` validates the HMAC token and expiry, expects the admin request secret header, then writes uploaded bytes to R2
- `POST /api/assets/r2-upload` supports `dry-run` and a bounded prototype `live` path that writes one object to R2
- `POST /webhooks/github` verifies `x-hub-signature-256` with `GITHUB_WEBHOOK_SECRET`
- `POST /webhooks/deployments/preview` verifies `x-preview-webhook-secret` with `PREVIEW_WEBHOOK_SECRET`
- `workers/queue` now writes minimal retry metadata and `last_error` back into task reconciliation payloads for failed jobs

## Recommended dynamic paths

```text
/api/*
/admin/*
/webhooks/*
```

Keep the public blog render path static first. Do not treat this scaffold as a production admin API yet.
