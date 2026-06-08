# Release Versioning Policy

This document defines the semantic versioning scheme, maturity target levels, and stability properties for the `xhalo-blog` project.

---

## 1. Version Semantics

We use semantic versioning (`vMajor.Minor.Patch-Maturity`) with defined expectations:

| Version Segment | Meaning | Stability Guarantee |
|---|---|---|
| **0.1.x-alpha** | **Initial Stage 4 Release Candidate**. Core API endpoints, D1 schemas, R2 uploads, Access/Turnstile validation, and smoke tests are complete. Async Queue Worker publish is in scaffold/staging status. | **No stability guarantee**. APIs, routing structure, and schemas may change. |
| **0.2.x-beta** | **Async Queue Hardening**. Full async queue-based publishing implemented in the Queue Worker with error recovery and retry policies. | **Partial API stability**. Config file schema is locked. |
| **0.3.x-beta** | **Deployment UX & Admin Hardening**. Complete template/CLI scaffolding and stable admin panel operations. | **API and DB schema stability**. Migrations will be fully backwards-compatible. |
| **1.0.0** | **Production-Ready Release**. Deployed, tested, and vetted across multiple production installations. | **Full stability guarantees**. Standard semantic versioning deprecation policies apply. |

---

## 2. Release Maturity Targets

### v0.1.0-alpha

The current release line (`v0.1.0-alpha.0`) is a **GitHub source release candidate**.

#### Suitable for:
- Local evaluation, profiling, and developer preview.
- Staging environment deployment and connectivity verification.
- Cloudflare platform integration validation.
- Doc and checklist review.

#### Not yet suitable for:
- Direct, unmanaged production deployment.
- Unprotected public write endpoints.
- Auto-merge publishing workflows without manual review.
- Consumption as npm library packages (workspaces are marked as `"private": true`).

---

## 3. Release Lifecycle

1. **Pre-Release (Release Candidates)**: Tagged as `-alpha.X` or `-beta.X`. Deployed strictly to staging environments and validated via the 17-point smoke test matrix.
2. **Sanity Verification**: Validation of non-destructive migrations, security defaults check, and zero-local-path documentation scan.
3. **Tagging and Release**: Pushed as Git tags and published on the GitHub release page.
