# Admin Auth, Media, and Menu Production Release Candidate Review

This document provides the security, architecture, and deployment readiness review for the **Admin OAuth, Media dry-run, and Site Menu Preview** modules (Phase 085 Production Release Candidate).

---

## 1. Executive Summary

* **Verdict**: **APPROVED FOR RELEASE CANDIDATE (v0.1.0-alpha.1)**
* **Baseline Security**: Outer Cloudflare Access (JWT verification) + Fallback Admin API Shared Secret verification.
* **Scope Limits**: Media upload stays strictly **dry-run** (no R2 writes). Site Menu modifications stay strictly **preview-only** (PR generation and direct updates are disabled/not implemented).

All unit and integration tests (174/174 assertions) are fully green. Static analysis and credential scanner tests confirm no secrets or forbidden domains are exposed.

---

## 2. GitHub OAuth Authentication Module

### Capabilities Evaluated
* **State Verification**: OAuth callback flow enforces strict anti-CSRF protections via the `xhalo_oauth_state` transient cookie. The state cookie is fully deleted (`Max-Age=0`) upon successful token exchange.
* **Whitelist Authorization**: Logins are checked against `GITHUB_OAUTH_ALLOWED_LOGINS`. Unauthorized attempts trigger `oauth_unauthorized_login` security logs and a 403 Forbidden response.
* **Session Cookie Hardening**: Cookie `xhalo_admin_session` is written with `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=X`. Session payloads are signed via HMAC-SHA256 using `ADMIN_SESSION_SECRET`.

### Strengths
1. **Access Token Isolation**: The GitHub API access token is used exclusively in-memory during callback and never persisted to database tables, logs, or the client session cookie.
2. **Standard Cookie Flags**: Lax same-site and HttpOnly cookie settings prevent CSRF and XSS-based session interception.

### Remaining Production Risks & Mitigations
* **Self-Contained Sessions (No Server Revocation)**: Session tokens are stateless JSON payloads signed via HMAC-SHA256. If a session token is leaked, it cannot be revoked on the server side prior to its expiration (`ADMIN_SESSION_TTL_SECONDS`).
  * *Mitigation*: The default TTL is restricted to 24 hours (`86400` seconds). In future phases, a database-backed session token blacklist or revocation table should be implemented.
* **Whitelist via Env Var**: Allowed logins list is loaded via a comma-separated environment variable.
  * *Mitigation*: Suitable for single-owner or small-team blogs. Larger organizations must migrate whitelist management to D1 database tables with admin management tools.

---

## 3. Media Asset Manager (Dry-run)

### Capabilities Evaluated
* **Path Traversal Gate**: Rejects input filenames containing relative paths (e.g. `../`, `/`, `\`).
* **Sanitization Guarantee**: Standardizes filename markers to alphanumeric characters and hyphens. Empty results are rejected.
* **Extension Blocklist**: Strictly blocks executables and active web assets (`.exe`, `.js`, `.sh`, `.php`, `.html`, `.htm`, `.xhtml`).
* **SVG Risk Handling**: Marks `.svg` files with `highRisk: true` and logs safety notices, restricting them from live operations.

### Remaining Production Risks & Mitigations
* **SVG Script Execution (XSS)**: SVG documents can contain active XML script tags that run in the user's browser context if rendered inline.
  * *Mitigation*: The dry-run generator correctly flags SVGs. When live writing is implemented, SVGs must be uploaded with headers enforcing `Content-Disposition: attachment` or processed via a sanitization library to strip XML scripts.

---

## 4. Site Menu Manager (Preview-only)

### Capabilities Evaluated
* **Protocol & Scheme Gating**: Reject any external path not beginning with `https://` (blocking `http://`). Reject injection schemes (`javascript:`, `data:`) and relative protocols (`//`).
* **Configuration Loader Resiliency**: Correctly handles GitHub API `404 Not Found` statuses to fall back to loading the default `rb-blog.config.example.json?ref=main` configuration.
* **Diff Generator**: Safely applies target updates in-memory to generate config diffs without altering the remote repository.

### Remaining Production Risks & Mitigations
* **Direct Write Gating**: Direct main branch configuration updates (`POST /api/site/menu/direct-update`) are disabled.
  * *Mitigation*: The feature must remain locked under `OWNER_DIRECT_CONFIG_UPDATE_ENABLED=false` until a PR-driven peer-review workflow is developed.

---

## 5. Auditing & Incident Readiness

Every administrative route publishes structured events to the console and inserts audit trail records in the D1 `audit_logs` table:

* **Authentication Event Logs**: Logs `oauth_login_success`, `oauth_unauthorized_login`, and `auth_rejected`.
* **Resource Action Logs**: Logs `media_preview`, `menu_load`, and `menu_preview`.

---

## 6. Release Verification Checklist

| Metric | Target | Status |
| --- | --- | --- |
| **Monorepo Build Integrity** | `npm run check:all` passes | **GREEN** |
| **Security Secrets Scan** | `npm run check:secrets` passes | **GREEN** |
| **Unit Test Coverage** | 174 test assertions pass | **GREEN** |
| **Admin UI Dry-run Labels** | "Dry-run" and "Preview" labels verified | **GREEN** |
| **Environment Boundaries** | `LIVE_WRITES_ENABLED = false` baseline | **GREEN** |
