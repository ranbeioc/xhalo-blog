# Phase 098 Test Site Boundary Correction

## Summary

`ranbeioc/xhalo-blog` is the open-source framework repository. It must not contain the owner's real private blog posts, uploads, or production blog configuration. The real Cloudflare Pages test deployment now belongs to the private repository `ranbeioc/xhalo-blog-test`, which is a Hexo/NexT test-site repository populated from the private `ranbeioc/hexo-blog` source.

## Repository Boundary

| Repository | Role | Write boundary |
| --- | --- | --- |
| `ranbeioc/xhalo-blog` | Open-source framework, Admin/API/Queue source, reusable templates, examples, docs, tests | No real private posts, uploads, production CNAME, deploy secrets, or production blog content |
| `ranbeioc/xhalo-blog-test` | Private real-content test site for Cloudflare Pages project `xhalo-blog-test` | May contain imported Hexo/NexT content and test-only Admin/Landing static assets |
| `ranbeioc/hexo-blog` | Private production content source | Read-only source for this phase; no writes to `main` |

## Cloudflare Pages Binding

Cloudflare Pages project `xhalo-blog-test` should be bound to:

- GitHub repository: `ranbeioc/xhalo-blog-test`
- Branch: `main`
- Build command: `npm ci && npm run build`
- Output directory: `public`
- Runtime env: `NODE_VERSION=20`
- Admin proxy env: `XHALO_ADMIN_API_BASE_URL=https://<staging-api-domain>`

The public test routes remain:

- Home: `https://xhalo-blog-test.pages.dev/`
- Legacy landing page: `https://xhalo-blog-test.pages.dev/landing/`
- Admin: `https://xhalo-blog-test.pages.dev/admin`

## Imported Test Content

The private test-site repository imports the real Hexo/NexT shape from `ranbeioc/hexo-blog`:

- `source/_posts/**`
- `source/upload/**`
- `source/_data/**`
- Hexo pages such as `source/about`, `source/categories`, `source/tags`, and project pages when present
- `themes/next/**`
- `scaffolds/**`
- Hexo build scripts and package metadata

It must not copy production deploy targets, production secrets, production tokens, or any configuration that writes to `ranbeioc/hexo-blog@main`.

## Landing And Admin Mounts

The previous framework landing page remains available at `/landing/` and is linked from the NexT menu. Admin remains available at `/admin/`. Both are static assets inside the private test-site repo and are excluded from Hexo rendering with `skip_render`.

The Pages `_worker.js` in `ranbeioc/xhalo-blog-test` only proxies `/api/*` and `/auth/*` to the staging API. All normal site content is served by Pages static output.

## R2 Boundary

R2 is not a whole-site hosting layer. Pages serves the generated Hexo/NexT HTML, Admin, Landing, CSS, JavaScript, and ordinary static assets. R2 remains reserved for media/attachment asset workflows only.

## Validation

Framework repository validation:

- `npm run check:all`
- `npm run check:secrets`
- `npm test`
- Confirm no root `source/_posts` exists in `ranbeioc/xhalo-blog`

Private test-site validation:

- `npm ci`
- `npm run build`
- `npm run check`
- Confirm `public/index.html`, `public/landing/index.html`, `public/admin/index.html`, and `public/_worker.js`
- Confirm at least three generated post pages
- Confirm output contains NexT CSS/JS markers and not the old hand-written Phase 097 test page

## Current Evidence

- `ranbeioc/xhalo-blog-test` was made private before importing real content.
- Backup branches preserve the prior framework snapshot and the local divergent snapshot.
- The clean import source was a fresh clone of `ranbeioc/hexo-blog`; the local dirty checkout was not used as source.
- `xhalo-blog-test` local verification passed with 58 posts, 10 uploaded asset files, and NexT 8.12.1 build output.
