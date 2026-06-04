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
POST /api/tasks/example
```

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
