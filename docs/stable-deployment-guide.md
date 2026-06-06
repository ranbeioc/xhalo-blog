# Stable Deployment Guide

This guide documents the `Contract v1` deployment baseline. The runtime remains `0.1.x alpha`, so production use still requires operator review.

## 1. Choose the starting point

Use one of these baselines:

- `examples/basic-blog`
- `examples/next-theme-blog`
- `templates/hexo-next`

## 2. Verify locally first

From the repository root:

```bash
npm install
npm run check:all
```

For the Hexo example:

```bash
cd examples/next-theme-blog
npm install
npm run build
```

Do not connect a repository to Cloudflare Pages before the local checks are clean.

## 3. Configure Cloudflare Pages

### `examples/basic-blog`

```text
Root directory: examples/basic-blog
Build command: npm run build
Build output directory: dist
```

### `examples/next-theme-blog`

```text
Root directory: examples/next-theme-blog
Build command: npm run build
Build output directory: public
NODE_VERSION: 20
```

## 4. Confirm branch behavior

Publishing expectations:

- non-`main` branches produce preview deployments
- `main` is the production branch
- write operations should create PRs instead of writing to `main`

## 5. Add Worker resources

After the static baseline is stable:

1. copy `wrangler.toml.example` to `wrangler.toml`
2. fill in your own resource IDs and names
3. bind `DB`, `ASSETS`, and `TASK_QUEUE`
4. set environment secrets from `.env.example`

Stable Worker entry:

```text
workers/api/src/index.js
```

## 6. Protect dynamic routes

Before exposing admin-facing or live-write routes:

- protect the deployment with Cloudflare Access
- set `ADMIN_API_SHARED_SECRET`
- keep `LIVE_WRITES_ENABLED` blank or `false` until route-level testing is complete
- only turn on `LIVE_WRITES_ENABLED=true` after request verification and operator review

Live write APIs are not recommended on a public domain until Access, request authentication, Turnstile, rate limiting, and route-level tests are configured and verified.

## 7. Add reconciliation secrets

Before enabling webhook-based reconciliation, set:

- `GITHUB_WEBHOOK_SECRET`
- `PREVIEW_WEBHOOK_SECRET`

These gate:

- `POST /webhooks/github`
- `POST /webhooks/deployments/preview`

## 8. Production rules

Never commit:

- real Cloudflare IDs
- real analytics IDs
- real comment endpoints
- real private keys
- production tokens

Keep production content and secrets in the downstream site repository or platform environment, not in this scaffold repository.
