# Phase 101 - Test Direct Publish E2E Evidence

## Environment

| Item | Result |
| --- | --- |
| Test site | `https://xhalo-blog-test.pages.dev/` |
| Admin | `https://xhalo-blog-test.pages.dev/admin` |
| Article target | `https://xhalo-blog-test.pages.dev/posts/xhalo-blog-first-test-post/` |
| Pages project | `xhalo-blog-test` |
| Pages source | `ranbeioc/xhalo-blog-test@main` |
| Pages build command | `npm ci && npm run build` |
| Pages output | `public` |
| Latest Pages production deployment | `2902b284-f34e-40da-baef-79b75abb3c2b` |
| Latest Pages production status | `success` |
| Latest Pages production commit | `9ebaff36ccb7b16b8acfac8304782cf610213a34` |

## Admin Login Result

Blocked for this automated run. The live Admin requires a real GitHub OAuth browser session. The agent did not have an authenticated browser session, and no live session cookie was forged.

Status code for unauthenticated session probe:

```text
GET /api/auth/session -> 200
authenticated=false
```

## Session/Admin Role Result

D1 readiness was verified through read-only Cloudflare API checks:

```text
admin_users table: exists
admin user count: 1
```

The live browser session was not authenticated in this run, so `user.isAdmin=true` could not be observed from `/api/auth/session`.

## Test Direct Publish Config

Read-only Worker binding verification:

| Variable | Result |
| --- | --- |
| `DEPLOYMENT_ENV` | `test` |
| `PUBLISH_MODE` | `test_direct` |
| `TEST_DIRECT_PUBLISH_ENABLED` | `true` |
| `GITHUB_OWNER` | `ranbeioc` |
| `GITHUB_REPO` | `xhalo-blog-test` |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_OAUTH_ALLOWED_LOGINS` | `ranbeioc` |
| `LIVE_WRITES_ENABLED` | `false` |

## Target Repository and Branch

Target repository and branch for the approved test-only direct publish path:

```text
ranbeioc/xhalo-blog-test@main
```

The target source file expected by the API does not currently exist:

```text
source/_posts/xhalo-blog-first-test-post.md: missing
```

## Publish to Test UI Result

Blocked for this automated run because no live authenticated GitHub OAuth Admin session was available. The Admin route itself is reachable:

```text
GET /admin -> 200 after redirect to /admin/
```

## API Publish Result

Unauthenticated live API probe:

```text
POST /api/drafts/test-direct-publish -> 401
```

This is the expected gate behavior without a real GitHub OAuth admin session. No publish write was attempted with a forged session.

## Commit Result

No test-direct publish commit was created in this run.

Required blocker code:

```text
E2E_BLOCKED_LIVE_OAUTH_SESSION_REQUIRED
```

## Cloudflare Pages Rebuild Result

No new Pages rebuild was triggered by test-direct publish in this run because the authenticated publish step was blocked.

Latest observed production deployment remains:

```text
2902b284-f34e-40da-baef-79b75abb3c2b
```

## Home Page Result

Live home page check:

```text
GET https://xhalo-blog-test.pages.dev/ -> 200
```

The home page did not contain `xHalo Blog 测试文章` during this run.

## Article Page Result

Live article URL check:

```text
GET https://xhalo-blog-test.pages.dev/posts/xhalo-blog-first-test-post/ -> 200
```

The page contains `xHalo Blog 测试文章`, but the returned HTML shape matches the older hand-written Phase 097 static article page rather than a NexT-rendered article page. This is inconsistent with the current private repository source, where `source/_posts/xhalo-blog-first-test-post.md` is missing.

## Write Gate Negative Tests

Local automated tests cover:

- `ranbeioc/xhalo-blog-test@main` is accepted as a test-safe target when all test gates and admin session requirements are met.
- `ranbeioc/hexo-blog@main` is rejected with `PRODUCTION_BRANCH_FORBIDDEN`.
- Non-admin or missing session is rejected.
- Non-test deployment environment is rejected.
- `TEST_DIRECT_PUBLISH_ENABLED=false` is rejected.
- Production UI does not expose an enabled `Publish to Test` control.

Live unauthenticated API probe confirms the session gate returns `401`.

## No Production Write Confirmation

No ranbeioc/hexo-blog@main mutation occurred.
No production direct publish occurred.
No production direct update occurred.
No production R2 live upload occurred.
No production menu config write occurred.
No xhalo-admin project was modified.
No xhalo-blog-admin project was created.
No secrets were logged or committed.

## Issues Found

- `E2E_BLOCKED_LIVE_OAUTH_SESSION_REQUIRED`: the automated run did not have a real GitHub OAuth Admin session cookie, and the session was not forged.
- `ARTICLE_ROUTE_SOURCE_MISMATCH`: `/posts/xhalo-blog-first-test-post/` returns a legacy static page even though `source/_posts/xhalo-blog-first-test-post.md` is missing from `ranbeioc/xhalo-blog-test@main`.
- `HOME_PAGE_NOT_UPDATED`: the home page does not show `xHalo Blog 测试文章`.

## Fixes Applied

No live fixes were applied in this phase. The safe next action is an owner-assisted browser login, then one real `Publish to Test` click from Admin.

## Validation

- `npm run check:all`
- `npm run check:secrets`
- `npm test`
- `npm run test:secrets-fixture`
- `npm run build:admin`
- `npm run build:test-pages`
- `npm test -- tests/phase101-test-direct-publish-e2e.test.mjs`
- `npm test -- tests/test-direct-publish-gate.test.mjs`
- `npm test -- tests/publish-to-test-ui.test.mjs`

## Verdict

Blocked, not passed. Phase 101 preflight gates are correctly configured for test-only direct publish, but the live E2E publish cannot be completed without a real authenticated GitHub OAuth Admin session. No production write occurred.
