# xhalo-blog Admin - Deployment Boundary

> Defines the deployment boundary for the in-project xhalo-blog admin UI.

## Project location

The admin UI source lives in `apps/admin/` inside `ranbeioc/xhalo-blog`.

- Main source repository: `ranbeioc/xhalo-blog`
- Private test-site repository: `ranbeioc/xhalo-blog-test`
- Content / production blog repository: `ranbeioc/hexo-blog`
- Global admin project: `ranbeioc/xhalo-admin` (not used for xhalo-blog admin)

The reusable Admin source must remain inside `ranbeioc/xhalo-blog/apps/admin`. The built Admin static assets may be copied into the private `ranbeioc/xhalo-blog-test` test-site repository under `source/admin/` for same-domain Cloudflare Pages testing.

## Real test deployment target

The current real test deployment target is the existing Cloudflare Pages project `xhalo-blog-test`, now bound to private repository `ranbeioc/xhalo-blog-test@main`.

Current owner-verified test links:

- Home: `https://xhalo-blog-test.pages.dev/`
- Admin: `https://xhalo-blog-test.pages.dev/admin`
- Legacy landing page: `https://xhalo-blog-test.pages.dev/landing/`

Owner-reported result:

- GitHub account can authorize and log in successfully.

## Cloudflare Pages boundary

| Property | Value |
| --- | --- |
| Pages project name | `xhalo-blog-test` |
| GitHub source | `ranbeioc/xhalo-blog-test` |
| Branch | `main` |
| Build command | `npm ci && npm run build` |
| Output directory | `public` |
| Public route paths | `/`, `/landing/`, `/admin`, generated Hexo/NexT article paths |

> [!IMPORTANT]
> `ranbeioc/xhalo-blog` is the open-source framework source and must not receive real private posts, uploads, or production content.
> The real-content test site is `ranbeioc/xhalo-blog-test`.
> No separate Cloudflare Pages project is required for the blog admin.
> `xhalo-blog-admin` does not exist and is not needed.
> `xhalo-admin` is not the blog admin target.
> R2 is not the whole-site hosting layer for `xhalo-blog-test`; it remains media/attachment assets only.

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
- `DEPLOYMENT_ENV=test`
- `PUBLISH_MODE=test_direct`
- `TEST_DIRECT_PUBLISH_ENABLED=true` only during test publish verification
- `FIRST_GITHUB_LOGIN_ADMIN_ENABLED=true` only for test/staging bootstrap

## Phase 097 test publish boundary

- First successful GitHub OAuth login can bootstrap `admin_users` only in test/staging scope.
- `POST /api/drafts/test-direct-publish` requires GitHub admin session and the test_direct gate.
- Preferred target: `ranbeioc/xhalo-blog-test@main`.
- Fallback target: `ranbeioc/hexo-blog@xhalo-blog-test-content`.
- Forbidden target: `ranbeioc/hexo-blog@main`.

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
