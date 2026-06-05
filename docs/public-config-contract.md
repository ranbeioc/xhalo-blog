# Public Configuration Contract

This document freezes the public scaffold contract that downstream `xhalo-blog` repositories are expected to start from.

## Contract files

The stable public contract is defined by these root files:

```text
rb-blog.config.example.json
.env.example
wrangler.toml.example
```

These files are the supported handoff surface for users adopting the scaffold.

## `rb-blog.config.example.json`

The stable top-level sections are:

- `site`
- `theme`
- `social`
- `comments`
- `analytics`
- `features`
- `security`

Required expectations:

- `site.url` must be an `https://` URL
- `theme.name` stays `next`
- `theme.menu` stays an array of public navigation items
- `comments.serverUrl` remains the public comment endpoint field
- `features.postAssetFolder` remains a boolean
- `security.turnstile` and `security.access` remain booleans

The stable contract does not guarantee that every future field is required, but it does guarantee that these sections and core field names remain the compatibility baseline for the scaffold.

## `.env.example`

Stable environment groups:

- site and comment placeholders
- analytics placeholders
- Firebase / Firestore placeholders
- Cloudflare resource placeholders
- GitHub repository and publish auth placeholders
- preview deployment reconciliation placeholders
- Turnstile placeholders

Current stable placeholder keys:

```text
SITE_URL
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

The scaffold may add optional placeholders later, but these names are the stable baseline for current docs, checks, and examples.

## `wrangler.toml.example`

The stable infrastructure bindings are:

- worker entry: `workers/api/src/index.js`
- D1 binding: `DB`
- R2 binding: `ASSETS`
- queue binding: `TASK_QUEUE`
- queue name: `xhalo-blog-tasks`

These names are now part of the stable public scaffold contract.

## Compatibility boundary

What this contract guarantees:

- documented field names stay stable
- the NexT-compatible template remains the first-class example path
- Pages + Worker + D1 + R2 + Queue placeholders remain aligned with the published docs

What this contract does not guarantee:

- every provider integration is production-ready
- every queue task type has a full retry pipeline
- every future Hexo theme is supported
- the placeholder admin API is a finished product
