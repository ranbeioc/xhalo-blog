# xhalo-blog Admin - Staging Preview Runbook

> Step-by-step guide to setting up and validating the current real test deployment for the in-project admin console.

## 1. Current real test target

The admin UI is deployed as part of the `xhalo-blog` project boundary and is currently verified through the existing Cloudflare Pages project `xhalo-blog-test`.

> [!IMPORTANT]
> Admin is served inside the `xhalo-blog` project under `/admin`.
> No separate `xhalo-blog-admin` project is required.
> `xhalo-admin` is not used for the xhalo-blog admin.
> The current real test deployment target is `xhalo-blog-test`.

Current owner-verified public test links:

- Home: `https://xhalo-blog-test.pages.dev/`
- Admin: `https://xhalo-blog-test.pages.dev/admin`

Owner-reported verification status:

- GitHub account can authorize and log in successfully.

## 2. Configure the Cloudflare Pages project

Open the Cloudflare Pages dashboard and select the existing `xhalo-blog-test` project.

| Setting | Value |
| --- | --- |
| Project name | `xhalo-blog-test` |
| Build command | `node apps/admin/scripts/build.mjs` |
| Output directory | `apps/admin/dist` |
| Public route path | `/admin` |

## 3. Configure preview environment variables

Configure the admin preview against the staging API/Auth worker. Keep this environment non-mutating.

| Variable | Environment | Value |
| --- | --- | --- |
| `XHALO_ADMIN_API_BASE_URL` | Preview | `https://<staging-api-domain>` |
| `ADMIN_AUTH_BASE_URL` | Preview | `https://<staging-api-domain>` |
| `ADMIN_FRONTEND_BASE_URL` | Preview | `https://xhalo-blog-test.pages.dev` |
| `ADMIN_FRONTEND_PATH` | Preview | `/admin` |

> [!NOTE]
> The build script replaces `__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__` in `apps/admin/src/config.js`.
> Successful login redirects back to `ADMIN_FRONTEND_BASE_URL + ADMIN_FRONTEND_PATH`.

## 4. GitHub OAuth callback

The GitHub OAuth callback for the real test deployment must point to:

```text
https://<staging-api-domain>/auth/github/callback
```

After successful authentication, the API worker redirects the browser back to:

```text
https://xhalo-blog-test.pages.dev/admin
```

## 5. Real test validation checklist

Use the current real test links instead of placeholder preview URLs.

### Authentication and topbar

- [ ] `https://xhalo-blog-test.pages.dev/admin` opens successfully.
- [ ] Topbar displays **Login with GitHub** when unauthenticated.
- [ ] Clicking **Login with GitHub** redirects to the GitHub OAuth authorize page.
- [ ] Successful authorization returns to `https://xhalo-blog-test.pages.dev/admin`.
- [ ] Authenticated state shows the GitHub login name and avatar.
- [ ] Logout clears the session and returns the UI to the unauthenticated state.

### Admin panels

- [ ] Dashboard loads.
- [ ] Posts loads.
- [ ] Editor loads.
- [ ] Media remains dry-run only.
- [ ] Menus remains preview-only.
- [ ] Publishing shows the safety center and locked write gates.
- [ ] Audit Logs loads.
- [ ] Settings confirms the `xhalo-blog-test` configuration.

### Write-gate expectations

- [ ] Direct publish remains disabled.
- [ ] Direct update remains disabled.
- [ ] Direct config update remains disabled.
- [ ] Live R2 upload remains disabled.
- [ ] No production write action is enabled.

## 6. Production preview boundary

The production resources `xhalo-blog-production-api` and `xhalo-blog-production-queue` are not enabled for writes in this phase.

- `xhalo-blog-production-api`: approval gate only, read-only preview scope only
- `xhalo-blog-production-queue`: approval gate only, no live-write processing

Do not use this runbook to enable production direct publish, direct update, R2 live upload, menu direct update, queue live-write tasks, or `hexo-blog/main` mutation.
