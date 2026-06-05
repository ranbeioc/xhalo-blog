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

The scaffold only defines the queue name and the intended job classes. It does not yet implement the full worker pipeline for these task types.

Current placeholder consumer behavior:

- wraps messages into a normalized scaffold envelope
- logs known example tasks
- logs known draft preview, R2 upload preview, publish notification preview, and moderation preview tasks
- warns on unknown task types
- acknowledges the message to avoid retry loops in the bare scaffold
