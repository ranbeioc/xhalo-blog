# xhalo-blog Admin - UI Smoke Test

> Manual smoke test checklist for the in-project admin UI.

## Prerequisites

- The current real test deployment is available at:
  - `https://xhalo-blog-test.pages.dev/`
  - `https://xhalo-blog-test.pages.dev/admin`
- Admin is served inside the `xhalo-blog` project under `/admin`
- No separate `xhalo-blog-admin` project is required
- `xhalo-admin` is not used for the xhalo-blog admin
- GitHub OAuth credentials are configured for the real test domain
- A modern browser with DevTools is available

Owner-reported verification status:

- GitHub account can authorize and log in successfully.

## Checklist

### GitHub OAuth login and topbar

- [ ] `https://xhalo-blog-test.pages.dev/admin` opens successfully
- [ ] Topbar shows **Login with GitHub** when unauthenticated
- [ ] Clicking **Login with GitHub** redirects to the GitHub OAuth start endpoint
- [ ] Authorization returns to `/admin`
- [ ] Topbar shows the authenticated GitHub login and avatar
- [ ] `/api/auth/session` returns `authenticated=true`
- [ ] `/api/auth/session` returns `user.role=admin` and `user.isAdmin=true` after first-login bootstrap in test
- [ ] Clicking **Logout** returns `/api/auth/session` to `authenticated=false`

### Sidebar and routing

- [ ] Dashboard loads
- [ ] Posts loads
- [ ] Editor loads
- [ ] Media loads
- [ ] Menus loads
- [ ] Publishing loads
- [ ] Audit Logs loads
- [ ] Settings loads

### Panel checks

- [ ] Dashboard shows health and readiness
- [ ] Posts shows a list or empty state
- [ ] Editor shows Edit, Preview, Diff, and Plan tabs
- [ ] Editor primary action is disabled when `LIVE_WRITES_ENABLED=false`
- [ ] Editor shows **Publish to Test** enabled only when `DEPLOYMENT_ENV=test`, `PUBLISH_MODE=test_direct`, `TEST_DIRECT_PUBLISH_ENABLED=true`, and target safety is true
- [ ] Media remains dry-run only
- [ ] Menus remains preview-only
- [ ] Publishing shows locked safety gates
- [ ] Audit Logs renders without secret leakage
- [ ] Settings shows the `xhalo-blog-test` project configuration

### Write-action gates

- [ ] Direct publish stays disabled
- [ ] Direct update stays disabled
- [ ] Direct config update stays disabled
- [ ] Live R2 upload stays disabled
- [ ] `POST /api/drafts/test-direct-publish` refuses `ranbeioc/hexo-blog@main`
- [ ] Test direct publish target is `ranbeioc/xhalo-blog-test@main` or `ranbeioc/hexo-blog@xhalo-blog-test-content`
- [ ] Clicking disabled controls does not send a write request

### Error-free operation

- [ ] No critical static asset 404s
- [ ] No uncaught JavaScript errors in the console

## Production preview gate reminder

This smoke test does not approve production writes.

- `xhalo-blog-production-api` is approval-gate only
- `xhalo-blog-production-queue` is approval-gate only
- production preview is limited to read-only, dry-run, and auth-check scope

## Result

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Environment | |
| URL | `https://xhalo-blog-test.pages.dev/admin` |
| Pass / Fail | |
| Notes | |
