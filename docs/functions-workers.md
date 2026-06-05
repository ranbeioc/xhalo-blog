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
POST /api/tasks/example
```

The admin scaffold can read `GET /api/health` and `GET /api/scaffold` when it is deployed on the same origin as the placeholder API. If those routes are not reachable, it falls back to static scaffold defaults.

Stage 3 prototype additions:

- `GET /api/posts` reads from `posts_index` when D1 is bound, otherwise falls back to example rows
- `GET /api/tasks` reads from `tasks` when D1 is bound, otherwise falls back to example rows
- `GET /api/drafts/template` exposes the current draft metadata contract and branch/file defaults
- `POST /api/drafts/preview` returns a normalized draft payload, file path, branch name, and PR preview without creating anything remotely
- `POST /api/tasks/example` now persists a queued task record when D1 is available before the queue consumer handles it

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
