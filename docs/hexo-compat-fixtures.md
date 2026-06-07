# Hexo Compatibility Fixtures

`xhalo-blog` now carries a runnable Hexo compatibility fixture in both:

- `examples/next-theme-blog`
- `templates/hexo-next`

The fixture post is:

```text
2026-06-02-hexo-compatibility-fixtures.md
```

Its asset directory contains placeholder fixture files for:

- image `src`
- image `data-src`
- FancyBox image `href`
- video `poster`
- video `source[src]`
- PDF tag output
- Chart tag output

## Why this exists

Stage 3.4 documented the `hexo-next` compatibility surface. Stage 3.5 hardens it by verifying that the runnable example and reusable template both generate the expected outputs.

This fixture does not copy any production content from `hexo-blog`. It uses placeholder files and sample chart data only.

## What `npm run check:compat` verifies

After the Hexo example and template build, the repository checks:

- generated post HTML exists
- copied fixture assets exist in `public/`
- rewritten asset paths are present in the generated HTML
- `search.xml` contains the fixture post
- `sitemap.xml` contains the fixture post
- `baidusitemap.xml` is generated

## Current boundary

The fixture covers the stable `hexo-next` baseline:

- permalink `:year/:month/:day/:title/`
- `post_asset_folder`
- `_headers`
- asset rewrite helper parity
- PDF tag
- Chart tag
- searchdb
- sitemap
- baidusitemap

It does not make `mmedia` first-class by default. That remains pending until a compatible plugin path exists under the current Hexo 6.2 baseline.
