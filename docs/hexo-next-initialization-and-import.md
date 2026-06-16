# Hexo NexT Initialization And Import

This document makes Hexo/NexT initialization the standard first path for `xhalo-blog`.

## Early Standard Flow

New projects should start with one of two modes:

1. Starter mode: no historical content is available.
2. Hexo import mode: an existing local Hexo blog repository is available.

Both modes use NexT as the default theme baseline and produce a deployable Hexo site for Cloudflare Pages.

## Starter Mode

Use starter mode when there is no historical Hexo blog to import:

```bash
npm run init:hexo-next -- --target ../my-blog-test
```

The generated site contains:

- `theme: next`
- `post_asset_folder: true`
- a default welcome test article
- a small compatibility fixture article
- `source/_headers` for Cloudflare Pages
- deploy targets disabled in `_config.yml`

Recommended Pages settings:

```text
Build command: npm ci && npm run build
Output directory: public
Environment variable: NODE_VERSION=20
```

## Hexo Import Mode

Use import mode when an existing local Hexo repository should seed a private test site:

```bash
npm run init:hexo-next -- --target ../my-blog-test --source ../hexo-blog --site-url https://my-blog-test.pages.dev
```

The importer copies only the safe Hexo/NexT allowlist:

- `source/_posts/**`
- `source/upload/**`
- `source/_data/**`
- static pages such as `source/about`, `source/categories`, `source/tags`, `source/project`, and `source/projects`
- `themes/next/**`
- `scaffolds/**`
- Hexo package metadata and build scripts

The importer intentionally excludes:

- `CNAME`
- `.github/**`
- `.env*`
- `.deploy_git/**`
- `public/**`
- `node_modules/**`
- `db.json`
- production deploy targets in `_config.yml`

The command fails if the target directory is not empty. This prevents accidental overwrites and keeps real-content imports explicitly staged in a private repository.

## Required Boundary

`ranbeioc/xhalo-blog` remains the open-source framework repository. Real historical posts and upload assets must be imported into a private site repository such as `ranbeioc/xhalo-blog-test`, not into this framework repository.

## Mid-Term URL Import Flow

The next migration layer can support pasting a public blog URL into Admin and importing content through a review workflow:

1. Admin accepts a source blog URL.
2. A crawler discovers sitemap, RSS/Atom, archive pages, post pages, menu links, categories, tags, and media assets.
3. The crawler stores a draft import manifest, not direct site changes.
4. Admin presents conflicts for review: slug collisions, missing dates, duplicate titles, menu collisions, unsupported embeds, oversized assets, and external media hotlinks.
5. The owner edits mappings and confirms import.
6. The system opens a test-site PR with generated Markdown, asset folders, menu changes, and an import report.

The URL importer must stay non-mutating until owner confirmation. Production repositories and `hexo-blog@main` remain forbidden write targets unless a separate approval gate is recorded.
