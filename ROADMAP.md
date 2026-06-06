# Roadmap

## 0.1.x alpha

Current implementation line:

- open-source scaffold for Cloudflare-native Hexo publishing
- Hexo + NexT example and reusable template
- Worker API, queue worker, and admin scaffold
- prototype GitHub publishing, R2 upload, webhook reconciliation, and execution views
- Stage 3.1 hardening for security boundaries, tests, compatibility notes, and release governance
- Stage 3.2 admin UX hardening for protected-route operation and safer scaffold controls
- Stage 3.3 provider hardening for readiness, live-write gating, and operator visibility
- Stage 3.4 theme and plugin compatibility expansion for the `hexo-next` path

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
