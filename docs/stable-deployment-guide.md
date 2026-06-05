# Stable Deployment Guide

This is the stable deployment sequence for the public scaffold baseline.

## 1. Choose the starting point

Use one of these, depending on the deployment target:

- `examples/basic-blog`
  - smallest Cloudflare Pages baseline
- `examples/next-theme-blog`
  - runnable Hexo + NexT baseline
- `templates/hexo-next`
  - reusable template directory for a new site repository

## 2. Verify locally first

From the repository root:

```bash
npm install
npm run check
```

For the chosen example or template:

```bash
# basic example
cd examples/basic-blog
npm install
npm run build

# or Hexo example
cd examples/next-theme-blog
npm install
npm run build
```

Do not connect a repository to Cloudflare Pages before the local build is clean.

## 3. Configure Cloudflare Pages

Stable Pages settings for the built-in examples:

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

Stable publishing expectations:

- non-`main` branches produce preview deployments
- `main` is the production branch
- write operations create PRs instead of writing to `main`

Do not attach a custom domain before preview and production branch behavior are both verified.

## 5. Add Worker resources

After the static baseline is stable:

1. copy `wrangler.toml.example` to `wrangler.toml`
2. fill in your own resource IDs and names
3. bind:
   - `DB`
   - `ASSETS`
   - `TASK_QUEUE`
4. set environment secrets from `.env.example`

Stable worker entry:

```text
workers/api/src/index.js
```

## 6. Add reconciliation secrets

Before enabling webhook-based state reconciliation, set:

- `GITHUB_WEBHOOK_SECRET`
- `PREVIEW_WEBHOOK_SECRET`

These gate:

- `POST /webhooks/github`
- `POST /webhooks/deployments/preview`

## 7. Production rules

Never commit:

- real Cloudflare IDs
- real analytics IDs
- real comment endpoints
- real private keys
- production tokens

Keep production content and secrets in the downstream site repository or the platform environment, not in this scaffold repository.
