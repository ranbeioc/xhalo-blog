# xhalo-blog v0.1.0-alpha.1 Draft Release Notes

## Highlights

- **Admin PR-only publishing MVP**: Standardizes editing workflow through GitHub Pull Requests.
- **Owner Direct Create / Update behind feature flags**: Safe bypass gates for owner direct publishing.
- **GitHub OAuth login preview**: Full anti-CSRF protections and access token memory-only lifecycle.
- **Media Asset Manager dry-run previews**: Safety gates block writes, sanitize names, block path traversals, and flag high-risk file types (like SVGs).
- **Site Menu Manager preview and diff**: Generate a clean config file difference locally without write side-effects.
- **Audit log coverage**: Structured logging and persistence of admin mutations, logins, and errors to D1.
- **Security hardening and staging smoke evidence**: Verified with 174 test assertions covering bounds, sanitization, and security scenarios.

## Safety Defaults

- `PUBLISH_MODE=pr_only` remains default
- `LIVE_WRITES_ENABLED=false` remains default
- Owner direct modes (`OWNER_DIRECT_PUBLISH_ENABLED`, `OWNER_DIRECT_UPDATE_ENABLED`, `OWNER_DIRECT_CONFIG_UPDATE_ENABLED`) are disabled by default (`false`)
- Media writes are strictly dry-run only
- Menu writes are strictly preview-only

## Known Limitations

- No server-side session revocation yet (sessions expire using TTL)
- No live media upload pipeline yet (writes to production R2 are blocked)
- No menu PR generation yet (in-memory diff generation only)
- No menu direct update yet (direct main updates remain disabled by default)
- No production write automation enabled by default

## Upgrade Notes

To set up this release candidate:
1. Copy `.env.example` to `.env` and `wrangler.toml.example` to `wrangler.toml`.
2. Configure your optional GitHub OAuth credentials: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, and `ADMIN_SESSION_SECRET`.
3. Set your authorized GitHub username list in `GITHUB_OAUTH_ALLOWED_LOGINS`.
4. Ensure `LIVE_WRITES_ENABLED` is left as `false` to maintain dry-run and preview-only boundary logic.

## Required Environment Variables

The following variables configure the safety boundaries of this release candidate:
- `LIVE_WRITES_ENABLED`: Enable live writes to Git repository and R2 bucket (`true` / `false`). Default: `false` or empty.
- `PUBLISH_MODE`: Mode of publishing posts. Default: `pr_only`.
- `OWNER_DIRECT_PUBLISH_ENABLED`: Direct publish bypass to main. Default: `false`.
- `OWNER_DIRECT_UPDATE_ENABLED`: Direct update bypass to main. Default: `false`.
- `OWNER_DIRECT_CONFIG_UPDATE_ENABLED`: Direct configuration update bypass to main. Default: `false`.
- `GITHUB_OAUTH_CLIENT_ID`: GitHub OAuth client ID.
- `GITHUB_OAUTH_CLIENT_SECRET`: GitHub OAuth client secret.
- `ADMIN_SESSION_SECRET`: Secret used to sign session cookies via HMAC-SHA256.
- `GITHUB_OAUTH_ALLOWED_LOGINS`: Comma-separated list of GitHub logins allowed to authenticate.

## Verification Commands

To verify your environment and validate the codebase:
```bash
npm ci
npm run check:all
npm run check:secrets
npm test
npm run test:secrets-fixture
npm run build:admin
```

## Owner Approval Required

No release tags or releases may be created on GitHub until the owner explicitly issues:
> "I approve creating the v0.1.0-alpha.1 release tag from main."
