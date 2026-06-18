# xhalo-blog

`xhalo-blog` is an open-source Cloudflare-native blog framework scaffold for building a Hexo/NexT compatible publishing system with Cloudflare Pages, Workers API, D1, R2, GitHub-based publishing, and a browser Admin.

[中文说明](./README.zh-CN.md)

## Repository Boundary

- `ranbeioc/xhalo-blog`: open-source framework, Admin, Worker APIs, templates, migration tools, documentation, and tests. It must not receive real private blog posts, uploads, production `CNAME`, deploy secrets, analytics IDs, or production content.
- `ranbeioc/hexo-blog`: read-only historical source for Hexo/NexT migration.
- `ranbeioc/xhalo-blog-test`: private real-content test site generated from starter/import mode and deployed by Cloudflare Pages.

## What Is Included

```text
xhalo-blog/
  apps/admin/                 # Browser Admin for content, media, menus, config, and integrations
  apps/landing/               # Product landing page for blog.xhalo.co
  workers/api/                # Cloudflare Workers API
  workers/queue/              # Queue consumer skeleton
  packages/core/              # Shared config, GitHub publishing, and validation helpers
  packages/theme-adapter-hexo/# Hexo adapter helpers
  examples/                   # Runnable examples
  templates/hexo-next/        # Reusable Hexo + NexT starter template
  docs/                       # Deployment, security, and migration docs
```

## Quick Start

```bash
npm ci
npm run check:all
npm run build:admin
npm run build:landing
```

## Standard initialization and Hexo/NexT import flow

Starter mode creates a private test site with the default NexT theme and a welcome article:

```bash
npm run init:hexo-next -- --target ../my-blog-test
npm run init:hexo-next -- --target ../my-blog-test --mode starter --site-url https://blog.example.com
```

Import mode reads an existing local Hexo/NexT blog and generates a private test site:

```bash
npm run init:hexo-next -- --target ../my-blog-test --source ../hexo-blog --site-url https://blog.example.com
npm run init:hexo-next -- --target ../my-blog-test --mode import --source ../hexo-blog --site-title "My Blog" --site-url https://blog.example.com
```

Import mode preserves safe Hexo/NexT content and configuration, including posts, uploads, pages, `_data`, scaffolds, scripts, NexT theme files, menu settings, feed/search/sitemap/media-related plugin configuration, package metadata, and lockfiles. It disables legacy deploy targets, keeps `/admin/`, `/landing/`, and `_worker.js` out of Hexo rendering, and emits `.xhalo-import-manifest.json` plus `.xhalo-import-report.md`.

## Cloudflare Pages

Standalone product landing:

```text
Project: xhalo-blog-landing
GitHub source: ranbeioc/xhalo-blog
Build command: npm ci && npm run build:landing
Build output directory: apps/landing/dist
Production domain: blog.xhalo.co
```

Private full blog test or production site:

```text
Project: xhalo-blog-test or your own Pages project
GitHub source: private generated blog repository
Build command: npm ci && npm run build
Build output directory: public
Production domain: your blog domain
```

## Admin And Publishing

The Admin is served under the blog site `/admin/` path. It supports GitHub OAuth, first-login admin bootstrap in test/staging gates, paginated post loading, article editing, menu management, media flows, Hexo/NexT config inspection, integration status, audit summaries, and test-only direct publishing.

Production writes remain PR-only by default. Direct production writes, production R2 live upload, and writes to `ranbeioc/hexo-blog@main` are not part of the default safe operating mode.

## Documentation

- [`docs/getting-started.md`](./docs/getting-started.md)
- [`docs/hexo-next-initialization-and-import.md`](./docs/hexo-next-initialization-and-import.md)
- [`docs/cloudflare-pages.md`](./docs/cloudflare-pages.md)
- [`docs/deploy-cloudflare.md`](./docs/deploy-cloudflare.md)
- [`docs/security.md`](./docs/security.md)
- [`docs/github-pr-publishing.md`](./docs/github-pr-publishing.md)
- [`docs/owner-direct-publish-mode.md`](./docs/owner-direct-publish-mode.md)
- [`docs/owner-direct-existing-article-update-mode.md`](./docs/owner-direct-existing-article-update-mode.md)

## Configuration

Start from:

```text
rb-blog.config.example.json
.env.example
wrangler.toml.example
```

Never commit real API tokens, account IDs, zone IDs, analytics IDs, private keys, deploy hooks, OAuth secrets, or production content.

## License

MIT. See [`LICENSE`](./LICENSE).
