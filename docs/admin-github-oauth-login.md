# GitHub OAuth Login Preview

This document defines the configuration, security boundaries, and current verification status for the xhalo-blog admin GitHub OAuth login flow.

## Scope

The GitHub OAuth login module provides the authenticated preview path for the in-project admin routes. It is currently verified on the real test deployment and remains separate from any production write approval.

> [!IMPORTANT]
> Admin is served inside the `xhalo-blog` project under `/admin`.
> No separate `xhalo-blog-admin` project is required.
> `xhalo-admin` is not used for the xhalo-blog admin.
> The current real test deployment target is `xhalo-blog-test`.

Current owner-verified links:

- Home: `https://xhalo-blog-test.pages.dev/`
- Admin: `https://xhalo-blog-test.pages.dev/admin`

Owner-reported result:

- GitHub account can authorize and log in successfully.

## Environment variables

Configure the following variables in Wrangler or the Cloudflare dashboard:

| Variable | Description | Example |
| --- | --- | --- |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth app client ID | `Iv1.xxxxxxxxxxxx` |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth app client secret | secret |
| `GITHUB_OAUTH_ALLOWED_LOGINS` | Allowed GitHub usernames | `ranbeioc` |
| `FIRST_GITHUB_LOGIN_ADMIN_ENABLED` | Allows first successful GitHub login to bootstrap an admin outside production defaults | `true` for test/staging only |
| `ADMIN_SESSION_SECRET` | HMAC signing secret for admin sessions | secret, minimum 32 chars |
| `ADMIN_AUTH_BASE_URL` | Base URL for auth endpoints | `https://<staging-api-domain>` |
| `ADMIN_FRONTEND_BASE_URL` | Base URL for the admin frontend | `https://xhalo-blog-test.pages.dev` |
| `ADMIN_FRONTEND_PATH` | Admin route path | `/admin` |
| `ADMIN_SESSION_COOKIE_NAME` | Session cookie name | `xhalo_admin_session` |
| `ADMIN_SESSION_TTL_SECONDS` | Session TTL in seconds | `86400` |

## OAuth app setup

Use the staging/test app configuration for the current real test deployment:

- Application name: `xhalo-blog-test Admin`
- Homepage URL: `https://xhalo-blog-test.pages.dev/admin`
- Authorization callback URL: `https://<staging-api-domain>/auth/github/callback`

Production and staging/test must continue to use separate OAuth app credentials.

## Current verified flow

The current verified real test flow is:

1. Open `https://xhalo-blog-test.pages.dev/admin`
2. Click **Login with GitHub**
3. Redirect to `https://<staging-api-domain>/auth/github/start`
4. Complete GitHub authorization
5. Return through `https://<staging-api-domain>/auth/github/callback`
6. Redirect back to `https://xhalo-blog-test.pages.dev/admin`
7. Verify `GET /api/auth/session` returns `authenticated=true`
8. Verify logout returns `authenticated=false`

## Session cookie behavior

- Cookies are written with `HttpOnly; Secure; SameSite=Lax; Path=/`
- The transient OAuth state cookie is cleared after successful callback
- The signed admin session stores user metadata only
- Test/staging first-login bootstrap stores the first admin in D1 table `admin_users`
- `/api/auth/session` returns `user.role` and `user.isAdmin`
- GitHub access tokens must not be written to cookies, logs, D1, or docs

## First-login admin boundary

The first successful GitHub OAuth login becomes admin only when `DEPLOYMENT_ENV=test` or `FIRST_GITHUB_LOGIN_ADMIN_ENABLED=true`.

After the first admin exists, later users must match `admin_users` or `GITHUB_OAUTH_ALLOWED_LOGINS`. Production does not auto-bootstrap by default.

## Production boundary

This OAuth preview does not grant or imply production write approval.

- `xhalo-blog-production-api` remains approval-gate only
- `xhalo-blog-production-queue` remains approval-gate only
- production preview scope is limited to read-only, dry-run, and auth-check operations
- no production direct publish is approved
- no production direct update is approved
- no production R2 live upload is approved

## Verification

Automated verification:

```bash
npm test
```

Real test evidence:

- `docs/xhalo-blog-test-real-deployment-links-20260616.md`
- `docs/phase096-owner-test-review-production-preview-gate.md`
