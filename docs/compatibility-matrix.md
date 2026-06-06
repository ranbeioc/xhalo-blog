# Compatibility Matrix

| Capability | hexo-blog production | xhalo-blog current | Status | Next action |
|---|---|---|---|---|
| Hexo 6.2 | `hexo@^6.2.0` | `hexo@^6.2.0` in template and example | supported | keep locked in compatibility docs |
| NexT 8.14 | `hexo-theme-next@^8.14.2` | `hexo-theme-next@^8.14.2` in template and example | supported | keep `hexo-next` as default adapter |
| Permalink `:year/:month/:day/:title/` | enabled | present in Hexo example baseline | supported | keep documented in template contract |
| `post_asset_folder` | enabled | enabled in template and example | supported | retain in config mapping docs |
| Cloudflare `_headers` | production cache and security headers | example and template `_headers` included | partial | expand doc notes for cache policy parity |
| Asset path rewrite script | custom `scripts/hexo-asset-image.js` | helper now included in template and example | supported | keep build coverage on the Hexo paths |
| Lazyload image paths | production-validated | compatible via asset rewrite helper | supported | add regression fixtures when content fixtures expand |
| FancyBox image href paths | production-validated | compatible via asset rewrite helper | supported | add regression fixtures when content fixtures expand |
| Video source and poster paths | production-validated | compatible via asset rewrite helper | supported | add regression fixtures when content fixtures expand |
| PDF tag support | enabled | plugin package included in compatible Hexo path | partial | add sample content fixture and doc example |
| Chart tag support | enabled | plugin package included in compatible Hexo path | partial | add sample content fixture and doc example |
| mmedia tag support | enabled | not included by default due current Hexo 6.2 plugin compatibility issue | planned | revisit with a working replacement or patched plugin |
| Waline | enabled in production baseline | placeholder-only | partial | keep provider placeholder docs and auth warnings |
| searchdb | enabled | plugin package included in compatible Hexo path | partial | add sample search output fixture and config note |
| sitemap | enabled | enabled in template/example dependency set | supported | keep in example build checks |
| baidusitemap | enabled | plugin package included in compatible Hexo path | partial | add config note and output fixture |
| analytics placeholders | production IDs omitted from scaffold | placeholder-only | supported | keep scanner coverage and blank defaults |
| reward placeholders | production-specific values omitted from scaffold | not included by default | not included by default | keep out of default scaffold |
