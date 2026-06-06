# Compatibility Matrix

| Capability | hexo-blog production | xhalo-blog current | Status | Next action |
|---|---|---|---|---|
| Hexo 6.2 | `hexo@^6.2.0` | `hexo@^6.2.0` in template and example | supported | keep locked in compatibility docs |
| NexT 8.14 | `hexo-theme-next@^8.14.2` | `hexo-theme-next@^8.14.2` in template and example | supported | keep `hexo-next` as default adapter |
| Permalink `:year/:month/:day/:title/` | enabled | present in Hexo example baseline | supported | keep documented in template contract |
| `post_asset_folder` | enabled | enabled in template and example | supported | retain in config mapping docs |
| Cloudflare `_headers` | production cache and security headers | example and template `_headers` included | partial | expand doc notes for cache policy parity |
| Asset path rewrite script | custom `scripts/hexo-asset-image.js` | not included by default | planned | add a regression fixture or optional helper doc |
| Lazyload image paths | production-validated | not included by default | planned | document expected adapter behavior |
| FancyBox image href paths | production-validated | not included by default | planned | add optional compatibility notes |
| Video source and poster paths | production-validated | not included by default | planned | add optional compatibility notes |
| PDF tag support | enabled | not included by default | planned | document optional plugin path |
| Chart tag support | enabled | not included by default | planned | document optional plugin path |
| mmedia tag support | enabled | not included by default | planned | document optional plugin path |
| Waline | enabled in production baseline | placeholder-only | partial | keep provider placeholder docs and auth warnings |
| searchdb | enabled | not included by default | planned | document optional plugin path |
| sitemap | enabled | enabled in template/example dependency set | supported | keep in example build checks |
| baidusitemap | enabled | not included by default | planned | document optional plugin path |
| analytics placeholders | production IDs omitted from scaffold | placeholder-only | supported | keep scanner coverage and blank defaults |
| reward placeholders | production-specific values omitted from scaffold | not included by default | not included by default | keep out of default scaffold |
