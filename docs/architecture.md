# Architecture

`xhalo-blog` separates static publishing from dynamic platform capabilities.

## Layers

1. Static site: Hexo + Cloudflare Pages.
2. Admin UI: Cloudflare Pages or a static app protected by Cloudflare Access.
3. API: Cloudflare Workers or Pages Functions.
4. Data: D1 for metadata, settings, tasks, and audit logs.
5. Assets: R2 for uploaded files and exports.
6. Async jobs: Queues for retries and background work.
7. Anti-abuse: Turnstile, Access, WAF, and rate limits.

Git remains the source of truth for posts and configuration.
