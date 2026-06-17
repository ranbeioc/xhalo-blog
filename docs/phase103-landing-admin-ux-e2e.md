# Phase 103 Landing, Admin UX, and Test-only E2E Evidence

## Scope

Phase 103 keeps `xhalo-blog` as the open-source framework repository. It does not add private posts, upload assets, production `CNAME`, production deploy targets, or production secrets to this repository.

## Landing Deployment Plan

- Cloudflare Pages project: `xhalo-blog-landing`
- GitHub source: `ranbeioc/xhalo-blog@main`
- Build command: `npm ci && npm run build:landing`
- Output directory: `apps/landing/dist`
- Production domain: `blog.xhalo.co`

The legacy test-site landing entry remains available from the private test site at `https://xhalo-blog-test.pages.dev/landing/`.

## Cloudflare Landing Setup Status

Created on 2026-06-17:

- Pages project `xhalo-blog-landing`
- Project id `0053d7cd-8bc5-4142-acb0-e72ca86afc0d`
- Pages subdomain `xhalo-blog-landing.pages.dev`
- GitHub source `ranbeioc/xhalo-blog@main`
- Build command `npm ci && npm run build:landing`
- Output directory `apps/landing/dist`
- Custom domain `blog.xhalo.co`
- Domain id `28f0f194-d14b-4466-ba7a-1a3bd8bf67b2`
- DNS record `blog.xhalo.co CNAME xhalo-blog-landing.pages.dev`, proxied
- DNS record id `4ea5771b296189bbf76c87c7a36a73fa`

At setup time, Pages domain validation was still `initializing` / `pending`. The first production deployment with the Phase 103 footer content requires this PR to merge into `main`, because the Pages project is intentionally bound to `ranbeioc/xhalo-blog@main`.

## Hexo/NexT Initialization Documentation

`README.md` now records the standard initialization flow:

- Starter mode creates a private NexT test site with a welcome article.
- Import mode reads a local Hexo/NexT source and preserves posts, uploads, pages, `_data`, scaffolds, scripts, theme files, menus, plugin configuration, package metadata, and lockfiles.
- `ranbeioc/xhalo-blog` remains the open-source framework.
- `ranbeioc/hexo-blog` remains read-only historical input.
- `ranbeioc/xhalo-blog-test` remains the private real-content test site.

The landing footer adds a small Hexo/NexT migration note and links to `docs/hexo-next-initialization-and-import.md` without redesigning the existing landing sections.

## Admin UX

The Admin UI now includes:

- `zh-CN` and `en` dictionaries with language selection from `?lang=`, `localStorage.xhalo_admin_lang`, browser language, then `zh-CN` fallback.
- Cleaned mojibake in active Admin modules.
- Menu add, edit, delete, sort, reset, diff preview, and test-only save UI.
- Article template selection, existing source load, Markdown preview, diff, PR plan, Create Review PR gate copy, and Publish to Test result details.
- Multi-file media selection, batch dry-run preview, test-only signed upload, and Markdown snippet copy.
- Dashboard cards for blog stats, media stats, task stats, audit summary, first GitHub admin bootstrap status, and security gate status.
- Audit summary and client-side filtering.

## Worker API

New read/test-only endpoints:

- `GET /api/blog/stats`
- `GET /api/audit-logs/summary`
- `POST /api/site/menu/test-direct-update`

Media signed upload now supports a test-only live path only when all of these are true:

- `DEPLOYMENT_ENV=test`
- `TEST_MEDIA_UPLOAD_ENABLED=true`
- Object key is constrained under `TEST_MEDIA_UPLOAD_PREFIX`, default `xhalo-blog-test/`

Production R2 live upload still requires `LIVE_WRITES_ENABLED=true`.

## Safety Boundaries

- No production direct publish was enabled.
- No production R2 live upload was enabled.
- No `ranbeioc/hexo-blog@main` write is allowed.
- No `xhalo-admin` or `xhalo-blog-admin` project is introduced for the blog admin.
- One real test-only write remains allowed only for `ranbeioc/xhalo-blog-test@main` after owner-authenticated Admin E2E verification.

## Local Verification

Executed successfully after `npm ci`:

```text
npm run check:all
```

This includes Admin build, test Pages build, landing build, examples/templates builds, compatibility checks, migration checks, full test suite, secrets fixture test, syntax check, and secret marker scan.
