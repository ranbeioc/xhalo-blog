# Stage 4 Production Hardening Roadmap

This document outlines the transition path of `xhalo-blog` from a Stage 3 prototype scaffold to a Stage 4 production-ready framework. In alignment with our strict hardening policy, this roadmap focuses exclusively on **security, stability, verification, and monitoring** of existing features. **No new features are proposed.**

---

## 1. Production Readiness Assessment

The current capabilities implemented in Stage 3.5 have been audited for security and correctness. Below is their production readiness status:

| Feature Area | Current Status (Stage 3.5) | Production Readiness Gap | Action Required |
|---|---|---|---|
| **Cloudflare Access JWT Gate** | **Production Ready** (RS256, mandatory `exp`/`iss`/`kid` checks, aud array support) | None | Keep configuration-driven and maintain JWKS cache. |
| **Turnstile Protection** | **Beta** (Token validation on POST/PUT mutation routes) | Lacks rate-limiting on validation endpoints (brute-force threat). | Add Turnstile-specific IP rate-limiting to prevent validation spam. |
| **D1 Article Store** | **Beta** (Supports full markdown bodies in D1 SQLite) | Missing schema constraints, index optimization, and content validation. | Add schema validation (slug structure, date formats, length limits). |
| **Admin Markdown Preview** | **Alpha / Limited** (Custom subset via `renderSafeMarkdown()`) | Secure, but lacks nesting support and standard GFM syntax support. | Transition to a pinned server-safe Markdown parser paired with DOMPurify, or keep the secure subset. |
| **R2 Asset Manager** | **Alpha** (Unsecured placeholder upload logic) | Missing path sanitation, file size constraints, and MIME type allowlists. | Add strict file size limits, name sanitization, and content-type verification. |
| **GitHub App Publisher** | **Beta** (Triggering PR publishing) | Signature validation needs to be robust under high load; lack of retries. | Add payload validation checks and retry queue mechanism. |

---

## 2. Stabilization Path for Prototypes

Instead of adding new features, the focus of Stage 4 is the stabilization and optimization of existing prototype-grade integrations.

### A. D1 Database Optimization & Schema Constraints
* **Indexing**: Ensure `posts_index` has active indexes on `slug`, `status`, and `published_at` for high-performance retrieval.
* **Constraints**: Mandate `UNIQUE` constraint on `slug` to prevent duplicate routes.
* **Schema Validation**: Validate front-matter fields (such as checking that `date` is a valid ISO string and `title` is not empty) in the API layer before committing writes to D1.

### B. Admin Panel Markdown Parser Upgrade
To support full GFM (GitHub Flavored Markdown) formatting safely without security compromise:
* Implement an offline-build bundler for the admin panel to compile dependencies instead of loading raw scripts.
* Include **DOMPurify** paired with **marked** in the admin client bundle to support rich formatting while strictly blocking XSS.
* Keep the CDN dependency path completely disabled (avoid external resource imports).

### C. R2 Assets Upload Stabilization
* **Size Restrictions**: Restrict file uploads to a maximum of 10MB (configurable).
* **MIME-Type Allowlist**: Allow only safe file types (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`, `video/mp4`).
* **Path Sanitation**: Automatically sanitize file names to prevent directory traversal attacks (e.g. converting `../../malicious.js` -> `malicious.js`).

---

## 3. CI/CD Pipeline & Deployment Validation

To prevent broken builds or misconfigurations from reaching production, the CI/CD pipeline needs enhancement:

### A. Wrangler Configuration Validation
* Add a CI step (`npx wrangler types` or configuration linting) to verify that local `wrangler.toml` conforms to the required Cloudflare bindings (D1, R2, Queues) before PR merges.
* Validate environment variable placeholders in `wrangler.toml.example`.

### B. Cloudflare Pages Preview Deployments
* Configure GitHub Actions to automatically run `npm run check` on Pages preview deployment hooks.
* Incorporate build output footprint validation (verifying that the total generated asset bundle does not exceed Cloudflare limits).

### C. Worker Size & Compatibility Verification
* Implement a pre-commit check verifying that the compiled Worker size is within the free-tier limit (3MB) to prevent deployment failures.

---

## 4. Monitoring, Logging, and Observability

A production environment requires clear observability of errors, latency, and security threats.

### A. Structured Worker Logs
* Format all Worker console output as structured JSON objects:
  ```json
  {
    "timestamp": "2026-06-07T13:19:00Z",
    "level": "INFO",
    "route": "/api/drafts/publish",
    "method": "POST",
    "status": 200,
    "latency_ms": 42,
    "user_agent": "Mozilla/5.0...",
    "client_ip": "1.1.1.1",
    "access_aud": "aud-tag-example"
  }
  ```
* Capture Turnstile validation performance and record failure counts.

### B. Alerting and Error Tracking
* Set up error boundary middleware in `workers/api/src/index.js` to catch unhandled exceptions, returning a generic `500 Internal Server Error` to the client while logging the full traceback.
* Establish alert triggers for unexpected error spikes (e.g., if `/api/posts` returns `500` multiple times within 1 minute).

### C. Audit Trails for Admin Actions
* Log every state mutation (creating, editing, publishing, deleting posts) with the identity parsed from the Cloudflare Access JWT.
* Write audit logs to a dedicated D1 table `audit_logs` or send them to a Cloudflare Logpush destination.
