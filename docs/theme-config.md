# Theme Configuration

`xhalo-blog` starts with Hexo theme compatibility. The first template targets NexT-style configuration through the default `hexo-next` adapter.

The public configuration contract starts from `rb-blog.config.example.json` and maps to:

- Hexo `_config.yml`
- Theme-specific config
- Theme menu config
- Social links
- Comments
- Analytics
- Feature toggles
- Security toggles

Current normalized sections are:

- `site`
- `theme`
- `social`
- `comments`
- `analytics`
- `features`
- `security`

WordPress themes are not compatible.

## Current direction

The scaffold treats `rb-blog.config.example.json` as the public-facing config contract and maps that contract into:

- Hexo site config
- NexT-compatible theme config
- public feature toggles
- optional comment and analytics providers

Current default theme contract:

- `theme.adapter: "hexo-next"`
- `theme.name: "next"`
- `scripts/hexo-asset-image.js` is the default compatibility helper for post asset rewriting in the Hexo paths

## Stage 2.5 defaults

Current defaults are intentionally conservative:

- NexT-compatible baseline
- `post_asset_folder: true`
- placeholder comments and analytics values only
- menu and theme structure that can be documented without private site data

## Boundary

This repository does not promise compatibility with every Hexo theme. `Contract v1` stabilizes the default `hexo-next` adapter, not a permanent one-theme limit.
