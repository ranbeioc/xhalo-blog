# xhalo-blog

`xhalo-blog` is an early-stage open-source blog framework template for building a Cloudflare-native publishing system on top of the Hexo ecosystem.

It starts as a clean community edition template, not as a copy of any production blog. The repository contains example content, placeholder configuration, and a minimal Cloudflare platform skeleton for Pages, Workers, D1, R2, Queues, Turnstile, Access, and GitHub PR-based publishing workflows.

> Status: `v0.1.0-alpha / Phase 102 Hexo NexT full import pipeline`. Core Stage 4 paths and Queue Worker async publishing are implemented for staging evaluation. Production writes require manual owner approval, production direct main writes and auto-merge remain prohibited, and `LIVE_WRITES_ENABLED=false` is the default production baseline.

> Current admin verification status: the real test deployment target is Cloudflare Pages project `xhalo-blog-test` with owner-verified links at `https://xhalo-blog-test.pages.dev/` and `https://xhalo-blog-test.pages.dev/admin`. `xhalo-admin` is not used, `xhalo-blog-admin` does not exist, and production preview resources remain approval-gate only.

> Phase 098 update: this repository remains the open-source framework source and must not receive real private blog posts, uploads, or production blog configuration. The private repository `ranbeioc/xhalo-blog-test` is the real-content test-site source bound to Cloudflare Pages project `xhalo-blog-test`; it builds with `npm ci && npm run build` and outputs `public`. The legacy framework landing page is preserved on the test domain at `/landing/`, `/admin` remains same-domain, and R2 remains a media/attachment asset layer only, not whole-site hosting.

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
- **Admin PR-only Publishing MVP**: Reusable, vanilla HTML/JS workbench (under `apps/admin`) facilitating article creation, frontmatter overrides, safe Markdown previews, and PR status polling. Served directly inside the `xhalo-blog` project under the `/admin` path (no separate `xhalo-blog-admin` Pages project is required, and `xhalo-admin` is not used; real test deployment target is existing `xhalo-blog-test`). All write actions are strictly locked behind owner-reviewed manual Pull Request generation with zero direct main writes, auto-merging, or direct D1 publishing.
- **Phase 097 test-only publish path**: `POST /api/drafts/test-direct-publish` is separate from production owner-direct publish and only works with `DEPLOYMENT_ENV=test`, `PUBLISH_MODE=test_direct`, `TEST_DIRECT_PUBLISH_ENABLED=true`, an authenticated GitHub admin session, and a safe non-production target. `ranbeioc/hexo-blog@main` is explicitly forbidden.
- **Phase 098 test-site source boundary**: `ranbeioc/xhalo-blog-test@main` is the private real-content Hexo/NexT test site. It imports real content from `ranbeioc/hexo-blog` as a read-only source, keeps the legacy landing page at `/landing/`, keeps Admin at `/admin`, and uses Pages `_worker.js` only for `/api/*` and `/auth/*` staging proxying.
- **Phase 102 full Hexo/NexT import pipeline**: `npm run init:hexo-next` now has explicit `starter` and `import` modes. Import mode preserves historical Hexo/NexT content, pages, theme, scripts, plugin configuration, package metadata, and lockfiles while disabling deploy targets and producing `.xhalo-import-manifest.json` plus `.xhalo-import-report.md`.

## Current admin test boundary

- Real test home: `https://xhalo-blog-test.pages.dev/`
- Real test admin: `https://xhalo-blog-test.pages.dev/admin`
- Legacy framework landing page: `https://xhalo-blog-test.pages.dev/landing/`
- Cloudflare Pages source repo: `ranbeioc/xhalo-blog-test@main`
- Cloudflare Pages build: `npm ci && npm run build`, output `public`
- Owner-reported result: GitHub account can authorize and log in successfully
- First successful GitHub OAuth login can bootstrap the first admin only in `DEPLOYMENT_ENV=test` or with `FIRST_GITHUB_LOGIN_ADMIN_ENABLED=true`; production does not auto-bootstrap by default
- Test direct publish target: preferred `ranbeioc/xhalo-blog-test@main`, fallback `ranbeioc/hexo-blog@xhalo-blog-test-content`
- `xhalo-blog-production-api`: approval gate only, read-only preview only
- `xhalo-blog-production-queue`: approval gate only, no live-write processing
- No production direct publish, direct update, R2 live upload, menu direct update, or `hexo-blog/main` mutation is approved in Phase 096

## Quick start

```bash
npm install
npm run check:all
```

Create a default Hexo/NexT starter site with a welcome test article:

```bash
npm run init:hexo-next -- --target ../my-blog-test
npm run init:hexo-next -- --target ../my-blog-test --mode starter
```

Seed a private test site from an existing local Hexo blog:

```bash
npm run init:hexo-next -- --target ../my-blog-test --source ../hexo-blog --site-url https://my-blog-test.pages.dev
npm run init:hexo-next -- --target ../my-blog-test --mode import --source ../hexo-blog --site-url https://my-blog-test.pages.dev --site-title "My Blog"
```

The importer is the standard flow for historical Hexo migration. It preserves safe Hexo/NexT content, theme, scripts, plugin configuration, package metadata, and lockfiles; disables deploy targets; merges Pages `skip_render` entries for `/admin/` and `/landing/`; and must be used with a private site repository when importing real posts or upload assets.

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
- [`docs/hexo-next-initialization-and-import.md`](./docs/hexo-next-initialization-and-import.md)
- [`docs/hexo-blog-extraction-manifest.md`](./docs/hexo-blog-extraction-manifest.md)
- [`docs/stable-deployment-guide.md`](./docs/stable-deployment-guide.md)
- [`docs/stable-template-layout.md`](./docs/stable-template-layout.md)
- [`docs/cloudflare-pages.md`](./docs/cloudflare-pages.md)
- [`docs/deploy-cloudflare.md`](./docs/deploy-cloudflare.md)
- [`docs/functions-workers.md`](./docs/functions-workers.md)
- [`docs/theme-config.md`](./docs/theme-config.md)
- [`docs/security.md`](./docs/security.md)
- [`docs/github-pr-publishing.md`](./docs/github-pr-publishing.md)
- [`docs/owner-direct-publish-mode.md`](./docs/owner-direct-publish-mode.md)
- [`docs/owner-direct-existing-article-update-mode.md`](./docs/owner-direct-existing-article-update-mode.md)
- [`docs/phase097a-pages-full-blog-admin-compose-evidence.md`](./docs/phase097a-pages-full-blog-admin-compose-evidence.md)
- [`docs/phase097b-first-test-article-direct-publish-evidence.md`](./docs/phase097b-first-test-article-direct-publish-evidence.md)
- [`docs/phase100-private-test-site-pages-verification.md`](./docs/phase100-private-test-site-pages-verification.md)
- [`docs/phase101-test-direct-publish-e2e-evidence.md`](./docs/phase101-test-direct-publish-e2e-evidence.md)
- [`docs/phase102-hexo-next-full-import-pipeline.md`](./docs/phase102-hexo-next-full-import-pipeline.md)

## Cloudflare Pages deployment

For the current `xhalo-blog-test` full test site, use:

```text
Project: xhalo-blog-test
GitHub source: ranbeioc/xhalo-blog-test
Build command: npm ci && npm run build
Build output directory: public
Branch: main
```

The private test-site Pages `_worker.js` proxies same-origin `/api/*` and `/auth/*` requests to the staging API configured by `XHALO_ADMIN_API_BASE_URL`. The framework repository's `npm run build:test-pages` command remains a local validation fixture, not the real-content Pages build command.

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
