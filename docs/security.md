# Security

## Defaults

- Keep the public static site open.
- Protect admin routes with Cloudflare Access.
- Use Turnstile for public write actions.
- Rate-limit API paths.
- Store secrets in environment variables.

## Suggested protected paths

```text
/admin/*
/api/admin/*
/api/webhook/*
/bot/*
```

## Common WAF targets

Block or challenge probes for WordPress, `.env`, PHP test files, and server-status paths when they are irrelevant to your deployment.
