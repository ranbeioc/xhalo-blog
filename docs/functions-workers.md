# Pages Functions and Workers

Dynamic routes should be isolated from the public static site.

Current scaffold entry:

```text
workers/api/src/index.js
```

Current queue binding used by the API example:

```text
TASK_QUEUE
```

Current read-only scaffold routes:

```text
GET /api/health
GET /api/scaffold
GET /api/posts
GET /api/tasks
GET /api/drafts/template
POST /api/drafts/preview
POST /api/drafts/tasks
POST /api/drafts/github-plan
GET /api/assets/r2-template
POST /api/assets/r2-preview
POST /api/assets/r2-tasks
GET /api/publish/notifications/template
POST /api/publish/notifications/preview
POST /api/publish/notifications/tasks
GET /api/moderation/template
POST /api/moderation/preview
POST /api/moderation/tasks
POST /api/tasks/example
```

The admin scaffold can read `GET /api/health` and `GET /api/scaffold` when it is deployed on the same origin as the placeholder API. If those routes are not reachable, it falls back to static scaffold defaults.

Stage 3 prototype additions:

- `GET /api/posts` reads from `posts_index` when D1 is bound, otherwise falls back to example rows
- `GET /api/tasks` reads from `tasks` when D1 is bound, otherwise falls back to example rows
- `GET /api/drafts/template` exposes the current draft metadata contract and branch/file defaults
- `POST /api/drafts/preview` returns a normalized draft payload, file path, branch name, and PR preview without creating anything remotely
- `POST /api/drafts/tasks` queues a dry-run draft task and returns the preview plus task metadata without creating anything remotely
- `POST /api/drafts/github-plan` returns the ordered GitHub operations plan for the current draft without creating anything remotely
- `GET /api/assets/r2-template` exposes the current R2 upload contract for bucket binding, key prefix, and public URL shape
- `POST /api/assets/r2-preview` returns the derived bucket/key/url tuple for a future upload without writing anything remotely
- `POST /api/assets/r2-tasks` queues a dry-run upload task and returns the preview plus task metadata without writing anything remotely
- `GET /api/publish/notifications/template` exposes the current publish notification contract for queue binding and delivery channels
- `POST /api/publish/notifications/preview` returns the derived notification title, message, and delivery target without sending anything remotely
- `POST /api/publish/notifications/tasks` queues a dry-run publish notification task and returns the preview plus task metadata without sending anything remotely
- `GET /api/moderation/template` exposes the current moderation contract for provider, action, and queue binding
- `POST /api/moderation/preview` returns the derived moderation title, action, and review message without updating anything remotely
- `POST /api/moderation/tasks` queues a dry-run moderation task and returns the preview plus task metadata without updating anything remotely
- `POST /api/tasks/example` now persists a queued task record when D1 is available before the queue consumer handles it
- `apps/admin` now includes a dry-run draft form that can preview draft metadata, queue a dry-run task, and render the future GitHub operation plan in the browser

Recommended dynamic paths:

```text
/api/*
/admin/*
/webhooks/*
/bot/*
```

Do not intercept all HTML routes in early versions.

## Suggested responsibility split

- Cloudflare Pages:
  - public static HTML
  - CSS, JS, images, feeds, and search files
- Worker API:
  - admin-facing write endpoints
  - webhook handlers
  - background task coordination
  - optional authenticated internal APIs

## Early routing rule

Keep the public blog render path static first. Add dynamic routes only under explicit prefixes such as `/api/*` and `/admin/*`.

## Stage 2.5 boundary

The current repository includes placeholder worker structure and route boundaries. It does not yet provide a production-grade admin API or full request validation pipeline.
