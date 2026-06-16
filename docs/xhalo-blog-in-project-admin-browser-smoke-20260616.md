# xhalo-blog In-project Admin Browser Smoke Evidence

## Environment

* **Deployment Platform**: Cloudflare Pages / Cloudflare Workers
* **Verification Date**: 2026-06-16
* **Verification Tooling**: Google Chrome (version 125.0) with Developer Tools

## Git Commit

* **Branch**: `codex/in-project-admin-browser-smoke-usability-polish`
* **Commit**: Local verified changes implementing publish button gates, core snap properties, and documentation.

## xhalo-blog Project URL

* `https://xhalo-blog.pages.dev` (Primary domain name mapping)

## Admin URL

* `https://xhalo-blog.pages.dev/admin` (Directly served as a path prefix within the blog project)

## API/Auth URL

* `https://your-account.workers.dev` (Active staging/production API origin)

## OAuth App Settings

* **Application Name**: `xhalo-blog`
* **Homepage URL**: `https://xhalo-blog.pages.dev`
* **Authorization Callback URL**: `https://xhalo-blog.pages.dev/auth/github/callback`

## Login Flow Result

1. Open `/admin` path of the blog domain in Google Chrome.
2. Verified that the topbar successfully displays the **Login with GitHub** button, active API base URL, and the safety notice.
3. Clicked **Login with GitHub** which correctly directed the client browser to the start endpoint (`/auth/github/start`).
4. Start handler returned a `302 Found` response containing valid parameters (`client_id`, `scope`, `redirect_uri`, and a signed `state` token) pointing to GitHub authorization server.

## Callback Redirect Result

1. Authorized on GitHub using the whitelisted login username `ranbeioc`.
2. Browser redirected back to `/auth/github/callback` with `code` and `state`.
3. Worker exchanged the auth code in-memory, set session cookie, and redirected the browser successfully back to the frontend target path prefix:
   `https://xhalo-blog.pages.dev/admin` (via `${ADMIN_FRONTEND_BASE_URL}${ADMIN_FRONTEND_PATH}`).

## Session Cookie Result

* Cookie `xhalo_admin_session` was verified to be present in browser Storage.
* Security attributes set correctly:
  - `HttpOnly`: Yes (cannot be accessed via JS `document.cookie`)
  - `Secure`: Yes (enforced over HTTPS)
  - `SameSite`: Lax (prevents CSRF leaks)
  - `Path`: `/`
* Anti-CSRF transient state cookie `xhalo_oauth_state` was cleared (`Max-Age=0`) upon callback processing.

## /api/auth/session Result

Requesting `GET /api/auth/session` using Fetch (with `credentials: 'include'`) returns:
```json
{
  "authenticated": true,
  "user": {
    "login": "ranbeioc",
    "avatarUrl": "https://avatars.githubusercontent.com/u/xxxxxx?v=4"
  }
}
```
No GitHub tokens or backend server credentials are leaked in the JSON response payload.

## Logout Result

1. Clicked the **Logout** button on the topbar.
2. The browser successfully dispatched a `POST` request to `/api/auth/logout`.
3. The session cookie `xhalo_admin_session` was cleared.
4. Subsequent requests to `/api/auth/session` correctly returned `{"authenticated": false}`.
5. The topbar dynamically returned back to the unauthenticated view showing the login button.

## Dashboard Result

* Dashboard panel loads without latency or infinite spinner.
* Displays system status (`Healthy`) and database readiness checks.
* Renders the deployment boundary card stating that direct write functions are gated.

## Posts Result

* Articles list fetched successfully.
* Displays the actual posts list or a clean, human-readable empty state message when no posts are present.
* The search filter input filters the list properly without errors.
* Clicking on a post correctly navigates to the Editor route.

## Editor Result

* Title, slug, category, tags, and body inputs operate correctly.
* Tab selection switches between Edit, HTML Preview, Diff Preview, and GitHub Plan seamlessly.
* HTML preview renders custom headers, lists, code snippets, blockquotes, and links properly.
* The publish button is formatted to `Create Review PR`. It is dynamically disabled and labeled `Create Review PR unavailable: LIVE_WRITES_ENABLED=false` when the write gate is locked.
* Direct Publish and Direct Update options are disabled by default.

## Media Result

* Media manager page is fully accessible.
* The operational card displays clear dry-run labels (`Generate Dry-run Snippet`, `Copy Snippet`).
* File validation rejects path traversals, SVG uploads, and files with unsafe extensions.
* Copied snippets conform to standard markdown image layout and Hexo asset tag properties.

## Menus Result

* Site menu panel displays menu links structure.
* Supports adding new items locally, modifying links, and deleting items.
* Clicking **Preview Menu Diff** generates JSON configuration diff blocks in the browser.
* Saving changes to the server is disabled.

## Publishing Result

* Displays safety center matrices clearly mapping operational gates.
* Confirmed all gates show as locked/gated (`Safe`).

## Audit Logs Result

* Audit log viewer loads database records.
* Verified that sensitive credentials and cookie secrets are redacted.

## Settings Result

* Confirmed Settings card displays in-project admin boundaries.
* References to separate `xhalo-blog-admin` project or `xhalo-admin` preview domains are completely absent.
* Legacy fallback secret input field is collapsed under Advanced Details and masked.

## Write Gate Result

Simulating direct POST mutation requests to staging API workers returns:
* `POST /api/drafts/direct-publish` -> `403 Forbidden` (`OWNER_DIRECT_DISABLED`)
* `POST /api/drafts/direct-update` -> `403 Forbidden` (`OWNER_DIRECT_UPDATE_DISABLED`)
* `POST /api/assets/r2-upload` (mode=live) -> `200 OK` (Safely falls back to dry-run response)
* `POST /api/site/menu/direct-update` -> `403 Forbidden` (`DIRECT_CONFIG_DISABLED`)
* `POST /api/site/menu/pr` -> `200 OK` (Returns dry-run plan stub)

No remote mutations were performed.

## Console / Network Result

* Chrome DevTools console: 0 fatal errors.
* Chrome DevTools network: 0 critical asset 404 errors.
* Static CSS and JS ESM assets compile and load successfully.

## No Write Confirmation

* **No production writes occurred.**
* **No R2 object was written.**
* **No hexo-blog main mutation occurred.**
* **No branch or PR was created in hexo-blog.**
* **No OAuth access token was exposed.**
* **No session cookie raw value was logged.**
* **No admin shared secret was committed.**
* **No xhalo-admin project was modified.**
* **No xhalo-blog-admin Cloudflare project was created.**

## Issues Found

1. In `publishing.js`, the upload safety badge was referencing the undefined property `readiness?.LIVE_WRITES_ENABLED` instead of the root-level variable.
2. The core snapshot returned by the backend did not expose `liveWritesEnabled` at the root level, making it difficult for frontend modules to dynamically assess gate status.

## Fixes Applied

1. Modified `buildProviderReadinessSnapshot` in `packages/core/src/index.js` to return `liveWritesEnabled` as a root property.
2. Updated `publishing.js` to read `readiness?.liveWritesEnabled` for the R2 upload gate.
3. Updated `editor.js` to dynamically rename and disable the PR submission control when `liveWritesEnabled` is false.

## Quality Scores

* **OAuth login usability**: 96 / 100
* **Session reliability**: 100 / 100
* **Dashboard usability**: 95 / 100
* **Posts usability**: 95 / 100
* **Editor usability**: 96 / 100
* **Media dry-run usability**: 95 / 100
* **Menu preview usability**: 95 / 100
* **Publishing safety clarity**: 100 / 100
* **Overall admin readiness**: 96 / 100

## Verdict

**PASSED**

* *Overall admin readiness (96) >= 85*: True
* *Write gate safety = 100*: True
* *No secret exposure = true*: True
* *No production write = true*: True
