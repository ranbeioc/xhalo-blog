# xhalo-blog

`xhalo-blog` is an early-stage open-source blog framework template for building a Cloudflare-native publishing system on top of the Hexo ecosystem.

It starts as a clean community edition template, not as a copy of any production blog. The repository contains example content, placeholder configuration, and a minimal Cloudflare platform skeleton for Pages, Workers, D1, R2, Queues, Turnstile, Access, and GitHub PR-based publishing workflows.

> Status: `v0.1.0-alpha / Stage 4 Release Candidate`. The public scaffold contract is tracked as `Contract v1`, with fully implemented and verified runtime APIs, database migrations, and Cloudflare integrations.

## Production warning

Do not expose live write routes on a public domain until Cloudflare Access, request authentication, Turnstile, rate limiting, and route-level tests are configured and verified.

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

- **Decoupled Workers**: Decoupled API and Queue Worker architecture for async execution.
- **D1 Database**: Hardened database schema and migrations for posts, settings, tasks, and audit logs.
- **R2 Assets**: Secure R2 asset upload pipeline with filename sanitation, MIME allowlist, and signed upload URLs.
- **GitHub Integration**: GitHub App PR-based draft publishing flow with idempotency and API conflict handling.
- **Observability**: Structured JSON logging, error boundaries, and persistent D1 audit trails.
- **Security Gates**: Zero Trust Cloudflare Access JWT validation and Turnstile protection.
- **Hexo Compatibility**: Theme adapter with fixture-backed asset rewriting and regression testing.
- **Smoke Tests**: 17-point automated deployment smoke-test suite and runbooks.

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
