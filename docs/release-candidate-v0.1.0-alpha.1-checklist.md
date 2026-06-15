# Release Candidate Checklist: v0.1.0-alpha.1

## Scope

This checklist governs the release readiness of version `v0.1.0-alpha.1` Release Candidate. It verifies the security, environment configuration, and verification status of the newly introduced admin tools, focusing on OAuth authentication, dry-run media assets, and site menu preview capability.

## Included Modules

- **Admin GitHub OAuth Login Preview**: anti-CSRF state verification, whitelist login checks, secure session signing, memory-only token handling.
- **Admin Media Asset Manager Dry-run**: path traversal check, filename sanitization, forbidden extension check, SVG high-risk warnings.
- **Admin Site Menu Manager Preview**: main branch config loading fallback, format validation, disallowed protocols filter, diff preview.
- **Owner Direct Create / Update disabled by default**: direct publish/update is protected by security gates.
- **PR-only Publishing default**: all default publishing actions flow through GitHub Pull Requests.

## Explicitly Excluded

- Production R2 media writes (blocked via dry-run enforcement).
- Menu config PR creation (not implemented/not enabled).
- Menu direct update (disabled by default).
- Direct production publish/update (disabled by default).
- Auto-merge (not approved).
- Batch publish (not supported).
- Batch media upload (not supported).

## Required Defaults

Verify that the following default configuration values are strictly set in example and core config files:

- `LIVE_WRITES_ENABLED=false` (Must not write to production/storage by default)
- `PUBLISH_MODE=pr_only` (Must use PR-driven workflow by default)
- `OWNER_DIRECT_PUBLISH_ENABLED=false` (Must not write to main without validation & approval)
- `OWNER_DIRECT_UPDATE_ENABLED=false` (Must not directly update existing posts on main)
- `OWNER_DIRECT_CONFIG_UPDATE_ENABLED=false` (Must not directly update configuration files)
- `GITHUB_OAUTH_CLIENT_ID=` (Must be empty in templates)
- `GITHUB_OAUTH_CLIENT_SECRET=` (Must be empty in templates)
- `ADMIN_SESSION_SECRET=` (Must be empty in templates)

## Security Checks

### 5.1 OAuth Security
- [x] OAuth state cookie is checked on callback.
- [x] OAuth state cookie is deleted after successful callback (`Max-Age=0`).
- [x] GitHub access token is memory-only and never stored.
- [x] Access token is not stored in D1.
- [x] Access token is not written to session cookie.
- [x] Access token is not logged to console.
- [x] Session cookie is marked `HttpOnly`.
- [x] Session cookie is marked `Secure`.
- [x] Session cookie uses `SameSite=Lax`.
- [x] `GITHUB_OAUTH_ALLOWED_LOGINS` is enforced.
- [x] Unauthorized logins return HTTP 403.

### 5.2 Media Security
- [x] Media preview is dry-run only.
- [x] Media insert snippet only returns Markdown/HTML helper snippets.
- [x] No R2 production write is triggered by Media Manager.
- [x] Dangerous extensions are rejected (`.exe`, `.js`, `.sh`, `.php`, `.html`, `.htm`, `.xhtml`).
- [x] SVG is identified as high-risk and dry-run only.
- [x] PDF generates download markdown link only.
- [x] ZIP generates download markdown link only.
- [x] Video generates video tag only.
- [x] Filename path traversal is rejected (`..`, `/`, `\`).

### 5.3 Menu Security
- [x] Menu preview only generates config diff.
- [x] Menu PR generation remains not implemented or dry-run.
- [x] Menu direct update remains disabled by default.
- [x] External menu URLs require `https://`.
- [x] `javascript:` protocol is rejected.
- [x] `data:` protocol is rejected.
- [x] Protocol-relative paths (e.g. `//example.com`) are rejected.
- [x] Duplicate menu IDs are rejected.

## Test Evidence

- **Unit/Integration Tests**: 174 test assertions verified green under `tests/admin-auth-media-menu.test.mjs` covering expired/forged sessions, invalid filenames, traversal blocks, allowed logins, SVG high risk flags, and menu parsing.
- **Secrets Scanning**: All secrets scanned and confirmed clean with zero committed tokens or secrets.

## Documentation Evidence

Confirm that the following files exist in the repository:
- `docs/admin-github-oauth-login.md`
- `docs/admin-media-asset-manager.md`
- `docs/admin-site-menu-manager.md`
- `docs/admin-auth-media-menu-staging-smoke-test-evidence-20260615.md`
- `docs/admin-auth-media-menu-production-rc-review.md`

## Known Remaining Risks

- **Stateless Session Revocation**: HMAC session cookies are stateless. If compromised, they cannot be blacklisted server-side until they expire (24-hour TTL).
- **SVG Live Upload XSS**: SVGs contain XML-based scripts. Under dry-run, they are safe, but live write activation must force either script-stripping sanitization or `Content-Disposition: attachment` headers.
- **Menu Direct Update**: Direct configuration updates to the main branch must remain disabled to prevent un-reviewed configuration changes.

## Go / No-Go Decision

- **GO** for Release Candidate PR review.
- **NO-GO** for production write enablement.
- **NO-GO** for release tag until owner approval.

## Owner Approval Required Before Tagging

No release tags or releases may be created on GitHub until the owner explicitly issues:
> "I approve creating the v0.1.0-alpha.1 release tag from main."
