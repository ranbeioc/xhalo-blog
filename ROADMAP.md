# Roadmap

## v0.1.0-alpha (Stage 4 Release Candidate)

Current implementation line:

- Open-source scaffold for Cloudflare-native Hexo publishing.
- Hexo + NexT example and reusable template with compatibility adapters.
- Decoupled API and Queue Worker runtime architecture.
- Turnstile verification and Zero Trust Cloudflare Access JWT validation.
- Hardened D1 Database schema, performance indexing, and unique slug validation.
- R2 asset upload pipeline with filename sanitation, MIME allowlist, and TTL/HMAC signed URLs.
- GitHub App integration for async publishing with PR idempotency and conflict mapping.
- Observability suite including structured JSON logs, uncaught error boundaries, and D1 audit logs.
- 17-point automated deployment smoke-test suite and validation runbooks.

## Contract v1

Contract v1 means:

- config file names and top-level sections are documented
- default Worker entry and Cloudflare binding names are documented
- template layout is intended to remain stable where practical

Contract v1 does not mean:

- production-ready admin API
- production-ready provider integrations
- complete auth and abuse protection
- stable runtime API semantics

## Future target: v1.0.0

`v1.0.0` remains a future goal, not the current release line.

Target requirements include:

- hardened live-write auth and abuse controls
- provider integrations that have moved beyond prototype-grade behavior
- broader route-level and integration test coverage
- clearer operator runbooks for deployment, rollback, and incident handling

## Current release line

`0.1.x alpha` is the current implementation line.
