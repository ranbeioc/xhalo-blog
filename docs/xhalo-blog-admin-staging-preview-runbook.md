# xhalo-blog Admin — Staging Preview Runbook

> Step-by-step guide to setting up and validating a staging preview deployment.

## 1. Create the Cloudflare Pages Project

1. Open the [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages).
2. Click **Create a project** → **Connect to Git**.
3. Select the `ranbeioc/xhalo-blog` repository.
4. Configure the build settings:

| Setting          | Value                                |
| ---------------- | ------------------------------------ |
| Project name     | `xhalo-blog-admin`                   |
| Build command    | `node apps/admin/scripts/build.mjs`  |
| Output directory | `apps/admin/dist`                    |

5. Save and deploy.

## 2. Configure Environment Variables

Navigate to **Settings → Environment variables** for the `xhalo-blog-admin` project and add:

| Variable                     | Environment | Value                                              |
| ---------------------------- | ----------- | -------------------------------------------------- |
| `XHALO_ADMIN_API_BASE_URL`  | Preview     | `https://xhalo-blog-api-staging.<account>.workers.dev` |
| `XHALO_ADMIN_API_BASE_URL`  | Production  | `https://xhalo-blog-api.<account>.workers.dev`         |

> [!NOTE]
> The build script replaces `__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__` in `config.js`
> with the value of this variable. Verify the replacement by inspecting the built
> `config.js` in the output directory after a deploy.

## 3. Set Up GitHub OAuth Callback

The admin UI authenticates via GitHub OAuth. The OAuth app's callback URL must include the staging preview domain.

1. Go to **GitHub → Settings → Developer settings → OAuth Apps**.
2. Open (or create) the OAuth app used by the admin UI.
3. Add the staging preview URL as an **authorized callback URL**:

```
https://<hash>.xhalo-blog-admin.pages.dev/callback
```

> [!TIP]
> For preview deployments the hash changes on every commit. If your OAuth app supports
> wildcard subdomains, use `https://*.xhalo-blog-admin.pages.dev/callback`. Otherwise,
> update the callback URL after each deploy or use a stable custom domain alias.

## 4. Trigger a Preview Deploy

Push a commit or open a pull request against the connected branch. Cloudflare Pages will build and deploy a preview automatically. Note the preview URL from the Cloudflare dashboard or the GitHub commit status check.

## 5. Dry-Run Validation

Open the staging preview URL in a browser and verify the following:

### Sidebar & Navigation

- [ ] The sidebar renders with all 8 route links (Dashboard, Posts, Editor, Media, Menus, Publishing, Audit Logs, Settings).
- [ ] Clicking each sidebar link loads the corresponding panel in the content area.
- [ ] The URL hash updates to match the selected route.

### Panel Loading

- [ ] **Dashboard** — displays system health and readiness information.
- [ ] **Posts** — shows a post list (may be empty) with a search input.
- [ ] **Editor** — renders tab navigation (Edit, Preview, Diff, Plan).
- [ ] **Media** — shows the dry-run upload form; no actual uploads occur.
- [ ] **Menus** — displays menu items with add/delete controls.
- [ ] **Publishing** — shows the safety center gate status matrix.
- [ ] **Audit Logs** — renders the log table (may be empty if no entries exist).
- [ ] **Settings** — shows deployment boundary and build configuration info.

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
