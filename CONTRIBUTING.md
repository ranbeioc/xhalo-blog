# Contributing to xhalo-blog

Thanks for helping improve `xhalo-blog`.

## Development principles

1. Keep the public static site stable.
2. Keep dynamic Cloudflare features optional and isolated.
3. Do not commit secrets or production-only configuration.
4. Prefer small pull requests with clear scope.
5. Keep Hexo theme compatibility in mind.

## Local checks

```bash
npm install
npm run check
```

## Pull request expectations

- Explain the problem and solution.
- Include documentation changes for user-facing behavior.
- Include migration notes if configuration changes.
- Avoid committing generated output such as `public/`, `.deploy_git/`, or local caches.

## Security issues

Do not open a public issue for sensitive security reports. See `SECURITY.md`.
