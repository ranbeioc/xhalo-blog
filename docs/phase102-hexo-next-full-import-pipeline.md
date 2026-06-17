# Phase 102 Hexo NexT Full Import Pipeline

## Summary

Phase 102 turns Hexo/NexT initialization into the standard xHalo migration path.
The open-source `ranbeioc/xhalo-blog` repository owns reusable framework code,
Admin source, Workers, templates, tests, and migration tooling only. Real posts,
upload assets, and private production blog configuration must stay outside this
repository.

The standard route is:

- Framework source: `ranbeioc/xhalo-blog`
- Historical source data: `ranbeioc/hexo-blog` as read-only input
- Private test-site repository: `ranbeioc/xhalo-blog-test`
- Cloudflare Pages project: `xhalo-blog-test`
- Pages build command: `npm ci && npm run build`
- Pages output directory: `public`

## Implemented Standard Flow

`npm run init:hexo-next` now supports two explicit modes:

- `starter`: generate a default Hexo/NexT site with welcome test content.
- `import`: generate a private test-site structure from a local Hexo/NexT
  source repository.

When `--source` is provided, import mode is inferred. When no `--source` is
provided, starter mode is inferred.

## Import Coverage

Import mode preserves the parts that make an existing Hexo/NexT blog behave like
the historical site:

- `source/_posts/**`
- `source/upload/**`
- `source/_data/**`
- static pages under `source/**`
- `scaffolds/**`
- `scripts/**`
- `themes/next/**`
- root `_config*.yml` files
- `package.json`
- supported package lockfiles

The importer keeps NexT menu, theme settings, optional plugin configuration,
feed/search/sitemap/media settings, and package dependencies for owner review.

## Safety Rewrites

The importer only rewrites environment-bound fields:

- `url` may be replaced by `--site-url`.
- `title` may be replaced by `--site-title`.
- top-level `deploy` is removed and re-added as an intentionally empty block.
- `skip_render` is merged with `_headers`, `_worker.js`, `admin/**`, and
  `landing/**`.

The importer excludes unsafe project artifacts:

- `CNAME`
- `.github/**`
- `.env*`
- `.deploy_git/**`
- `node_modules/**`
- `public/**`
- `db.json`

## Audit Outputs

Every generated site receives:

- `.xhalo-import-manifest.json`
- `.xhalo-import-report.md`

The manifest uses version `2` and records:

- `mode`
- `sourceLabel`
- `targetLabel`
- `siteUrl`
- `siteTitle`
- `counts`
- `copied`
- `rewritten`
- `disabled`
- `needsReview`
- `blocked`
- `warnings`

The report intentionally uses source and target labels instead of local absolute
paths. It is safe to commit in a private test-site repository for owner review.

## Test-Site Mounts

Generated private test sites keep the current Pages layout:

- Hexo/NexT serves the homepage, archives, categories, tags, and articles.
- `/landing/` is reserved for the preserved xHalo framework landing page.
- `/admin/` is reserved for the same-domain Admin static build.
- Pages `_worker.js` proxies only `/api/*` and `/auth/*` to the staging API.
- R2 remains a media and attachment asset layer only, not whole-site hosting.

## URL Import Roadmap

The medium-term URL import path remains future work. The intended direction is:

1. Admin accepts a public blog URL.
2. A crawler discovers sitemap, RSS or Atom feeds, archive pages, post pages,
   menu links, categories, tags, and media assets.
3. The crawler writes a draft import manifest, not direct repository changes.
4. Admin lets the owner resolve slug collisions, menu conflicts, duplicate
   titles, unsupported embeds, missing dates, and external media decisions.
5. Owner confirmation generates a test-site PR with Markdown, assets, config
   changes, and an import report.

This phase does not implement the crawler.

## Boundary Confirmation

No real private blog content, upload assets, production CNAME, production deploy
target, token, or secret is committed to `ranbeioc/xhalo-blog` in this phase.
`ranbeioc/hexo-blog@main` remains read-only. Phase 102 does not execute test
direct publish and does not perform any production write.
