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
