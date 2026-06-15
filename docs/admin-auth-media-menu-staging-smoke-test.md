# Staging Smoke Test Runbook and Evidence Template

This document provides the runbook and the evidence template for verifying Phase 082 staging smoke tests. It serves to document that the authentication, media asset manager, and menu configuration modules function properly without any unauthorized writes.

---

## Part 1: Staging Smoke Test Runbook

Follow these steps to conduct the staging smoke test:

### 1. Verification of OAuth Authentication Flow
1. Navigate to your staging deployment’s login link: `https://<staging-preview-domain>/auth/github/start`.
2. Verify you are redirected to the GitHub authorization page and the `xhalo_oauth_state` transient cookie is created in the browser.
3. Complete the login with a GitHub username listed in `GITHUB_OAUTH_ALLOWED_LOGINS`.
4. Verify you are redirected back to the `/admin` workspace and the `xhalo_admin_session` HTTP-Only cookie is set.
5. Verify that `/api/auth/session` returns authenticated status and user details.
6. Verify that accessing `/auth/github/callback` with an mismatched state or no code returns a 400 or 403 error.
7. Attempt login with a non-whitelisted account and verify you receive a 403 Forbidden response.
8. Click the logout button and verify that cookies are cleared and session status is revoked.

### 2. Verification of Media Asset Manager (Dry-run)
1. In the Media Panel, fill in a test post slug, filename (e.g. `cover.jpg`), content-type, size, and label.
2. Click **Preview Media Asset**. Verify a successful dry-run JSON payload is returned with the target path and Markdown snippet.
3. Submit an SVG file name and verify that the response returns the `highRisk: true` flag and safety warnings.
4. Try to submit a filename with path traversal (`../`) or a forbidden extension (`.exe`, `.html`, `.js`) and verify it is rejected with a 400 Bad Request error.

### 3. Verification of Site Menu Manager (Preview-only)
1. Click **Load Current Menu**. Verify that the menu items are loaded from `rb-blog.config.json` (or fallback config).
2. Edit a menu item or add a new menu item.
3. Click **Generate Diff Preview**. Verify that a preview diff block is returned showing the modified lines.
4. Attempt a direct update request and verify it is rejected with a 403 Forbidden or dry-run message.

---

## Part 2: Smoke Test Evidence Template

Fill out this template upon execution of staging tests.

### Test Metadata
* **Tester Name / ID**: [Insert name]
* **Testing Date**: [Insert date]
* **Staging Deployment URL**: [Insert URL]

### Verification Checklist & Results

| Check | Target / Endpoint | Result | Notes / Details |
| --- | --- | --- | --- |
| **OAuth Configuration** | Environment config verification | `[Yes / No]` | `GITHUB_OAUTH_CLIENT_ID` and other vars loaded |
| **OAuth Redirect** | `GET /auth/github/start` | `[Pass / Fail]` | Correct redirect to GitHub login screen |
| **OAuth Callback** | `GET /auth/github/callback` | `[Pass / Fail]` | Redirect back to `/admin` with HTTP-Only cookie set |
| **State Cookie Cleanup** | State cookie verification | `[Pass / Fail]` | `xhalo_oauth_state` cookie cleared on login |
| **Unauthorized Login** | Forbidden username callback | `[Pass / Fail]` | Attacker login returns 403; audit logs security event |
| **Session API** | `GET /api/auth/session` | `[Pass / Fail]` | Returns authenticated status; does not leak oauth token |
| **Logout API** | `POST /api/auth/logout` | `[Pass / Fail]` | Session cookie cleared; user logged out |
| **Media Preview** | `POST /api/assets/media-preview` | `[Pass / Fail]` | Validates payload, returns target path & markdown |
| **Media Snippet** | Snippet generation check | `[Pass / Fail]` | Generates asset image / markdown / video syntax |
| **Media Security Gating** | Executable/traversal checks | `[Pass / Fail]` | HTML, EXE, path traversal files successfully rejected |
| **SVG High Risk Check** | SVG file validation | `[Pass / Fail]` | SVG files flagged as high-risk |
| **Menu Loading** | `GET /api/site/menu` | `[Pass / Fail]` | Successfully reads configuration from GitHub main branch |
| **Menu Preview Diff** | `POST /api/site/menu/preview` | `[Pass / Fail]` | Validates list, returns unified config file diff |
| **Menu Gating** | Unsafe URL / direct update check | `[Pass / Fail]` | `http://` and script protocols blocked; direct update rejected |

### Production Boundary Verification

Confirm that no production writes or side-effects occurred:

* **No Production D1 / D2 Writes**: `[Confirmed / Mismatch]`
* **No R2 Bucket Writes**: `[Confirmed / Mismatch]`
* **No Commits to `hexo-blog/main`**: `[Confirmed / Mismatch]`
* **No Pull Requests Opened**: `[Confirmed / Mismatch]`

**Verification Signature**:
*(Insert signature / date here)*
