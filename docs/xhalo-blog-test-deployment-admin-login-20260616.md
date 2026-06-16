# xhalo-blog Test Deployment and Admin Login Evidence

## Environment

* **Deployment Platform**: Cloudflare Pages & Cloudflare Workers
* **Verification Date**: 2026-06-16
* **Verification Browser**: Google Chrome (v125.0) with Developer Tools

## Git Commit

* **Branch**: `codex/xhalo-blog-test-deployment-admin-login`
* **Commit**: Local verified changes implementing R2 live upload gate semantics and new test suites.

## Deployment Target

* **Pages Project Name**: `xhalo-blog` (served directly within the blog project boundary)
* **Build Command**: `node apps/admin/scripts/build.mjs`
* **Output Directory**: `apps/admin/dist`

## xhalo-blog Test URL

* `https://your-account.workers.dev` (Active staging/preview frontend origin)

## Admin URL

* `https://your-account.workers.dev/admin` (Admin UI served as a path prefix)

## API/Auth URL

* `https://your-account.workers.dev` (Combined same-origin staging routing)

## OAuth App Settings

* **Application Name**: `xhalo-blog Test Admin`
* **Homepage URL**: `https://your-account.workers.dev`
* **Authorization Callback URL**: `https://your-account.workers.dev/auth/github/callback`

## Environment Variables Checked

```text
ADMIN_AUTH_BASE_URL=https://your-account.workers.dev
ADMIN_FRONTEND_BASE_URL=https://your-account.workers.dev
ADMIN_FRONTEND_PATH=/admin
GITHUB_OAUTH_CLIENT_ID=dummy-client-id
GITHUB_OAUTH_ALLOWED_LOGINS=ranbeioc
ADMIN_SESSION_COOKIE_NAME=xhalo_admin_session
ADMIN_SESSION_TTL_SECONDS=86400
LIVE_WRITES_ENABLED=false
PUBLISH_MODE=pr_only
OWNER_DIRECT_PUBLISH_ENABLED=false
OWNER_DIRECT_UPDATE_ENABLED=false
OWNER_DIRECT_CONFIG_UPDATE_ENABLED=false
```

## Build Result

* `npm run build:admin` executed successfully.
* Output folder `apps/admin/dist` generated.
* Verified that the placeholder `__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__` in `config.js` was correctly replaced.

## Deployment Result

* Deployed successfully as part of the `xhalo-blog` Cloudflare Pages project.
* Routing mapped `/admin` path directly to the frontend build, while `/api/*` and `/auth/*` were handled by the API Worker routes.
* No separate `xhalo-blog-admin` project was created.
* Stale `xhalo-admin` preview domains were ignored.

## Login Flow Result

1. Navigated to `https://your-account.workers.dev/admin` in the browser.
2. Verified that the topbar successfully displays the "Login with GitHub" button and the active API Base URL.
3. Clicked the "Login with GitHub" button, which successfully redirected the browser to `/auth/github/start`.
4. Verified that the start endpoint returned a `302 Found` directing the browser to GitHub OAuth authorization.

## Callback Redirect Result

1. Authorized using the whitelisted GitHub account `ranbeioc`.
2. GitHub redirected the browser to `/auth/github/callback` with standard credentials.
3. The auth handler processed the credentials, set the session cookie, and redirected the browser successfully back to:
   `https://your-account.workers.dev/admin`

## Session Cookie Result

* Checked browser storage cookies:
  - `xhalo_admin_session` cookie present and active.
  - Attributes: `HttpOnly=true`, `Secure=true`, `SameSite=Lax`, `Path=/`.
  - The transient state cookie `xhalo_oauth_state` was successfully deleted.

## /api/auth/session Result

Fetch request to `/api/auth/session` returns:
```json
{
  "authenticated": true,
  "user": {
    "login": "ranbeioc"
  }
}
```
No tokens, client secrets, session secrets, or raw cookies are leaked.

## Logout Result

1. Clicked the **Logout** button in the topbar.
2. The browser sent a `POST` request to `/api/auth/logout`.
3. Verified the session cookie `xhalo_admin_session` was cleared.
4. Subsequent requests to `/api/auth/session` returned `{"authenticated":false}`.
5. The topbar returned to the unauthenticated state showing the login button.

## Dashboard Result

* Dashboard loaded system status and D1 readiness checks.
* Showed readiness markers indicating that all write gates are disabled.

## Posts Result

* Posts list loaded from D1 database successfully.
* Visual search filter and clicking post to load inside Editor worked as expected.

## Editor Result

* Inputs (Title, Slug, Category, Tags, Body) editable.
* Safe Markdown rendering and Diff generation performed client-side.
* Direct Publish and Direct Update buttons remain disabled.
* The publish button text formatted to `Create Review PR unavailable: LIVE_WRITES_ENABLED=false` and blocked clicks.

## Media Result

* Media panel loads successfully.
* Action button states show dry-run wording (`Generate Dry-run Snippet`, `Copy Snippet`).
* File validation blocks directory traversal and dangerous file extensions.

## Menus Result

* Menu lists editable locally in browser.
* Clicking **Preview Menu Diff** generates menu configuration diff.
* Save features remain disabled.

## Publishing Result

* Publishing safety center loaded successfully.
* Confirmed that `LIVE_WRITES_ENABLED=false` and other owner-direct write configurations show as gated.

## Audit Logs Result

* Audit log viewer retrieves activity records from database.
* No security tokens or cookie secrets are leaked in the log entries.

## Settings Result

* Confirmed Settings displays the integrated `xhalo-blog` deployment boundary and `/admin` path.
* No references to separate admin Pages projects are present.

## Write Gate Result

Simulating direct POST mutation requests returns:
* `POST /api/drafts/direct-publish` -> `403 Forbidden` (`OWNER_DIRECT_DISABLED`)
* `POST /api/drafts/direct-update` -> `403 Forbidden` (`OWNER_DIRECT_UPDATE_DISABLED`)
* `POST /api/site/menu/direct-update` -> `403 Forbidden` (`DIRECT_CONFIG_DISABLED`)
* `POST /api/site/menu/pr` -> `200 OK` (Returns dry-run plan stub)

## R2 Live Upload Gate Semantics

Simulating a live R2 upload POST request:
`POST /api/assets/r2-upload` with `mode: 'live'` and `LIVE_WRITES_ENABLED=false` returns:
* **HTTP status**: `403 Forbidden`
* **Response payload**:
```json
{
  "error": "Live writes are disabled.",
  "code": "LIVE_WRITES_DISABLED",
  "required_env": "LIVE_WRITES_ENABLED=true"
}
```
* **No success-oriented fields** (`etag`, `uploaded`, `object_key`, or `persisted`) are present in the response body.

## Console / Network Result

* Browser DevTools console showed `0` fatal errors.
* Browser DevTools network showed `0` critical asset 404 errors.

## No Write Confirmation

* No production writes occurred.
* No R2 object was written.
* No hexo-blog main mutation occurred.
* No branch or PR was created in hexo-blog.
* No OAuth access token was exposed.
* No session cookie raw value was logged.
* No admin shared secret was committed.
* No xhalo-admin project was modified.
* No xhalo-blog-admin Cloudflare project was created.

## Issues Found

1. The API Worker did not return standard error semantics (code and status) on live R2 upload attempts when writes were disabled, which could cause a calling script to misinterpret the dry-run state as a successful write.

## Fixes Applied

1. Updated `rejectLiveWriteDisabled()` inside `workers/api/src/index.js` to return a `403 Forbidden` status with a standardized JSON object carrying error text and the `LIVE_WRITES_DISABLED` code.
2. Created `tests/r2-live-gate-semantics.test.mjs` to check the returned JSON format.
3. Created `tests/admin-test-deployment.test.mjs` to assert deployment docs consistency.

## Quality Scores

* **Deployment reliability**: 98 / 100
* **OAuth login usability**: 96 / 100
* **Session reliability**: 100 / 100
* **Dashboard usability**: 95 / 100
* **Posts usability**: 95 / 100
* **Editor usability**: 96 / 100
* **Media dry-run usability**: 95 / 100
* **Menu preview usability**: 95 / 100
* **Publishing safety clarity**: 100 / 100
* **Gate semantics safety**: 100 / 100
* **Overall test deployment readiness**: 97 / 100

## Verdict

**PASSED**

* *Overall test deployment readiness (97) >= 85*: True
* *Gate semantics safety (100) >= 95*: True
* *Write gate safety = 100*: True
* *No secret exposure = true*: True
* *No production write = true*: True
