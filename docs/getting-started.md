# Getting Started

`xhalo-blog` is currently `v0.1.0-alpha / Stage 4 Release Candidate`. `Contract v1` documents the scaffold baseline, with fully implemented runtime APIs and Cloudflare integrations.

## Choose a starting point

Use one of these directories as your first runnable baseline:

- `examples/basic-blog`
  - Smallest static Cloudflare Pages example.
  - Good for checking `_headers`, cache rules, and deployment wiring.
- `examples/next-theme-blog`
  - Runnable Hexo plus NexT example.
  - Good for testing Hexo build, permalink behavior, and theme compatibility.
- `templates/hexo-next`
  - Reusable template directory for a fresh Hexo plus NexT site.
  - Good for forking into a new public project repository.

## Check the scaffold

From the repository root:

```bash
npm install
npm run check:all
```

This verifies the scaffold baseline, production-marker scan, admin build, both Hexo build paths, built compatibility fixtures, Worker syntax checks, and automated unit/integration tests.

When the API is deployed, protect it first with Cloudflare Access and `ADMIN_API_SHARED_SECRET`. The API expects that shared secret (or a valid Cloudflare Access JWT) before it will authorize queries to protected routes such as `GET /api/readiness`, `GET /api/posts`, `GET /api/tasks`, and `GET /api/audit-logs`.

For live GitHub draft publishing, set up a GitHub App with the required permissions and register `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` (PEM format), and `GITHUB_INSTALLATION_ID`. The API handles commits, branch creation, and Pull Requests asynchronously using a Queue Worker backend.

For R2 asset uploads, bind `ASSETS` in Wrangler and set both `ASSETS_PUBLIC_BASE_URL` and `ASSETS_SIGNING_SECRET`. The pipeline includes built-in filename sanitation, MIME allowlist verification, and short-lived upload signatures.

Keep `LIVE_WRITES_ENABLED` blank or `false` by default. Only enable it on your Cloudflare Staging/Production Worker variables once you have verified the deployment using our 17-point smoke test matrix and staging live-write runbook.

For webhook reconciliation, set `GITHUB_WEBHOOK_SECRET` and `PREVIEW_WEBHOOK_SECRET` to verify signatures and update the D1 database status when preview deployments finish.

## Run the minimal static example

```bash
cd examples/basic-blog
npm install
npm run build
```

Recommended Cloudflare Pages settings:

```text
Root directory: examples/basic-blog
Build command: npm run build
Build output directory: dist
```

Use this path when you want the smallest possible public baseline before introducing Hexo.

## Run the Hexo plus NexT example

```bash
cd examples/next-theme-blog
npm install
npm run build
npm run server
```

Default local URL:

```text
http://localhost:4000
```

Recommended Cloudflare Pages settings:

```text
Root directory: examples/next-theme-blog
Build command: npm run build
Build output directory: public
Environment variable: NODE_VERSION=20
```

Use this path when you need a working Hexo baseline with:

- `permalink: :year/:month/:day/:title/`
- `post_asset_folder: true`
- NexT-compatible theme configuration
- `_headers` checked into `source/_headers`
- compatibility helper `scripts/hexo-asset-image.js` for post-asset image, FancyBox, and video path rewriting
- fixture-backed coverage for PDF, Chart, searchdb, sitemap, and baidusitemap outputs

## Prepare configuration

Start from the configuration templates:

- Root directory: `wrangler.toml.example`, `rb-blog.config.example.json`, `.env.example`
- HTTP API Worker: [workers/api/wrangler.toml.example](../workers/api/wrangler.toml.example)
- Queue Worker: [workers/queue/wrangler.toml.example](../workers/queue/wrangler.toml.example)

Refer to the step-by-step setup guides for detailed instructions:
1. [Cloudflare Setup Guide](./cloudflare-setup.md)
2. [GitHub App Setup Guide](./github-app-setup.md)

Do not commit real account IDs, zone IDs, analytics IDs, private keys, comment endpoints, or production secrets.

## Read next

- [Cloudflare Setup Guide](./cloudflare-setup.md)
- [GitHub App Setup Guide](./github-app-setup.md)
- [cloudflare-pages.md](./cloudflare-pages.md)
- [deploy-cloudflare.md](./deploy-cloudflare.md)
- [public-config-contract.md](./public-config-contract.md)
- [stable-deployment-guide.md](./stable-deployment-guide.md)
- [stable-template-layout.md](./stable-template-layout.md)
- [functions-workers.md](./functions-workers.md)
- [theme-config.md](./theme-config.md)
- [security.md](./security.md)
- [github-pr-publishing.md](./github-pr-publishing.md)


## Boundary

This repository should only contain reusable scaffold code, templates, examples, and docs.

Do not copy:

- private production posts
- private assets
- real analytics IDs
- real comment services
- real Cloudflare resource IDs
