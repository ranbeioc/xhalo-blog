# Phase 100 - Private xhalo-blog-test Pages Verification

## Current Repository Boundary

`ranbeioc/xhalo-blog` is the open-source framework repository. It stores Admin/API/Queue source, reusable Hexo/NexT templates, docs, and tests. It must not contain the owner's real private blog posts, upload assets, production `CNAME`, production deploy targets, secrets, or production blog configuration.

`ranbeioc/xhalo-blog-test` is the private real-content test-site repository for the Cloudflare Pages project `xhalo-blog-test`. It contains the imported Hexo/NexT test site, test Admin static assets, and the preserved framework landing page.

`ranbeioc/hexo-blog` remains the private production content source. It is read-only for this phase, and `main` must not be written by xhalo-blog test flows.

## Cloudflare Pages Binding

Verified target for the active test site:

| Setting | Value |
| --- | --- |
| Pages project | `xhalo-blog-test` |
| Pages domain | `https://xhalo-blog-test.pages.dev/` |
| GitHub repository | `ranbeioc/xhalo-blog-test` |
| Repository visibility | Private |
| Branch | `main` |
| Build command | `npm ci && npm run build` |
| Build output directory | `public` |
| Runtime env | `NODE_VERSION=20` |
| Admin API env | `XHALO_ADMIN_API_BASE_URL=https://<staging-api-domain>` |

This binding keeps real blog content out of `ranbeioc/xhalo-blog` while still exercising the real Pages, Hexo, NexT, Admin, and staging API path.

## Test Site Routes

Verified test routes:

| Route | Expected behavior | Current result |
| --- | --- | --- |
| `/` | Hexo/NexT blog homepage | `200`, NexT HTML |
| `/landing/` | Preserved framework landing page | `200`, landing HTML |
| `/admin` | Redirects to Admin static entry | `301` to `/admin/`, then `200` |
| `/admin/` | Admin static entry | `200`, Admin HTML |

## Admin Route

The Admin source remains reusable framework code in `ranbeioc/xhalo-blog/apps/admin`. The built Admin static assets are copied into the private `ranbeioc/xhalo-blog-test` repository under `source/admin/` for same-domain test-site verification.

`xhalo-admin` is not the blog Admin target. No `xhalo-blog-admin` Cloudflare Pages project is required or expected.

## API/Auth Proxy Route

The private test-site `_worker.js` only proxies `/api/*` and `/auth/*` to `xhalo-blog-staging-api`.

Verified route:

```text
GET https://xhalo-blog-test.pages.dev/api/auth/session
```

Current unauthenticated result:

```json
{
  "authenticated": false
}
```

All ordinary HTML, CSS, JavaScript, uploads, images, and theme assets are served by Cloudflare Pages static output, not by the staging API Worker.

## R2 Boundary

R2 is not a whole-site hosting layer. Cloudflare Pages serves the generated Hexo/NexT blog HTML, Admin frontend, landing page, theme assets, and ordinary static files.

R2 remains an asset layer for media, attachments, and upload workflows only. R2 defaults stay dry-run unless a separate owner approval explicitly authorizes live R2 writes.

## Framework Repository Hygiene

The open-source `ranbeioc/xhalo-blog` repository must remain clean:

- No root `source/_posts/**`.
- No root `source/upload/**`.
- No root production `CNAME`.
- No real private posts or private upload assets.
- No production deploy targets that write to `ranbeioc/hexo-blog@main`.
- No committed secrets or deploy hooks.

Templates and examples may contain synthetic fixtures and starter posts only.

## Private Test Repository Expectations

`ranbeioc/xhalo-blog-test` should contain the real test-site Hexo/NexT shape:

- `source/_posts/**` and `source/upload/**` for private test content.
- `themes/next/**` for NexT rendering parity.
- `source/landing/**` with `skip_render: landing/**`.
- `source/admin/**` with `skip_render: admin/**`.
- `source/_worker.js` with proxy handling only for `/api/*` and `/auth/*`.
- `_config.yml` with `url: https://xhalo-blog-test.pages.dev`, `theme: next`, and disabled Hexo deploy target.

The local directory `C:\Users\ranbe\Documents\Github\xhalo-blog-test` must not be treated as current unless it is explicitly refreshed from `origin/main`.

## CI Visibility Status

`ranbeioc/xhalo-blog` uses a single visible GitHub Actions workflow:

```text
.github/workflows/check.yml
```

The workflow validates scaffold, tests, secrets checks, Admin build, and `build:test-pages`. It must not contain deploy steps, `wrangler deploy`, Cloudflare Pages deploy commands, release publishing, tag mutation, or writes to `hexo-blog`.

## No Production Write Confirmation

No `ranbeioc/hexo-blog@main` mutation occurred.
No production direct publish occurred.
No production direct update occurred.
No production R2 live upload occurred.
No production menu config write occurred.
No `xhalo-admin` project was modified.
No `xhalo-blog-admin` project was created.
No secrets were logged or committed.

## Verdict

Phase 100 verifies that `xhalo-blog-test.pages.dev` is now the private `ranbeioc/xhalo-blog-test@main` Pages test site. The open-source framework repository remains clean, R2 is not used as whole-site hosting, and the only active Pages site build output for real testing is `public` from the private test-site repository.
