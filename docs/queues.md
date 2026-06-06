# Queues

Current scaffold queue name:

```text
xhalo-blog-tasks
```

Current producer / consumer binding:

```text
TASK_QUEUE
```

Queues are for async, retryable work:

- Social sync
- Notifications
- AI summaries
- SEO metadata generation
- Comment moderation assistance
- Build status polling

Every task should have an idempotency key and retry limit.

## Good queue jobs

Use the queue for work that is:

- not needed to finish the current HTTP response
- retryable
- safe to run more than once with an idempotency key
- traceable in D1 task records

## Poor queue jobs

Avoid using the queue for:

- direct public page rendering
- synchronous preview generation inside the request path
- one-off tasks that have no retry story
- canonical Git state changes without audit metadata

## Suggested task fields

At minimum, track:

- task id
- task type
- idempotency key
- enqueue time
- retry count
- status
- related post slug or resource id

## Stage 2.5 boundary

The scaffold still does not implement the full worker pipeline for these task types, but it now performs minimal D1-backed reconciliation for known preview jobs.

Current placeholder consumer behavior:

- wraps messages into a normalized scaffold envelope
- updates known D1 task rows from `queued` to `processing` to `completed`
- logs known example tasks
- logs known draft preview, R2 upload preview, publish notification preview, and moderation preview tasks
- stores a small reconciliation summary inside the task payload for later inspection
- stores minimal `retry_count` and `last_error` metadata inside reconciliation payloads
- warns on unknown task types
- acknowledges the message to avoid retry loops in the bare scaffold
