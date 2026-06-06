# Public Configuration Contract

This document tracks `Contract v1`, the public scaffold baseline for downstream `xhalo-blog` repositories.

`Contract v1` documents file names, top-level sections, and default binding names. It does not mean the runtime API or provider integrations are production-ready.

## Contract files

The public contract is defined by these root files:

```text
rb-blog.config.example.json
.env.example
wrangler.toml.example
```

## `rb-blog.config.example.json`

Stable top-level sections:

- `site`
- `theme`
- `social`
- `comments`
- `analytics`
- `features`
- `security`

Required expectations:

- `site.url` must be an `https://` URL
- `theme.adapter` must be present and currently defaults to `hexo-next`
- `theme.name` currently defaults to `next`
- `theme.menu` remains an array of public navigation items
- `comments.serverUrl` remains the public comment endpoint field
- `features.postAssetFolder` remains a boolean
- `security.turnstile` and `security.access` remain booleans

`Contract v1` stabilizes the default `hexo-next` adapter, not a permanent one-theme limit.

## `.env.example`

Stable environment groups:

- site and request-gating placeholders
- analytics placeholders
- Firebase / Firestore placeholders
- Cloudflare resource placeholders
- GitHub repository and publish auth placeholders
- preview deployment reconciliation placeholders
- Turnstile placeholders

Current baseline keys:

```text
SITE_URL
LIVE_WRITES_ENABLED
ADMIN_API_SHARED_SECRET
WALINE_SERVER_URL
GOOGLE_ANALYTICS_ID
BAIDU_ANALYTICS_ID
GROWINGIO_PROJECT_ID
CLOUDFLARE_ANALYTICS_TOKEN
CLARITY_PROJECT_ID
FIRESTORE_API_KEY
FIRESTORE_PROJECT_ID
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID
ASSETS_PUBLIC_BASE_URL
ASSETS_SIGNING_SECRET
GITHUB_OWNER
GITHUB_REPO
GITHUB_BRANCH
GITHUB_WEBHOOK_SECRET
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_INSTALLATION_ID
GITHUB_TOKEN
PREVIEW_WEBHOOK_SECRET
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

## `wrangler.toml.example`

Stable infrastructure bindings:

- worker entry: `workers/api/src/index.js`
- D1 binding: `DB`
- R2 binding: `ASSETS`
- queue binding: `TASK_QUEUE`
- queue name: `xhalo-blog-tasks`

## Compatibility boundary

What `Contract v1` guarantees:

- documented file names stay stable
- documented top-level config sections stay stable
- default Worker entry and binding names stay documented
- the NexT-compatible template remains the first-class example path

What `Contract v1` does not guarantee:

- production-ready admin API
- stable runtime API semantics
- production-ready provider integrations
- complete auth, abuse protection, and retry pipelines
