# Stage 4 Hardening Roadmap after Phase A and D1 Validation Hardening

This document outlines the transition path of `xhalo-blog` from a Stage 3 prototype scaffold to a Stage 4 production-ready framework. In alignment with our strict hardening policy, this roadmap focuses exclusively on **security, stability, verification, and monitoring** of existing features. **No new features are proposed.**

---

## 1. Status of Completed Hardening Tasks

Below is the status of capabilities audited, hardened, and merged during Phase A and Stage 4 D1 Constraints Hardening:

| Feature Area | Hardening Status | Changes Implemented |
|---|---|---|
| **Cloudflare Access JWT Gate** | **Production Ready** | RS256 algorithm enforcement, mandatory `exp`/`iss`/`kid` checks, aud array support. |
| **Turnstile Protection** | **Production Ready** | Token validation on protected mutation routes, iframe challenge widget integrated in Admin Panel. |
| **D1 Article Store & Validation** | **Production Ready** | Created `0003_harden_posts_index_constraints.sql` with unique slug index and performance lookup indexes. Implemented strict type, size (body <= 200 KiB), and constraint checks in `validatePublishInput`. |
| **Admin Markdown Preview** | **Production Ready** | Safe rendering subset (`renderSafeMarkdown()`) implemented. Marked CDN script tag removed. Stored XSS threat eliminated. |
| **D1 Migration Safety** | **Production Ready** | Documented duplicate slug preflight checks and rollback queries in `docs/d1-migrations.md`. Added automated readiness checks script. |
| **Reproducible Build CI** | **Production Ready** | Switched pipeline to `npm ci` and added lockfile tracking in git. |

---

## 2. Roadmap for Stage 4 Hardening

Following the completion of the baseline hardening tasks, the next stages will focus on deployment verification and runtime stability.

### Stage 4-A: Cloudflare Deployment Verification
Transition the framework from a locally tested scaffold to a verified Cloudflare-deployed instance.
* **Wrangler Configuration Audit**: Verify environment variables, bindings (D1, R2, Queues), compatibility dates, and entrypoints.
* **D1 Migration Path Verification**: Validate D1 migration execution flow on both local and remote Cloudflare D1 instances. Document database backup and recovery guidelines.
* **Worker Smoke Tests**: Create guidelines and scripts for verifying API health, readiness checks under authentication, and validation responses.
* **Admin UI Integration**: Verify Admin secret gates, Turnstile challenge rendering, and dynamic editing functionality in a real deployment environment.
* **Cloudflare Access Setup**: Document Access Team domain settings, Audience tags registration, and local testing bypass flags.

### Stage 4-B: R2 Asset Upload Hardening
Secure the R2 media upload path against malicious payloads and unauthorized writes.
* **Filename Sanitation**: Strip path traversal sequences (e.g. `../../` or `..\`) and normalize filenames to prevent directory escapes.
* **MIME-Type Allowlist**: Allow only safe media types (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`, `video/mp4`, `video/webm`, `text/plain`).
* **Content-Type Validation**: Reject upload requests if the content header mismatches the actual binary content. Enforce upload size limits (e.g. <= 10 MiB).
* **Token TTL Verification**: Enforce time-to-live and signature checks for signed R2 upload paths.

### Stage 4-C: GitHub Publish Workflow Hardening
Ensure the GitHub publishing integration is robust, idempotent, and handle failures gracefully.
* **Idempotency checks**: Detect if a publishing branch or PR already exists on GitHub and return the existing details rather than crashing or creating duplicates.
* **API Failure Isolation**: Return structured JSON error payloads (such as `409 Conflict` on git tree collision or `401 Unauthorized` on missing tokens) instead of generic `500 Internal Server Error` responses.
* **Preview Deployment Hook Hooking**: Set up task tracking so that when a Pages preview build finishes, the preview URL is automatically written back to the D1 `posts_index` table.

### Stage 4-D: Audit Logging & Observability
Establish operational visibility and security monitoring for the CMS platform.
* **Audit Trails**: Log every state-mutating operation (create, edit, publish, delete) with the actor identity extracted from the Cloudflare Access JWT. Persist logs in the D1 `audit_logs` table.
* **Structured Logs**: Format worker logs as JSON objects capturing endpoints, methods, HTTP status codes, latency, Turnstile validation rates, and client request context.
* **Worker Error Boundary**: Implement top-level try/catch middleware to capture unhandled exceptions, return safe HTTP 500 error envelopes to the client, and log detailed error tracebacks.
