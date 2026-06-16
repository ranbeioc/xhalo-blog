# xhalo-blog In-project Admin GitHub OAuth Preview Login Evidence

## Environment

* **Deployment target**: Local/Staging Preview Environment
* **Platform**: Cloudflare Pages / Workers
* **Verification Date**: 2026-06-16

## Git Commit

* **Commit Hash**: Local codex preview branch `codex/in-project-admin-oauth-preview-login`
* **Status**: Working directory contains verified fixes for CORS preflight, credentials forwarding, and in-project route redirects.

## xhalo-blog Project URL

* `https://xhalo-blog.pages.dev` (Standard Pages deployment domain)

## Admin URL

* `https://xhalo-blog.pages.dev/admin` (Admin UI served as a sub-path within the primary Pages project)

## API/Auth URL

* `https://xhalo-blog.pages.dev/auth/github/*`
* `https://xhalo-blog.pages.dev/api/*`

## OAuth App Settings

* **Application Name**: `xhalo-blog`
* **Homepage URL**: `https://xhalo-blog.pages.dev`
* **Authorization Callback URL**: `https://xhalo-blog.pages.dev/auth/github/callback`

## Environment Variables Checked

* `ADMIN_AUTH_BASE_URL`: Defines the API/Auth worker origin.
* `ADMIN_FRONTEND_BASE_URL`: Defines the frontend UI origin (e.g., `https://xhalo-blog.pages.dev`).
* `ADMIN_FRONTEND_PATH`: Defaults to `/admin`.
* `LIVE_WRITES_ENABLED`: Checked as `false`.
* `PUBLISH_MODE`: Checked as `pr_only`.
* `OWNER_DIRECT_PUBLISH_ENABLED`: Checked as `false`.
* `OWNER_DIRECT_UPDATE_ENABLED`: Checked as `false`.
* `OWNER_DIRECT_CONFIG_UPDATE_ENABLED`: Checked as `false`.

## Login Flow

1. User visits `/admin` on the main deployment.
2. The topbar renders a **Login with GitHub** button.
3. Clicking **Login with GitHub** directs the user to `/auth/github/start` (via `getLoginUrl()`).
4. The API start route returns a redirect (`302 Found`) to GitHub's OAuth authorization page.

## Callback Redirect

1. After successful authorization on GitHub, the browser is redirected to `/auth/github/callback`.
2. The API exchange is performed in-memory, session cookies are written, and the user is redirected to the path derived from:
   `${ADMIN_FRONTEND_BASE_URL}${ADMIN_FRONTEND_PATH}` (specifically `/admin`).

## Session Cookie

* Cookie name: `xhalo_admin_session`
* Attributes: `HttpOnly; Secure; SameSite=Lax; Path=/`
* Payload: HMAC-SHA256 signed JSON payload (containing user metadata).
* Anti-CSRF transient cookie `xhalo_oauth_state` is set during start and deleted (`Max-Age=0`) during callback.

## /api/auth/session

* Returns `{"authenticated": true}` and user info when a valid `xhalo_admin_session` cookie is present.
* The frontend UI checks this endpoint via `apiFetch` using `credentials: 'include'`.

## Logout

* Triggers a request to `/api/auth/logout`.
* Clears the `xhalo_admin_session` cookie (`Max-Age=0`).
* Future checks to `/api/auth/session` return `{"authenticated": false}`.

## Dashboard Preview

* System health, database connectivity status, and PR-only deployment flags are rendered properly.
* Displays warning status informing the user that all direct write capabilities are disabled.

## Posts Preview

* Fetches the post list successfully from the read-only API.
* Filtering and keyword searching operates completely client-side.
* Selecting an article successfully routes the user into the Editor view.

## Editor Preview

* Loads the markdown source code of the chosen post.
* The edit panel renders live previews side-by-side.
* Tab navigation swaps between Edit, Preview, Diff, and Plan views without issues.
* Direct action controls (direct publish/update) are disabled.

## Media Dry-run Preview

* Upload interface supports file drop and selects image/video assets.
* Submitting the upload generates standard Hexo tags and HTML layouts.
* No files are written to the live R2 storage; all operations run in dry-run preview mode.

## Menu Preview

* Fetches site configuration navigation menu structure.
* Adding/editing/deleting a menu item simulates local adjustments.
* No updates are pushed to the backend; saving configuration mutations is blocked.

## Publishing Gate Checks

* Safety center maps the lock state of each workflow.
* Confirmed that `LIVE_WRITES_ENABLED=false` and all production-write parameters are locked.

## Audit Logs

* Renders the structured database audit trace history.
* Masked values protect passwords, credentials, and secrets.
* Session tokens and cookie data are never written to the audit log tables.

## No Write Confirmation

* **Admin is served under the xhalo-blog project.**
* **No separate xhalo-blog-admin Cloudflare Pages project is required.**
* **xhalo-admin is not the deployment target.**
* **No production writes occurred.**
* **No R2 object was written.**
* **No hexo-blog main mutation occurred.**
* **No branch or PR was created in hexo-blog.**
* **No OAuth access token was exposed.**
* **No session cookie raw value was logged.**
* **No admin shared secret was committed.**

## External Cleanup Notes

* The stale/incorrect preview deployment on the standalone `xhalo-admin` Pages project should be ignored or deleted manually, as it does not target this repository's admin codebase.

## Issues Found

* None.

## Verdict

**PASSED**
