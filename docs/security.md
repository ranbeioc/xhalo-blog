# Security

## Defaults

- Keep the public static site open.
- Protect admin routes with Cloudflare Access.
- Use Turnstile for public write actions.
- Rate-limit API paths.
- Store secrets in environment variables.

These defaults are enough for the Stage 2.5 scaffold. Do not treat this repository as a full production security implementation yet.

## Suggested protected paths

```text
/admin/*
/api/admin/*
/api/webhook/*
/bot/*
```

## Suggested public paths

Keep these public in early versions:

```text
/
/archives/*
/categories/*
/tags/*
/search.xml
/sitemap.xml
```

The static site should stay readable without authentication.

## Secrets and config

Never commit:

- Cloudflare API tokens
- Cloudflare account IDs that are not placeholders
- GitHub app private keys
- production analytics IDs
- real comment service endpoints
- any production `.env` file

Use:

- `.env.example` for placeholders
- `wrangler.toml.example` for placeholder resource wiring
- environment variables in Cloudflare and GitHub for real values

## Common WAF targets

Block or challenge probes for WordPress, `.env`, PHP test files, and server-status paths when they are irrelevant to your deployment.

## Minimal Stage 2.5 checklist

- Protect `/admin/*` with Access before exposing an admin UI.
- Put Turnstile in front of public write actions before enabling comments, forms, or webhook-style submissions.
- Keep moderation actions behind protected routes and do not wire them to a real comment provider until rate limits and audit records are in place.
- Apply rate limits to dynamic worker routes before exposing write endpoints.
- Keep preview deployments on `*.pages.dev` and let them stay `noindex`.
- Review `_headers` and cache behavior before attaching a production domain.
