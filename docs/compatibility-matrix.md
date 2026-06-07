# Compatibility Matrix

| Capability | hexo-blog production | xhalo-blog current | Status | Next action |
|---|---|---|---|---|
| Hexo 6.2 | `hexo@^6.2.0` | `hexo@^6.2.0` in template and example | supported | keep locked in compatibility docs |
| NexT 8.14 | `hexo-theme-next@^8.14.2` | `hexo-theme-next@^8.14.2` in template and example | supported | keep `hexo-next` as default adapter |
| Permalink `:year/:month/:day/:title/` | enabled | present in Hexo example baseline | supported | keep documented in template contract |
| `post_asset_folder` | enabled | enabled in template and example | supported | retain in config mapping docs |
| Cloudflare `_headers` | production cache and security headers | example and template `_headers` included | partial | expand doc notes for cache policy parity |
| Asset path rewrite script | custom `scripts/hexo-asset-image.js` | helper now included in template and example | supported | keep build coverage on the Hexo paths |
| Lazyload image paths | production-validated | fixture-backed via asset rewrite helper | supported | keep fixture checks in `check:compat` |
| FancyBox image href paths | production-validated | fixture-backed via asset rewrite helper | supported | keep fixture checks in `check:compat` |
| Video source and poster paths | production-validated | fixture-backed via asset rewrite helper | supported | keep fixture checks in `check:compat` |
| PDF tag support | enabled | fixture-backed in template and example | supported | keep fixture post and generated-output checks |
| Chart tag support | enabled | fixture-backed in template and example | supported | keep fixture post and generated-output checks |
| mmedia tag support | enabled | not included by default due current Hexo 6.2 plugin compatibility issue | planned | revisit with a working replacement or patched plugin |
| Waline | enabled in production baseline | placeholder-only | partial | keep provider placeholder docs and auth warnings |
| searchdb | enabled | generated output checked in fixture builds | supported | keep output checks in `check:compat` |
| sitemap | enabled | enabled in template/example dependency set | supported | keep in example build checks |
| baidusitemap | enabled | generated output checked in fixture builds | supported | keep output checks in `check:compat` |
| analytics placeholders | production IDs omitted from scaffold | placeholder-only | supported | keep scanner coverage and blank defaults |
| reward placeholders | production-specific values omitted from scaffold | not included by default | not included by default | keep out of default scaffold |
