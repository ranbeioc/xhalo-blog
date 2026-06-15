# GitHub OAuth Login Preview

This document details the configuration, security boundaries, and staging verification parameters for the Admin GitHub OAuth Login Preview module in `xhalo-blog`.

## Scope

The GitHub OAuth Login module provides an optional preview-only authentication path for administrative routes. It allows designated users to sign in with GitHub, creating an HTTP-only cookie session.

> [!NOTE]
> In the current phase, OAuth login does not replace the outer Cloudflare Access verification or the fallback `x-xhalo-admin-secret` authentication headers. It acts as an integration preview.

## Environment Variables

Configure the following variables in wrangler.toml or the Cloudflare dashboard:

| Variable | Description | Value Example / Default |
| --- | --- | --- |
| `GITHUB_OAUTH_CLIENT_ID` | Client ID from GitHub OAuth Application | `Iv1.xxxxxxxxxxxx` |
| `GITHUB_OAUTH_CLIENT_SECRET` | Client Secret from GitHub OAuth Application (sensitive) | *(Secret)* |
| `GITHUB_OAUTH_ALLOWED_LOGINS` | Comma-separated list of whitelisted GitHub usernames | `ranbeioc` |
| `ADMIN_SESSION_SECRET` | Secret key used to sign session cookies (HMAC-SHA256) | *(Secret, min 32 chars)* |
| `ADMIN_AUTH_BASE_URL` | Base URL of the Admin interface (used for redirects) | `https://admin.xhalo.co` |
| `ADMIN_SESSION_COOKIE_NAME` | Name of the session cookie | `xhalo_admin_session` |
| `ADMIN_SESSION_TTL_SECONDS` | Time-to-live for sessions in seconds | `86400` (24 hours) |

## GitHub OAuth App Setup

1. Go to **Developer Settings** > **OAuth Apps** in your GitHub account/organization.
2. Click **New OAuth App**.
3. Set **Application Name** to `xhalo-blog-admin` or similar.
4. Set **Homepage URL** to your Admin site (e.g., `https://admin.xhalo.co`).
5. Set **Authorization callback URL** to the callback endpoint (see examples below).
6. Save and generate a new Client Secret.

> [!IMPORTANT]
> **Separate Staging and Production Apps**: Production and staging environments must use separate GitHub OAuth Apps to prevent redirect cross-contamination and ensure distinct credentials.

## Callback URL Examples

- **Production**: `https://admin.xhalo.co/auth/github/callback`
- **Staging**: `https://<staging-preview-domain>/auth/github/callback`
- **Local Dev**: `http://localhost:8787/auth/github/callback`

## Session Cookie Behavior

* **Secure Handling**: Cookies are written using `HttpOnly; Secure; SameSite=Lax; Path=/`.
* **State Verification**: OAuth states are tracked via `xhalo_oauth_state` transient cookie. The state cookie is cleared (`Max-Age=0`) upon successful token exchange.
* **Payload Isolation**: The signed session cookie contains user metadata (`login`, `id`, `avatarUrl`, `name`, `expiresAt`) signed using HMAC-SHA256. It **never** exposes or stores the GitHub API access token in the payload or logs.

## Security Boundaries

1. **Strict Whitelist**: Only logins explicitly listed in `GITHUB_OAUTH_ALLOWED_LOGINS` are permitted. Any other login returns HTTP 403 and triggers an `oauth_unauthorized_login` security audit event.
2. **Access Token Non-leakage**: GitHub OAuth tokens retrieved from the token exchange are only used in-memory during callback and discarded immediately. They are never written to D1, session cookies, or logs.
3. **Session Expiry**: Sessions expire after `ADMIN_SESSION_TTL_SECONDS` and are automatically rejected.
4. **Tamper Prevention**: Any change to the session cookie payload invalidates the signature and results in authentication rejection.

## Verification

### Local Mock Test

Run the automated test suite which includes full mock token exchanges and callback assertions:
```bash
npm test
```

### Staging Preview Test

1. Navigate to the `/auth/github/start` endpoint of your staging deployment.
2. Verify redirect to GitHub authorization page.
3. Login using a whitelisted username.
4. Verify redirection back to `/admin` and presence of the secure `xhalo_admin_session` cookie.
5. Attempt login with a non-whitelisted account and verify HTTP 403 behavior.

## What This Does Not Do

* This does **not** write configuration settings to production repositories.
* This does **not** grant repository write permissions directly to users; writing remains gated behind internal Cloudflare deployment credentials.
