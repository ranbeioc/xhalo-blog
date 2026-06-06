# Security Policy

`xhalo-blog` is still a `0.1.x alpha` runtime with prototype-grade provider integrations. Treat `Contract v1` as a documentation and scaffold baseline, not as proof of production runtime stability.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x alpha | Best-effort security fixes for scaffold and prototype code |
| Contract v1 docs | Supported as documentation baseline only |

## Reporting a vulnerability

Please report sensitive issues privately to the project maintainer once a public security contact is published. Until then, avoid sharing exploit details in public issues.

## Secret handling rules

Never commit:

- Cloudflare API tokens
- Cloudflare account IDs
- Cloudflare zone IDs
- GitHub personal access tokens
- OAuth client secrets
- private keys
- real analytics IDs
- real comment service secrets
- real production database credentials

Use `.env.example` and platform environment variables instead.

## Default settings review

The current defaults are intentionally conservative:

- comments are disabled by default
- analytics IDs are blank by default
- Turnstile and Access toggles default to `false`
- live write routes stay disabled unless `LIVE_WRITES_ENABLED=true`
- admin-facing routes require `ADMIN_API_SHARED_SECRET` when deployed
- GitHub publish flows default to PR-based writes instead of direct `main` updates
- Cloudflare resource IDs are placeholders only

Live write APIs must remain disabled or protected by Access plus application-level request verification before deployment.

Review required before production use:

- replace every placeholder secret
- verify `ADMIN_API_SHARED_SECRET` distribution and rotation
- verify webhook secrets before exposing webhook endpoints
- verify Access policy rules in the Cloudflare dashboard
- review R2 URL strategy before publishing user-uploaded assets
- review queue retry and failure handling if the scaffold is extended beyond the current prototype behavior
