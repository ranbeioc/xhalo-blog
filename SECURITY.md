# Security Policy

`xhalo-blog` now has a stable public scaffold contract, but production deployments are still self-managed. Treat every provider integration beyond the published baseline docs as requiring operator review.

## Supported versions

| Version | Supported |
|---|---|
| 1.x stable scaffold contract | Supported baseline docs and examples |
| pre-1.0 alpha snapshots | Best-effort only |

## Reporting a vulnerability

Please report sensitive issues privately to the project maintainer once a public security contact is published. Until then, avoid sharing exploit details in public issues.

## Secret handling rules

Never commit:

- Cloudflare API tokens
- Cloudflare account IDs
- Cloudflare zone IDs
- GitHub personal access tokens
- OAuth client secrets
- Private keys
- Real analytics IDs
- Real comment service secrets
- Real production database credentials

Use `.env.example` and platform environment variables instead.

## Default settings review

The current stable defaults are intentionally conservative:

- comments are disabled by default
- analytics IDs are blank by default
- Turnstile and Access toggles default to `false`
- GitHub publish flows default to PR-based writes instead of direct `main` updates
- Cloudflare resource IDs are placeholders only

Review required before production use:

- replace every placeholder secret
- verify webhook secrets before exposing webhook endpoints
- verify Access policy rules in Cloudflare dashboard
- review R2 URL strategy before publishing user-uploaded assets
- review queue retry and failure handling if the scaffold is extended beyond the current prototype behavior
