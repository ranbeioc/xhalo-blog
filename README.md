# xhalo-blog

`xhalo-blog` is an early-stage open-source blog framework template for building a Cloudflare-native publishing system on top of the Hexo ecosystem.

It starts as a clean community edition template, not as a copy of any production blog. The repository contains example content, placeholder configuration, and a minimal Cloudflare platform skeleton for Pages, Workers, D1, R2, Queues, Turnstile, Access, and GitHub PR-based publishing workflows.

> Status: `v0.1.0-alpha / Controlled PR-only production pipeline verified`. Core Stage 4 paths and Queue Worker async publishing are implemented for staging evaluation. Production writes require manual owner approval, direct main writes and auto-merge remain prohibited, and `LIVE_WRITES_ENABLED=false` is the default production baseline.

## Production warning

Do not expose live write routes on a public domain until Cloudflare Access, request authentication, Turnstile, rate limiting, and route-level tests are configured and verified.

## Production Safety Status

The production pipeline has passed one controlled live-write trial.

Current operating mode:

- PR-only production publishing;
- `LIVE_WRITES_ENABLED=false` by default;
- explicit owner approval required for every production write window;
- no direct main writes;
- no auto-merge;
- no unattended batch publish;
- no R2 writes unless separately approved.

Generated production PRs must be manually reviewed by the owner before merge.

## Goals

- Keep static publishing fast and reliable with Hexo and Cloudflare Pages.
- Preserve compatibility with Hexo themes, beginning with a NexT-compatible template.
- Add Cloudflare-native platform capabilities incrementally rather than replacing static publishing too early.
- Use Git as the source of truth for posts and configuration.
- Use GitHub pull requests for write operations from the future admin panel.
- Keep dynamic features optional and isolated from the public static site.

## What is included

```text
xhalo-blog/
  apps/admin/                 # Admin panel placeholder
  workers/api/                # Cloudflare Worker API skeleton
  workers/queue/              # Queue consumer skeleton
  packages/core/              # Shared config and helpers
  packages/theme-adapter-hexo/# Hexo adapter helpers
  examples/basic-blog/        # Minimal static example
  examples/next-theme-blog/   # Minimal Hexo + NexT example
  templates/hexo-next/        # Reusable Hexo + NexT template
  docs/                       # Deployment and architecture docs
  .github/                    # Workflows and community templates
```

## Current capabilities

- **Implemented Core Features**: Hardened D1 database schema with migration safety, secure R2 asset path verification, XSS-safe Markdown rendering, Cloudflare Access JWT gates, Turnstile verification on mutation routes, and a 17-point automated smoke testing suite.
- **Staged Integrations**: Staging-ready GitHub App integration for draft branch/PR creation and R2 signed uploads with HMAC validation.
- **Async Publishing Alpha**: Queue Worker `draft_publish` execution is implemented in Phase 7.1 for staging-only GitHub PR publishing. It creates or reuses draft branches, commits Markdown, opens or reuses Pull Requests, updates D1 task/post status, and writes audit logs. This path remains alpha and must pass operator staging verification before any production use.
- **Hexo Compatibility**: Theme adapter with fixture-backed asset rewriting and regression checking.

## Quick start

```bash
npm install
npm run check:all
```

See [`docs/getting-started.md`](./docs/getting-started.md) for the full Stage 4 setup flow.

To test the Hexo NexT example:

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

## Documentation

- [`docs/getting-started.md`](./docs/getting-started.md)
- [`docs/public-config-contract.md`](./docs/public-config-contract.md)
- [`docs/compatibility-matrix.md`](./docs/compatibility-matrix.md)
- [`docs/hexo-compat-fixtures.md`](./docs/hexo-compat-fixtures.md)
- [`docs/hexo-next-optional-plugins.md`](./docs/hexo-next-optional-plugins.md)
- [`docs/hexo-blog-extraction-manifest.md`](./docs/hexo-blog-extraction-manifest.md)
- [`docs/stable-deployment-guide.md`](./docs/stable-deployment-guide.md)
- [`docs/stable-template-layout.md`](./docs/stable-template-layout.md)
- [`docs/cloudflare-pages.md`](./docs/cloudflare-pages.md)
- [`docs/deploy-cloudflare.md`](./docs/deploy-cloudflare.md)
- [`docs/functions-workers.md`](./docs/functions-workers.md)
- [`docs/theme-config.md`](./docs/theme-config.md)
- [`docs/security.md`](./docs/security.md)
- [`docs/github-pr-publishing.md`](./docs/github-pr-publishing.md)

## Cloudflare Pages deployment

For the minimal static example, use:

```text
Build command: npm run build
Build output directory: dist
Root directory: examples/basic-blog
```

For the Hexo NexT example, use:

```text
Build command: npm run build
Build output directory: public
Root directory: examples/next-theme-blog
Environment variable: NODE_VERSION=20
```

For a production site, fork this repository, choose one of these starting points, customize configuration, and connect the repository to Cloudflare Pages:

- `examples/basic-blog` for the smallest static baseline
- `examples/next-theme-blog` for a runnable Hexo plus NexT example
- `templates/hexo-next` for a reusable Hexo plus NexT template directory

## Configuration

Start from:

```text
rb-blog.config.example.json
.env.example
wrangler.toml.example
```

Current scaffold defaults are aligned around:

- `workers/api/src/index.js`
- `TASK_QUEUE` -> `xhalo-blog-tasks`
- `DB` -> `xhalo-blog`
- a normalized `rb-blog.config.example.json` contract for site, theme, comments, analytics, features, and security

The public scaffold contract is documented in [`docs/public-config-contract.md`](./docs/public-config-contract.md).

Never commit real API tokens, account IDs, zone IDs, analytics IDs, private keys, or production secrets.

## Project boundary

`xhalo-blog` is the open-source community edition. It should only contain reusable framework code, examples, templates, documentation, and placeholder configuration.

Production blogs using `xhalo-blog` should keep private content, real analytics IDs, real comment services, and deployment secrets in their own repositories or environment variables.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).

## Security

See [`SECURITY.md`](./SECURITY.md).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT. See [`LICENSE`](./LICENSE).
