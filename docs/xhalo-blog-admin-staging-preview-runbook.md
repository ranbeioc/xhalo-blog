# xhalo-blog Admin — Staging Preview Runbook

> Step-by-step guide to setting up and validating a staging preview deployment of the in-project admin console.

## 1. Configure the Cloudflare Pages Project

The admin UI is deployed as part of the `xhalo-blog` Cloudflare Pages project. Serving the admin under `/admin` is preferred to avoid cross-origin CORS and cookie issues.

1. Open the [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages).
2. Click on your `xhalo-blog` project.
3. Configure the build settings to compile the admin UI as a subdirectory (or configure routes to serve it under `/admin`):

| Setting          | Value                                |
| ---------------- | ------------------------------------ |
| Project name     | `xhalo-blog`                         |
| Build command    | `node apps/admin/scripts/build.mjs`  |
| Output directory | `apps/admin/dist`                    |
| Public route path  | `/admin`                             |

## 2. Configure Environment Variables

Navigate to **Settings → Environment variables** for the `xhalo-blog` project and add/verify:

| Variable                     | Environment | Value                                              |
| ---------------------------- | ----------- | -------------------------------------------------- |
| `XHALO_ADMIN_API_BASE_URL`  | Preview     | `https://xhalo-blog-api-staging.<account>.workers.dev` |
| `XHALO_ADMIN_API_BASE_URL`  | Production  | `https://xhalo-blog-api.<account>.workers.dev`         |
| `ADMIN_AUTH_BASE_URL`        | Preview     | `https://xhalo-blog-api-staging.<account>.workers.dev` |
| `ADMIN_FRONTEND_BASE_URL`    | Preview     | `https://<preview-id>.xhalo-blog.pages.dev`        |
| `ADMIN_FRONTEND_PATH`        | Preview     | `/admin`                                           |

> [!NOTE]
> The build script replaces `__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__` in `config.js` with the value of `XHALO_ADMIN_API_BASE_URL`.
> The post-login redirect directs users back to `ADMIN_FRONTEND_BASE_URL + ADMIN_FRONTEND_PATH`.

## 3. Set Up GitHub OAuth Callback

The admin UI authenticates via GitHub OAuth. The OAuth app's callback URL must point to the API Worker auth callback endpoint:

```
https://xhalo-blog-api-staging.<account>.workers.dev/auth/github/callback
```

On successful authentication, the API Worker sets the session cookie and redirects the browser back to:

```
https://<preview-id>.xhalo-blog.pages.dev/admin
```

## 4. Trigger a Preview Deploy

Push a commit or open a pull request against the connected branch. Cloudflare Pages will build and deploy a preview automatically. Note the preview URL from the Cloudflare dashboard or the GitHub commit status check.

## 5. Dry-Run Validation

Open the staging preview URL `/admin` path in a browser and verify the following:

### Authentication & Topbar
- [ ] Topbar displays a visible "Login with GitHub" button when unauthenticated.
- [ ] Topbar shows warning text: `⚠️ All write actions are disabled by default`.
- [ ] Clicking "Login with GitHub" redirects to GitHub OAuth authorize page.
- [ ] Successful authorization redirects back to `/admin` and updates topbar to show the GitHub login name and avatar.
- [ ] Logging out deletes the session cookie and updates the topbar back to the unauthenticated state.

### Sidebar & Navigation
- [ ] The sidebar renders with all 8 route links (Dashboard, Posts, Editor, Media, Menus, Publishing, Audit Logs, Settings).
- [ ] Clicking each sidebar link loads the corresponding panel in the content area.
- [ ] The URL hash updates to match the selected route.

### Panel Loading (Logged In)
- [ ] **Dashboard** — displays system health and readiness information.
- [ ] **Posts** — shows a post list (may be empty) with a search input.
- [ ] **Editor** — renders tab navigation (Edit, Preview, Diff, Plan).
- [ ] **Media** — shows the dry-run upload form; no actual uploads occur.
- [ ] **Menus** — displays menu items with add/delete controls.
- [ ] **Publishing** — shows the safety center gate status matrix.
- [ ] **Audit Logs** — renders the log table (may be empty if no entries exist).
- [ ] **Settings** — shows deployment boundary and build configuration info.
- [ ] **Settings Debug Section** — collapsed Advanced / Debug legacy secret fallback panel is visible.

### Write-Action Gates
- [ ] All **Direct Publish** buttons are visibly disabled.
- [ ] All **Direct Update** buttons are visibly disabled.
- [ ] All **Direct Config Update** buttons are visibly disabled.
- [ ] Clicking a disabled button does **not** trigger an API request (verify in the browser Network tab).

### Console & Network
- [ ] No 404 errors in the Network tab for any static assets.
- [ ] No uncaught JavaScript errors in the browser console.

> [!IMPORTANT]
> Do not proceed to production deployment until every item above passes.
