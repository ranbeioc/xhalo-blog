# Getting Started

`xhalo-blog` is still a Stage 2.5 scaffold. This repository is for template, example, and deployment baseline work. It is not the Stage 3 application yet.

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
npm run check
```

This verifies the required scaffold files exist and that obvious production-only values are not present in the checked baseline files.

When the placeholder API is deployed on the same origin, you can also inspect `GET /api/readiness` to confirm whether GitHub, R2, queue, and Turnstile-related environment wiring looks ready before moving a dry-run prototype toward a real integration.

For live GitHub draft publishing, prefer `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_INSTALLATION_ID`. The worker accepts the PEM you download from GitHub for the app key. `GITHUB_TOKEN` remains a fallback for the early prototype path.

For the first live R2 upload prototype, bind `ASSETS` in Wrangler and set both `ASSETS_PUBLIC_BASE_URL` and `ASSETS_SIGNING_SECRET`. The direct live upload path uses the public base URL, and the signed upload path also uses the signing secret to mint one-time worker upload URLs.

For webhook reconciliation, also set `GITHUB_WEBHOOK_SECRET` and `PREVIEW_WEBHOOK_SECRET` before exposing `/webhooks/github` or `/webhooks/deployments/preview`.

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

## Prepare configuration

Start from these files at the repository root:

```text
rb-blog.config.example.json
.env.example
wrangler.toml.example
```

Current scaffold defaults assume:

- Worker entry: `workers/api/src/index.js`
- Queue binding: `TASK_QUEUE`
- Queue name: `xhalo-blog-tasks`
- D1 binding: `DB`
- Example database name: `xhalo-blog`

Do not commit real account IDs, zone IDs, analytics IDs, private keys, comment endpoints, or production secrets.

## Read next

- `docs/cloudflare-pages.md`
- `docs/deploy-cloudflare.md`
- `docs/functions-workers.md`
- `docs/theme-config.md`
- `docs/security.md`
- `docs/github-pr-publishing.md`

## Boundary

This repository should only contain reusable scaffold code, templates, examples, and docs.

Do not copy:

- private production posts
- private assets
- real analytics IDs
- real comment services
- real Cloudflare resource IDs
