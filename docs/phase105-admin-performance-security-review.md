# Phase 105 Admin Performance And Security Review

## Summary

Phase 105 focuses on the live admin first-load bottleneck and a practical security review across the open-source framework repository, the private test-site repository, and the Cloudflare deployment surfaces.

The implementation remains within the existing safety boundary:

- `ranbeioc/xhalo-blog` stays the open-source framework source.
- `ranbeioc/xhalo-blog-test` stays the private real-content test site.
- `ranbeioc/hexo-blog@main` remains read-only.
- Production direct writes and production R2 live upload remain disabled.

## Performance Fixes

- The Admin shell now statically imports only the minimum startup modules: auth, UI, and i18n.
- Route panels are lazy-loaded with dynamic imports, so editor, media, menu, audit, integration, configuration, and publishing modules are not part of the initial module graph.
- The authenticated Admin boot path no longer waits for dashboard API data before rendering the application frame.
- Dashboard read-only stats and audit summary calls have short client-side timeouts so a GitHub source scan cannot block the first page indefinitely.
- The `/api/blog/stats` Worker route now uses a short in-instance read-only cache with a default 60 second TTL and a hard maximum of 5 minutes.
- GitHub source post scanning now reads Markdown files with bounded concurrency instead of sequential per-file requests.

## Security Fixes

- `/api/integrations/status` is now included in the protected Admin route set.
- The integrations status route continues to return only redacted booleans such as `tokenConfigured` and `oauthConfigured`.
- `npm audit --omit=dev` reports 0 production dependency vulnerabilities in the open-source framework workspace.
- Existing write gates remain unchanged:
  - test direct publish requires `DEPLOYMENT_ENV=test`, `PUBLISH_MODE=test_direct`, `TEST_DIRECT_PUBLISH_ENABLED=true`, and an admin session.
  - menu test direct update continues to reject production content targets.
  - `ranbeioc/hexo-blog@main` remains forbidden.
  - production R2 live upload remains disabled.

## Cloudflare Surfaces Reviewed

- `xhalo-blog-landing`: public landing page for `blog.xhalo.co`.
- `xhalo-blog-test`: private test-site Pages project for `xhalo-blog-test.pages.dev`.
- `xhalo-blog-staging-api`: staging API Worker used by the test-site Admin proxy.
- `xhalo-blog-production-api` and production queue remain out of scope for writes in this phase.

## Validation Commands

- `node --check apps/admin/src/app.js`
- `node --check apps/admin/src/modules/dashboard.js`
- `node --check workers/api/src/index.js`
- `node --test tests/admin-ui-smoke.test.mjs tests/admin-auth-media-menu.test.mjs tests/phase103-worker-ops.test.mjs tests/phase103-admin-ux-i18n.test.mjs`
- `npm run check:all`
- `npm run check:secrets`
- `npm test`
- `npm run test:secrets-fixture`
- `npm run build:admin`
- `npm run build:landing`

## Live Verification Targets

- `https://blog.xhalo.co/`
- `https://xhalo-blog-test.pages.dev/`
- `https://xhalo-blog-test.pages.dev/landing/`
- `https://xhalo-blog-test.pages.dev/admin/`
- `https://xhalo-blog-test.pages.dev/admin/app.js`
- `https://xhalo-blog-test.pages.dev/admin/modules/editor.js`
- `https://xhalo-blog-test.pages.dev/api/auth/session`
- `xhalo-blog-staging-api` `/api/health` live Worker route

## Acceptance

- Admin first-load no longer downloads all route modules from `app.js`.
- Authenticated Admin first render no longer waits for full dashboard data before drawing the layout.
- Blog stats route reports `x-xhalo-cache: blog-stats-hit` on repeated reads within the TTL.
- Integrations status returns `401` without Admin authorization.
- Landing and test-site deployment routes remain live.
- No production write, tag rewrite, release publish, `hexo-blog@main` write, or secret commit occurs.
