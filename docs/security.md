# Security

## Defaults

- keep the public static site open
- protect admin routes with Cloudflare Access
- require `ADMIN_API_SHARED_SECRET` for admin-facing API routes
- keep `LIVE_WRITES_ENABLED` blank or `false` by default
- use Turnstile for public write actions
- rate-limit API paths
- store secrets in environment variables

This is still a Stage 3 prototype repository. Do not treat these controls as a full production security implementation.

## Protected paths

Protect these before exposing live admin behavior:

```text
/admin/*
/api/readiness
/api/posts
/api/tasks
/api/drafts/*
/api/assets/*
/api/publish/*
/api/moderation/*
```

Webhook routes should keep their own signature-based verification:

```text
/webhooks/github
/webhooks/deployments/preview
```

## Public paths

Keep these public in early versions:

```text
/
/archives/*
/categories/*
/tags/*
/search.xml
/sitemap.xml
```

## Live writes

Live write APIs must remain disabled or protected by Access plus application-level request verification before deployment.

Set `LIVE_WRITES_ENABLED=true` only after:

- Access policy review
- request secret verification
- route-level tests
- rate limiting
- operator review

## Secrets and config

Never commit:

- Cloudflare API tokens
- non-placeholder Cloudflare account IDs
- GitHub App private keys
- production analytics IDs
- real comment service endpoints
- any production `.env` file

Use:

- `.env.example` for placeholders
- `wrangler.toml.example` for placeholder resource wiring
- environment variables in Cloudflare and GitHub for real values
