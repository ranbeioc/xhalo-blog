# Pages Functions and Workers

Dynamic routes should be isolated from the public static site.

Recommended dynamic paths:

```text
/api/*
/admin/*
/webhooks/*
/bot/*
```

Do not intercept all HTML routes in early versions.
