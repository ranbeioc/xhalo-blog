# xhalo-blog Admin - Deployment Boundary

> Defines the deployment boundary for the in-project xhalo-blog admin UI.

## Project location

The admin UI source lives in `apps/admin/` inside `ranbeioc/xhalo-blog`.

- Main source repository: `ranbeioc/xhalo-blog`
- Content / production blog repository: `ranbeioc/hexo-blog`
- Global admin project: `ranbeioc/xhalo-admin` (not used for xhalo-blog admin)

The admin must remain inside `ranbeioc/xhalo-blog/apps/admin`.

## Real test deployment target

The current real test deployment target is the existing Cloudflare Pages project `xhalo-blog-test`.

Current owner-verified test links:

- Home: `https://xhalo-blog-test.pages.dev/`
- Admin: `https://xhalo-blog-test.pages.dev/admin`

Owner-reported result:

- GitHub account can authorize and log in successfully.

## Cloudflare Pages boundary

| Property | Value |
| --- | --- |
| Pages project name | `xhalo-blog-test` |
| Build command | `node apps/admin/scripts/build.mjs` |
| Output directory | `apps/admin/dist` |
| Public route path | `/admin` |

> [!IMPORTANT]
> The Admin UI is built from `apps/admin` and served as part of the `xhalo-blog` project boundary.
> No separate Cloudflare Pages project is required for the blog admin.
> `xhalo-blog-admin` does not exist and is not needed.
> `xhalo-admin` is not the blog admin target.

## Cloudflare deployment map

| Project | Type | Purpose | Current phase status | Write permission |
| --- | --- | --- | --- | --- |
| `xhalo-blog-test` | Cloudflare Pages | Test site and `/admin` UI | Active test target | No production write |
| `xhalo-blog-staging-api` | Worker | Staging API/Auth | Staging only | No production write |
| `xhalo-blog-staging-queue` | Queue Worker | Staging async tasks | Staging only | No production write |
| `xhalo-blog-production-api` | Worker | Production API/Auth | Approval gate only | Read-only only |
| `xhalo-blog-production-queue` | Queue Worker | Production async tasks | Approval gate only | No live-write |

## Environment boundary

The real test deployment is expected to use:

- `ADMIN_FRONTEND_BASE_URL=https://xhalo-blog-test.pages.dev`
- `ADMIN_FRONTEND_PATH=/admin`
- `ADMIN_AUTH_BASE_URL=https://<staging-api-domain>`

## Production preview gate

In the current phase:

- `xhalo-blog-production-api` is approval-gate only
- `xhalo-blog-production-queue` is approval-gate only
- no production direct publish is approved
- no production direct update is approved
- no production R2 live upload is approved
- no production menu config write is approved
- no production queue live-write task is approved
- no `hexo-blog/main` mutation is approved

Any future production preview must stay within read-only, dry-run, and auth-check scope until explicit owner approval is recorded.
