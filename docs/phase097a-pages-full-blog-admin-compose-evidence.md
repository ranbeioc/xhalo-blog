# Phase 097-A - Pages Full Blog Admin Compose Evidence

## Scope

Phase 097-A changes the `xhalo-blog-test` frontend target from an Admin-only or R2-backed preview assumption into a full Cloudflare Pages test site.

## Cloudflare Pages Target

| Setting | Value |
| --- | --- |
| Project | `xhalo-blog-test` |
| GitHub source | `ranbeioc/xhalo-blog` |
| Branch | PR preview branch, then `main` after merge |
| Build command | `npm run build:test-pages` |
| Output directory | `dist/pages` |

Expected public routes:

- `https://xhalo-blog-test.pages.dev/`
- `https://xhalo-blog-test.pages.dev/admin`
- `https://xhalo-blog-test.pages.dev/posts/xhalo-blog-first-test-post/`

## Build Output

The `build:test-pages` script writes:

- `dist/pages/index.html`
- `dist/pages/admin/index.html`
- `dist/pages/posts/xhalo-blog-first-test-post/index.html`
- `dist/pages/assets/site.css`
- `dist/pages/_worker.js`

The Pages `_worker.js` only proxies `/api/*` and `/auth/*` to the configured staging API via `XHALO_ADMIN_API_BASE_URL`. It does not deploy a Worker and does not run `wrangler deploy`.

## R2 Boundary

R2 only retains media/attachment asset responsibilities.

R2 只保留为媒体/附件资产层，不作为整站托管层。Pages 承载博客 HTML、Admin 前端和普通静态资源。

Current R2 behavior remains dry-run unless a separate owner-approved asset-write window is opened.

## Write Boundary

Phase 097-A performs no production writes and does not approve:

- `hexo-blog/main` mutation
- production direct publish
- production direct update
- live R2 upload
- queue live-write task
- release publication

## Verification Commands

```bash
npm run build:test-pages
npm test -- tests/pages-compose-build.test.mjs
npm test -- tests/r2-boundary.test.mjs
```
