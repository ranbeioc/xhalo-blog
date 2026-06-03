# Deploy to Cloudflare

## Cloudflare Pages

For `examples/next-theme-blog`:

```text
Build command: npm run build
Build output directory: public
Root directory: examples/next-theme-blog
NODE_VERSION: 20
```

## Workers

Copy `wrangler.toml.example` to `wrangler.toml`, fill in your own resource IDs, then deploy API workers from `workers/api`.

Do not commit real account IDs, zone IDs, tokens, or secrets.
