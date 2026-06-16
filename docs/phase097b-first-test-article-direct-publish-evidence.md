# Phase 097-B - First Test Article Direct Publish Evidence

## Scope

Phase 097-B adds a test-only direct publish path for the first test article. This is independent from owner direct production publish.

Endpoint:

```text
POST /api/drafts/test-direct-publish
```

## First Test Article

| Field | Value |
| --- | --- |
| Title | `xHalo Blog 测试文章` |
| Slug | `xhalo-blog-first-test-post` |
| Category | `Test` |
| Tags | `xhalo-blog`, `test`, `Cloudflare` |

## Required Gate

All of these conditions must be true before the endpoint writes:

- `DEPLOYMENT_ENV=test`
- `PUBLISH_MODE=test_direct`
- `TEST_DIRECT_PUBLISH_ENABLED=true`
- GitHub OAuth session is authenticated
- session user has `role=admin` and `isAdmin=true`
- target is not `ranbeioc/hexo-blog@main`

Allowed test targets:

- Preferred: `ranbeioc/xhalo-blog-test@main`
- Fallback: `ranbeioc/hexo-blog@xhalo-blog-test-content`

Forbidden target:

- `ranbeioc/hexo-blog@main`

## First Login Admin

The first successful GitHub OAuth login can bootstrap an admin only when:

- `DEPLOYMENT_ENV=test`, or
- `FIRST_GITHUB_LOGIN_ADMIN_ENABLED=true`

The admin record is stored in D1 table `admin_users`. Production does not auto-bootstrap a first admin unless explicitly enabled.

Session payload and `/api/auth/session` include:

- `user.role`
- `user.isAdmin`

## UI Behavior

The Admin Editor displays `Publish to Test` only as an enabled action when readiness reports:

- `deploymentEnv === "test"`
- `publishMode === "test_direct"`
- `testDirectPublishEnabled === true`
- `testDirectTargetSafe === true`

Otherwise the button is disabled with the active reason.

## Production Boundary

This phase does not approve production writes. No production direct publish, production direct update, R2 live upload, queue live-write task, `hexo-blog/main` mutation, auto-merge, or release publication is approved by this evidence document.

## Verification Commands

```bash
npm test -- tests/admin-bootstrap.test.mjs
npm test -- tests/test-direct-publish-gate.test.mjs
npm test -- tests/first-test-article-template.test.mjs
npm test -- tests/publish-to-test-ui.test.mjs
```
