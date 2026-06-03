# Security Policy

`xhalo-blog` is an early-stage scaffold. Treat all production deployments as self-managed.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x alpha | Best-effort only |

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
