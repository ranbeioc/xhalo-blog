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

Recommended dynamic paths:

```text
/api/*
/admin/*
/webhooks/*
/bot/*
```

Do not intercept all HTML routes in early versions.
