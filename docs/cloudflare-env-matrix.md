# Cloudflare Environment & Secrets Matrix

This document maps all configuration environment variables and secrets used by the `xhalo-blog` API Worker.

## Environment Variables Matrix

| Variable Name | Scope | Type | Storage Location | Purpose |
|---|---|---|---|---|
| `ADMIN_API_SHARED_SECRET` | **Secret** | String | Cloudflare Secret (`wrangler secret`) | Shared secret token sent in `x-xhalo-admin-secret` to authorize admin actions. |
| `LIVE_WRITES_ENABLED` | **Public** | String (`"true"`/`"false"`) | `wrangler.toml` (`[vars]`) | Gating flag to prevent write operations (like drafts creation and R2 uploads) unless set to `"true"`. |
| `DEPLOYMENT_ENV` | **Public** | String | `wrangler.toml` (`[vars]`) | Set to `test` only on the test/staging Worker when first-login admin bootstrap or test direct publish is intended. |
| `PUBLISH_MODE` | **Public** | String | `wrangler.toml` (`[vars]`) | Default `pr_only`; Phase 097 test direct publish requires `test_direct`. |
| `TEST_DIRECT_PUBLISH_ENABLED` | **Public** | String (`"true"`/`"false"`) | `wrangler.toml` (`[vars]`) | Enables only `POST /api/drafts/test-direct-publish` when all other test gates pass. Keep `false` in production. |
| `FIRST_GITHUB_LOGIN_ADMIN_ENABLED` | **Public** | String (`"true"`/`"false"`) | `wrangler.toml` (`[vars]`) | Allows first successful GitHub OAuth login to bootstrap admin outside the `DEPLOYMENT_ENV=test` default. Keep `false` in production. |
| `TURNSTILE_SECRET_KEY` | **Secret** | String | Cloudflare Secret (`wrangler secret`) | Private Turnstile token used for validation requests to the siteverify challenge API. |
| `TURNSTILE_SITE_KEY` | **Public** | String | `wrangler.toml` (`[vars]`) | Public Turnstile site key exposed in provider readiness endpoint and loaded by the Admin client. |
| `ACCESS_TEAM_DOMAIN` | **Public** | String | `wrangler.toml` (`[vars]`) | Cloudflare Access team authentication domain (e.g. `your-team.cloudflareaccess.com`) used for JWKS checks. |
| `ACCESS_AUDIENCE_TAG` | **Public** | String | `wrangler.toml` (`[vars]`) | Application audience signature tag used to verify Access JWT `aud` claim validity. |
| `ACCESS_BYPASS_SIGNATURE_FOR_TESTING` | **Test-Only** | String (`"true"`) | Local environment only | Bypasses actual JWKS fetching and signature verification during local automated security tests. |
| `GITHUB_TOKEN` | **Secret** | String | Cloudflare Secret (`wrangler secret`) | Personal Access Token or App Token used to make Git tree updates and open publishing PRs. |

---

## Configuration Methods

### 1. Setting Public Environment Variables
Public configurations are specified under the `[vars]` block in your `wrangler.toml`:

```toml
[vars]
TURNSTILE_SITE_KEY = "1x00000000000000000000AA"
ACCESS_TEAM_DOMAIN = "your-team"
ACCESS_AUDIENCE_TAG = "your-aud-tag"
LIVE_WRITES_ENABLED = "true"
```

### 2. Setting Cloudflare Worker Secrets
Secrets must **never** be written in plaintext inside files. Upload them using the Wrangler CLI:

```bash
npx wrangler secret put ADMIN_API_SHARED_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put GITHUB_TOKEN
```

Confirm that the secret is registered by inspecting the output checklist or running:
```bash
npx wrangler secret list
```
