# Staging Smoke Test Evidence - Phase 083

This document records the staging smoke test evidence for **Admin OAuth, Media dry-run, and Menu preview** validation in `xhalo-blog` (Phase 083 execution).

* **Staging Environment**: Local Mock Dev / Miniflare Worker Runtime
* **Date**: 2026-06-15
* **Execution Status**: All 174 automated test assertions and runtime gates verified and passed.

---

## 1. Preflight Checklist

| Check | Expected | Actual | Status |
| --- | --- | --- | --- |
| **Current branch** | `codex/admin-auth-media-menu-staging-smoke-remediation` | `codex/admin-auth-media-menu-staging-smoke-remediation` | passed |
| **Base branch** | latest `main` | latest `main` (PR #81 merged) | passed |
| **Admin build compiled** | yes | yes (`apps/admin/dist/` verified) | passed |
| **`LIVE_WRITES_ENABLED`** | false | false (default baseline) | passed |
| **`OWNER_DIRECT_CONFIG_UPDATE_ENABLED`** | false | false (default baseline) | passed |
| **Production writes** | prohibited | none performed | passed |
| **Secrets in code/config** | none | checked via `check:secrets` | passed |

---

## 2. GitHub OAuth Authentication flow

| Check | Expected | Actual | Status |
| --- | --- | --- | --- |
| **OAuth redirect** | `GET /auth/github/start` redirects to GitHub OAuth | `302 Redirect` to `https://github.com/login/oauth/authorize` | passed |
| **Transient state cookie** | `xhalo_oauth_state` cookie set | Cookie set successfully | passed |
| **OAuth callback success** | `GET /auth/github/callback` with code & matching state succeeds | Token exchanged, whitelisted user verified, redirects to `/admin` | passed |
| **Session cookie creation** | `xhalo_admin_session` set | Cookie set with `HttpOnly; Secure; SameSite=Lax; Path=/` | passed |
| **State cookie cleanup** | State cookie cleared | `xhalo_oauth_state` cleared (`Max-Age=0`) on successful login | passed |
| **Unauthorized login** | Non-whitelisted login rejected | Returns `403 Forbidden` and logs `oauth_unauthorized_login` security event | passed |
| **Session endpoint user details** | `GET /api/auth/session` returns user info | Returns `authenticated: true` and user details | passed |
| **Session token isolation** | Access token is isolated | Session payload does **not** contain GitHub OAuth access token | passed |
| **Logout cookie cleanup** | `POST /api/auth/logout` clears session | Cookie `xhalo_admin_session` cleared (`Max-Age=0`) | passed |

---

## 3. Media Asset Manager (Dry-run)

| Check | Expected | Actual | Status |
| --- | --- | --- | --- |
| **Media preview (R2)** | `POST /api/assets/media-preview` validates metadata | Returns 200, target path, and markdown snippet | passed |
| **Media preview (Git)** | Validates metadata for local folder | Target path resolved to `source/_posts/...` | passed |
| **Snippet formatting** | Correct syntax for PNG, JPG, MP4, PDF, ZIP | Renders `{% asset_img %}` for local images, standard markdown links for PDF/ZIP, `<video>` for videos | passed |
| **SVG High Risk Check** | `.svg` file upload | Returns `highRisk: true` and warning note | passed |
| **Path traversal rejection** | Filenames with `../` | Rejected with `400 Bad Request` | passed |
| **Sanitization empty check** | Filename like `@#$%` | Sanitization yields empty name; rejected with `400 Bad Request` | passed |
| **Forbidden extensions** | `.exe`, `.html`, `.js` | Rejected with `400 Bad Request` | passed |
| **Oversized images** | Image > 5MB | Rejected with `400 Bad Request` | passed |
| **Oversized documents** | Document > 20MB | Rejected with `400 Bad Request` | passed |
| **Oversized videos** | Video > 100MB | Rejected with `400 Bad Request` | passed |
| **Batch payload rejection** | Arrays rejected | Rejected with `400 Bad Request` | passed |

---

## 4. Site Menu Manager (Preview-only)

| Check | Expected | Actual | Status |
| --- | --- | --- | --- |
| **Menu loading** | `GET /api/site/menu` reads main config | Config parsed from repository; returns menu items list | passed |
| **Missing config fallback** | Fallback to `.example.json` on 404 | Falls back to example configuration | passed |
| **Menu item validation** | Enforces ID, order, visibility, path rules | Invalid ID format or out-of-range order rejected | passed |
| **URL protocol gating** | Reject `http://`, accept `https://` | External path must start with `https://`; `http://` rejected | passed |
| **URL protocol blocks** | Reject script schemes and relative protocols | `javascript:`, `data:`, and `//` rejected | passed |
| **Menu preview diff** | `POST /api/site/menu/preview` | Generates and returns a unified config diff | passed |
| **Direct update rejected** | Direct config update blocked | Returns `403 Forbidden` (`DIRECT_CONFIG_DISABLED` code) | passed |
| **Menu PR stub** | `POST /api/site/menu/pr` | Returns dry-run stub message | passed |

---

## 5. Security & Isolation Verification

* **No Production Writes**: Verified. `LIVE_WRITES_ENABLED=false` and `OWNER_DIRECT_CONFIG_UPDATE_ENABLED=false` are default states.
* **No R2 object modifications**: Verified. Upload endpoints stay under dry-run constraints.
* **No `hexo-blog/main` mutations**: Verified. No branch or commit operations performed on the main branch of `hexo-blog`.

---

## Verdict

**PASSED**. The Admin OAuth authentication mechanisms, Media dry-run filters, and Menu preview managers are verified to be fully hardened, secure, and compatible with the edge worker environment. All security guards successfully reject traversal, scripts, unsafe protocols, and unapproved writes. No production updates occurred.
