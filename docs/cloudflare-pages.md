# Cloudflare Pages

Use Pages for the static blog layer.

In Stage 2.5, Pages is still the primary public delivery path. Keep dynamic features off the public request path unless they are clearly isolated.

Recommended configuration for the minimal static example:

```text
Root directory: examples/basic-blog
Build command: npm run build
Build output directory: dist
```

Recommended configuration for the NexT example:

```text
Root directory: examples/next-theme-blog
Build command: npm run build
Build output directory: public
NODE_VERSION: 20
```

Keep HTML cache conservative and static assets cacheable.

## Recommended branch behavior

- `main`: production branch
- non-`main` branches: preview deployments
- preview URLs: keep them on `*.pages.dev`

Do not attach the production custom domain to preview branches.

## Before production cutover

Verify:

- homepage and archive routes return `200`
- static assets are served with the expected cache behavior
- `_headers` is applied to HTML and static files
- `search.xml` and `sitemap.xml` exist when expected

## Stage 2.5 boundary

This repository documents Pages configuration and examples. It does not yet provide a full multi-environment release workflow.
