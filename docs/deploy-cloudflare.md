# Deploy to Cloudflare

## Cloudflare Pages

For `examples/basic-blog`:

```text
Build command: npm run build
Build output directory: dist
Root directory: examples/basic-blog
```

For `examples/next-theme-blog`:

```text
Build command: npm run build
Build output directory: public
Root directory: examples/next-theme-blog
NODE_VERSION: 20
```

Use `examples/basic-blog` for the smallest static baseline and `examples/next-theme-blog` for a Hexo-compatible baseline.

## Workers

Copy `wrangler.toml.example` to `wrangler.toml`, fill in your own resource IDs, then deploy API workers from `workers/api`.

Do not commit real account IDs, zone IDs, tokens, or secrets.

## Suggested deploy order

1. Verify the example or template builds locally.
2. Connect the repository to Cloudflare Pages.
3. Confirm preview deployments work on non-`main` branches.
4. Confirm `main` is the production branch.
5. Only then attach a custom domain.
6. Deploy workers after the static site baseline is stable.

## Stage 2.5 boundary

This document is about baseline deployment wiring. It is not a release automation playbook for a full application stack.
