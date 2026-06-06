# Stable Template Layout

This document freezes the first stable layout boundary for the public scaffold.

## Root layout

The stable repository layout is:

```text
xhalo-blog/
  apps/admin/
  workers/api/
  workers/queue/
  packages/core/
  packages/theme-adapter-hexo/
  examples/basic-blog/
  examples/next-theme-blog/
  templates/hexo-next/
  docs/
```

## Template baseline

The first stable template target is:

```text
templates/hexo-next/
```

Stable expected source files inside that template:

```text
templates/hexo-next/_config.yml
templates/hexo-next/scripts/hexo-asset-image.js
templates/hexo-next/source/_headers
templates/hexo-next/source/_posts/hello-xhalo-blog.md
templates/hexo-next/source/about/index.md
```

Stable expected behavior:

- Hexo-compatible build
- NexT-compatible configuration
- `post_asset_folder: true`
- article permalink structure preserved by the template config
- asset rewrite helper present for post-asset-relative image, FancyBox, and video paths
- `_headers` checked into source for Pages deployment

## Example baselines

The stable example directories are:

```text
examples/basic-blog/
examples/next-theme-blog/
```

Their roles are fixed:

- `basic-blog` is the smallest Pages baseline
- `next-theme-blog` is the runnable Hexo + NexT example baseline

## Generated and local-only artifacts

These are not part of the stable public layout contract:

- `node_modules/`
- `public/`
- local caches
- local screenshots
- temporary build outputs

They may appear in local worktrees but are not scaffold surface area.

## Boundary

What this layout freezes:

- the first-class example directories
- the reusable template directory
- the worker and admin top-level locations
- the shared package boundary used by the scaffold

What it does not freeze:

- every internal file below `node_modules/`
- every future package or helper module name
- every future admin view or worker route
