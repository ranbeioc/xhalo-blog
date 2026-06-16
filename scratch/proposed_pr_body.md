## Summary

Implement Phase 097 as a test-only release candidate step: compose `xhalo-blog-test` as a full Cloudflare Pages site, add first-login GitHub admin bootstrap for test/staging, add a separate first-article test direct publish endpoint, and prepare the alpha tag to be recreated after merge.

## Key Changes

- Add `npm run build:test-pages` via `scripts/build-test-pages.mjs`, outputting `dist/pages`.
- Generate the test blog home, `/admin`, first test article page, static assets, and a Pages `_worker.js` proxy for `/api/*` and `/auth/*`.
- Add D1 migration `0006_create_admin_users.sql` for persistent admin identity.
- Allow the first successful GitHub OAuth login to bootstrap admin only in `DEPLOYMENT_ENV=test` or with `FIRST_GITHUB_LOGIN_ADMIN_ENABLED=true`.
- Return `user.role` and `user.isAdmin` from `/api/auth/session`.
- Add `POST /api/drafts/test-direct-publish`, gated by `DEPLOYMENT_ENV=test`, `PUBLISH_MODE=test_direct`, `TEST_DIRECT_PUBLISH_ENABLED=true`, GitHub admin session, and safe target checks.
- Add Admin Editor `Publish to Test` control and first test article template.
- Add Phase 097-A and Phase 097-B evidence docs.

## Test Article

| Field | Value |
|---|---|
| Title | `xHalo Blog 测试文章` |
| Slug | `xhalo-blog-first-test-post` |
| Category | `Test` |
| Tags | `xhalo-blog`, `test`, `Cloudflare` |

## Deployment Boundary

- `xhalo-blog-test` Pages build command: `npm run build:test-pages`
- Output directory: `dist/pages`
- Pages serves blog HTML, `/admin`, and normal static assets.
- R2 remains media/attachment assets only, not whole-site hosting.
- Preferred test direct target: `ranbeioc/xhalo-blog-test@main`
- Fallback test direct target: `ranbeioc/hexo-blog@xhalo-blog-test-content`
- Forbidden target: `ranbeioc/hexo-blog@main`

## Safety

- [x] No production writes
- [x] No production direct publish
- [x] No production direct update
- [x] No R2 live upload approval
- [x] No `hexo-blog/main` mutation
- [x] No auto-merge
- [x] No release publication
- [x] No secrets committed

## Validation

- [x] `npm ci`
- [x] `npm run check:all`
- [x] `npm run check:secrets`
- [x] `npm test`
- [x] `npm run test:secrets-fixture`
- [x] `npm run build:admin`
- [x] `npm run build:test-pages`
- [x] `npm test -- tests/pages-compose-build.test.mjs`
- [x] `npm test -- tests/r2-boundary.test.mjs`
- [x] `npm test -- tests/admin-bootstrap.test.mjs`
- [x] `npm test -- tests/test-direct-publish-gate.test.mjs`
- [x] `npm test -- tests/first-test-article-template.test.mjs`
- [x] `npm test -- tests/publish-to-test-ui.test.mjs`

## Tag Follow-up

After this PR is merged and final `origin/main` is validated:

- delete old local `v0.1.0-alpha.1`
- delete old remote `v0.1.0-alpha.1`
- recreate `v0.1.0-alpha.1` on the latest `origin/main`
- push the tag
- check the draft release target, but do not publish the release
