# Hexo NexT Optional Compatibility

The default `hexo-next` path in `xhalo-blog` now carries a compatibility helper and an optional plugin baseline derived from `hexo-blog` production learnings.

## Included compatibility helper

Both of these paths now include:

```text
scripts/hexo-asset-image.js
```

The helper rewrites post-asset-relative paths after render for:

- `img[src]`
- `img[data-src]`
- FancyBox image `href`
- `video > source[src]`
- `video.fancybox-video[poster]`

This keeps `post_asset_folder` compatible with lazyload, FancyBox, and video asset paths under permalink-based article output.

## Optional plugin baseline

The Hexo template and runnable example now include these packages:

- `@waline/hexo-next`
- `cheerio`
- `hexo-generator-baidu-sitemap`
- `hexo-generator-searchdb`
- `hexo-tag-chart`

These packages expand compatibility, but they do not imply that every capability is enabled by default or production-hardened.

`hexo-tag-mmedia` remains a pending compatibility item. The current upstream plugin shape throws a load error under the current Hexo 6.2 baseline, so it is documented in the compatibility matrix but not included by default in the runnable template and example.

## What this means

- searchdb and baidusitemap packages are available for downstream enablement
- chart tags are available in the compatible Hexo path
- Waline placeholder support is available without shipping a real production endpoint
- article asset rewriting now matches the expected production-style behavior more closely

## What this does not mean

- no real analytics, comments, or production content is included
- no permalink change is introduced
- no claim is made that every plugin path is fully hardened for production
