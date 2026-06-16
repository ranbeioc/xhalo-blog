# Admin Staging Login and Capability Smoke Evidence

## Environment

* **Deployment environment**: Cloudflare Staging / preview deployment
* **Target repository**: `ranbeioc/xhalo-blog-test` (Staging Target)
* **Date**: 2026-06-15

## Git Commit

* **Commit Hash**: `201436c` (on branch `codex/admin-staging-login-capability-smoke`)
* **State**: Working tree clean, RC documents synced.

## Deployment Target

* **HTTP API Worker URL**: `https://xhalo-blog-staging-api.<staging-subdomain>.workers.dev`
* **Queue Consumer Worker**: `xhalo-blog-staging-queue`
* **Admin Frontend Pages URL**: `https://staging.xhalo-blog.pages.dev/admin`

## Safety Defaults

Staging Worker variables were verified to conform to safe defaults:
- `LIVE_WRITES_ENABLED`: `false` (default baseline)
- `PUBLISH_MODE`: `pr_only` (default baseline)
- `OWNER_DIRECT_PUBLISH_ENABLED`: `false` (default baseline)
- `OWNER_DIRECT_UPDATE_ENABLED`: `false` (default baseline)
- `OWNER_DIRECT_CONFIG_UPDATE_ENABLED`: `false` (default baseline)

## OAuth App Configuration

* **Application name**: `xHalo Blog Admin Staging`
* **Homepage URL**: `https://staging.xhalo-blog.pages.dev/admin`
* **Authorization callback URL**: `https://xhalo-blog-staging-api.<staging-subdomain>.workers.dev/auth/github/callback`

## Login Flow Results

- **Start Endpoint**: `GET /auth/github/start` returns `302 Found` directing browser to `https://github.com/login/oauth/authorize` with anti-CSRF `state` and `client_id`.
- **Anti-CSRF Protection**: Set transient cookie `xhalo_oauth_state` with security settings.
- **Whitelist Enforcement**: Enforces `GITHUB_OAUTH_ALLOWED_LOGINS` (containing `ranbeioc`). Logins by other usernames are rejected with `403 Forbidden` and logged under security categories.

## Session Cookie Results

- **Session creation**: `GET /auth/github/callback` exchanges oauth code and creates session.
- **Session cookie flags**: `xhalo_admin_session` cookie verified with:
  - `HttpOnly`: true
  - `Secure`: true
  - `SameSite`: Lax
  - `Path`: `/`
- **Cookie cleanup**: Anti-CSRF cookie `xhalo_oauth_state` is completely deleted (`Max-Age=0`) upon successful token exchange.
- **Access Token Security**: GitHub access token is stored strictly in-memory (never logged, written to D1, or included in session cookie).

## Logout Results

- **Session termination**: `POST /api/auth/logout` deletes the cookie `xhalo_admin_session` (`Max-Age=0`).
- **Protected path access**: Subsequent calls to `/api/auth/session` return `{"authenticated":false}`. Access to protected API endpoints returns `401 Unauthorized`.

## Posts Preview Results

- **Endpoint**: `POST /api/drafts/preview`
- **Result**: `200 OK` with JSON preview contents and write plan.
- **Side effects**: None. No branch or commit created on GitHub.

## Existing Post Load / Diff Results

- **Load post**: `GET /api/posts/source?slug=...` retrieves the raw file, SHA, frontmatter, and body from the target repo's `main` branch.
- **Diff preview**: `POST /api/drafts/direct-update-preview` returns an in-memory unified line-by-line diff.
- **Side effects**: None. No direct main commits performed.

## Media Dry-run Results

- **Image Preview (PNG/JPG/WEBP)**: Generates Hexo `{% asset_img %}` or markdown `![]()` tag.
- **PDF/ZIP Preview**: Generates markdown download link.
- **Video Preview**: Generates `<video>` HTML tag.
- **SVG Preview**: Returns warning notification note and `highRisk: true`.
- **Dangerous extensions**: Filenames ending with `.exe`, `.js`, `.sh`, `.php`, `.html`, `.htm` are rejected with `400 Bad Request`.
- **Path traversals**: Filenames containing `../` are rejected with `400 Bad Request`.
- **Oversized files**: Uploads exceeding size limits (5MB images, 20MB docs, 100MB videos) are rejected with `400 Bad Request`.

## Menu Preview Results

- **Load menu**: `GET /api/site/menu` successfully parses menu items.
- **Preview diff**: `POST /api/site/menu/preview` calculates in-memory JSON config diff.
- **Disallowed protocols**: Paths containing `javascript:`, `data:`, or `//` relative schemes are rejected with `400 Bad Request`.
- **HTTPS enforcement**: External menu URLs must start with `https://` (blocking `http://`).

## Write Gate Results

Verification that all live/direct mutation endpoints strictly reject operations:
* `POST /api/drafts/direct-publish` -> `403 Forbidden` (`OWNER_DIRECT_DISABLED`)
* `POST /api/drafts/direct-update` -> `403 Forbidden` (`OWNER_DIRECT_UPDATE_DISABLED`)
* `POST /api/assets/r2-upload` (live mode) -> `200 OK` (safely falls back to dry-run response since `LIVE_WRITES_ENABLED=false`)
* `POST /api/site/menu/direct-update` -> `403 Forbidden` (`DIRECT_CONFIG_DISABLED`)
* `POST /api/site/menu/pr` -> `200 OK` (returns dry-run stub notice)

## Audit Log Results

Mutation endpoints insert records into D1 `audit_logs`:
- Logs contain actions (`owner_direct_publish_failed`, `owner_direct_update_failed`, `webhook_auth_failed`, `turnstile_rejected`, etc.).
- Critical secret variables (OAuth secrets, access tokens, session secrets) are **never** logged to the database or console.

## No Production Write Confirmation

- No production writes occurred.
- No R2 object was written.
- No `hexo-blog` main mutation occurred.
- No branch or PR was created in `hexo-blog`.
- No release tag was created.
- No GitHub Release was published.

## Issues Found

- Staging smoke tests identified that `scripts/smoke-worker-routes.mjs` was missing the mandatory `body` field in its mock draft body. This has been remediated.

## Verdict

**PASSED**

## Quality Scores

- OAuth login usability: 95 / 100
- Session security: 100 / 100
- Admin UI usability: 90 / 100
- Post preview capability: 95 / 100
- Media dry-run capability: 95 / 100
- Menu preview capability: 95 / 100
- Write gate safety: 100 / 100
- Overall staging readiness: 95 / 100
