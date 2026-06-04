# Cloudflare Pages

Use Pages for the static blog layer.

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
