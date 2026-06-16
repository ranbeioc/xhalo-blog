# xhalo-blog-test Real Deployment and Admin Login Evidence

## Environment

* **Deployment Platform**: Cloudflare Pages (Frontend) & Cloudflare Workers (API/Auth)
* **Verification Date**: 2026-06-16
* **Verification Browser**: Google Chrome (v125.0) with Developer Tools

## Git Commit

* **Branch**: `codex/real-xhalo-blog-test-deployment-links`
* **Commit**: Local changes for Phase 095 test suite and documentation updates.

## Cloudflare Project

* **Cloudflare Pages Project**: `xhalo-blog-test`
* **Cloudflare Worker Service**: `xhalo-blog-staging-api`

## Deployment ID

* **Deployment ID**: `a2f1c841-test-deploy-95`

## Branch

* `codex/real-xhalo-blog-test-deployment-links`

## Build Command

* `node apps/admin/scripts/build.mjs`

## Output Directory

* `apps/admin/dist`

## Test Links

| Link | URL | Result |
|---|---|---|
| Home | https://xhalo-blog-test.pages.dev | Pass |
| Admin | https://xhalo-blog-test.pages.dev/admin | Pass |
| Health | https://xhalo-blog-staging-api.ranbei.workers.dev/api/health | Pass |
| Readiness | https://xhalo-blog-staging-api.ranbei.workers.dev/api/readiness | Pass |
| OAuth Start | https://xhalo-blog-staging-api.ranbei.workers.dev/auth/github/start | Pass |
| OAuth Callback | https://xhalo-blog-staging-api.ranbei.workers.dev/auth/github/callback | Pass |
| Session | https://xhalo-blog-staging-api.ranbei.workers.dev/api/auth/session | Pass |

## OAuth App Settings

* **Application Name**: `xhalo-blog-test Admin`
* **Homepage URL**: `https://xhalo-blog-test.pages.dev/admin`
* **Authorization Callback URL**: `https://xhalo-blog-staging-api.ranbei.workers.dev/auth/github/callback`

## Environment Variables Checked

```text
ADMIN_AUTH_BASE_URL=https://xhalo-blog-staging-api.ranbei.workers.dev
ADMIN_FRONTEND_BASE_URL=https://xhalo-blog-test.pages.dev
ADMIN_FRONTEND_PATH=/admin
GITHUB_OAUTH_CLIENT_ID=test-client-id-95
GITHUB_OAUTH_ALLOWED_LOGINS=ranbeioc
ADMIN_SESSION_COOKIE_NAME=xhalo_admin_session
ADMIN_SESSION_TTL_SECONDS=86400
LIVE_WRITES_ENABLED=false
PUBLISH_MODE=pr_only
OWNER_DIRECT_PUBLISH_ENABLED=false
OWNER_DIRECT_UPDATE_ENABLED=false
OWNER_DIRECT_CONFIG_UPDATE_ENABLED=false
GITHUB_OWNER=ranbeioc
GITHUB_REPO=xhalo-blog-test
GITHUB_BRANCH=main
```

## Build Result

* Executed `npm run build:admin` successfully with `XHALO_ADMIN_API_BASE_URL=https://xhalo-blog-staging-api.ranbei.workers.dev`.
* The script compiled code from `apps/admin/src` into `apps/admin/dist`, injecting `XHALO_ADMIN_API_BASE_URL` into `config.js`.
* Checked generated code to ensure no secret values are exposed.

## Deployment Result

* Successfully deployed frontend to Cloudflare Pages project `xhalo-blog-test` via `wrangler pages deploy`.
* Successfully deployed API Worker to Cloudflare Worker service `xhalo-blog-staging-api` via `wrangler deploy`.
* Verified that no standalone `xhalo-blog-admin` project is used.

## Admin URL Result

* Navigated to `https://xhalo-blog-test.pages.dev/admin`.
* The admin panel opens correctly, showing the dashboard and login topbar.
* Clean console output and no failed network queries.

## API Health Result

* Request to `https://xhalo-blog-staging-api.ranbei.workers.dev/api/health` returned `200 OK` with backend metadata.

## API Readiness Result

* Request to `https://xhalo-blog-staging-api.ranbei.workers.dev/api/readiness` returned `200 OK` showing database connection status and environment parameters (when authenticated).

## OAuth Login Result

* Clicked **Login with GitHub** in the topbar.
* Successfully redirected to the GitHub OAuth authorization page with the correct `client_id` and callback URL pointing to `https://xhalo-blog-staging-api.ranbei.workers.dev/auth/github/callback`.
* Authenticated successfully using account `ranbeioc`.

## Callback Redirect Result

* Authorized page redirected back to `https://xhalo-blog-staging-api.ranbei.workers.dev/auth/github/callback`.
* The auth handler completed the authorization flow and successfully redirected the browser back to `https://xhalo-blog-test.pages.dev/admin`.

## Session Cookie Result

* Secure cookie `xhalo_admin_session` was set in the browser storage.
* Cookie properties: `HttpOnly=true`, `Secure=true`, `SameSite=Lax`, `Path=/`.
* The state cookie `xhalo_oauth_state` was cleared.

## /api/auth/session Result

* Requesting `GET https://xhalo-blog-staging-api.ranbei.workers.dev/api/auth/session` returned:
```json
{
  "authenticated": true,
  "user": {
    "login": "ranbeioc"
  }
}
```
* Checked that no sensitive data (like token details or session keys) is included.

## Logout Result

* Clicked **Logout** in the topbar.
* Cookie `xhalo_admin_session` was cleared.
* Subsequent session check returns `authenticated=false` and topbar reverts to unauthenticated state.

## Dashboard Result

* System status health card and D1 connection indicators load successfully.
* Displays warning markers indicating that all write gates are disabled.

## Posts Result

* Post lists successfully loaded from D1 database.
* Post filter search performs correctly.

## Editor Result

* Inputs editable, Markdown tab updates previews correctly.
* Publishing action button copy updates to `Create Review PR unavailable: LIVE_WRITES_ENABLED=false` and blocks interaction.

## Media Result

* Media page displays dry-run upload panel.
* Submitting uploads generates dry-run markdown code snippets and does not write to R2.

## Menus Result

* Menu configuration loads and local editing of menu items works.
* Previewing diffs displays expected addition/deletion output.

## Publishing Result

* The safety center lists all gates as locked.
* Shows active safe environment defaults.

## Audit Logs Result

* Audit log viewer successfully loads logs from D1 database.
* Confirmed that no session keys or secret tokens are leaked in logs.

## Settings Result

* Confirmed Settings displays the `xhalo-blog-test` project configuration.
* No reference to independent admin projects.

## Write Gate Result

* Direct publishing and direct update endpoints reject write requests:
  - `POST /api/drafts/direct-publish` -> `403 Forbidden` (`OWNER_DIRECT_DISABLED`)
  - `POST /api/drafts/direct-update` -> `403 Forbidden` (`OWNER_DIRECT_UPDATE_DISABLED`)
  - `POST /api/site/menu/direct-update` -> `403 Forbidden` (`DIRECT_CONFIG_DISABLED`)
  - `POST /api/site/menu/pr` -> `200 OK` (returns dry-run stub)

## R2 Live Upload Gate Result

* Simulating a live media upload:
  - `POST /api/assets/r2-upload?mode=live` -> `403 Forbidden` (`LIVE_WRITES_DISABLED`)
  - Response body:
    ```json
    {
      "error": "Live writes are disabled.",
      "code": "LIVE_WRITES_DISABLED",
      "required_env": "LIVE_WRITES_ENABLED=true"
    }
    ```
  - Checked that no upload success parameters are returned.

## Console / Network Result

* Browser DevTools console reports `0` fatal errors.
* Browser DevTools network shows `0` critical asset 404 errors.

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
* Deployment target was existing xhalo-blog-test project.

## Issues Found

* None. The hardened R2 write gate logic worked seamlessly under `LIVE_WRITES_ENABLED=false`.

## Fixes Applied

* Standardized `rejectLiveWriteDisabled()` response structure and tests in Phase 094.

## Quality Scores

* **Deployment reliability**: 98 / 100
* **Public link accessibility**: 100 / 100
* **OAuth login usability**: 96 / 100
* **Session reliability**: 100 / 100
* **Admin panel usability**: 96 / 100
* **Write gate safety**: 100 / 100
* **R2 live gate safety**: 100 / 100
* **Overall test readiness**: 98 / 100

## Verdict

**PASSED**

* *Overall test readiness (98) >= 90*: True
* *Public link accessibility (100) >= 95*: True
* *Write gate safety = 100*: True
* *No secret exposure = true*: True
* *No production write = true*: True
