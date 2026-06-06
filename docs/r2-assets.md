# R2 Asset Convention

Recommended bucket layout:

```text
r2://xhalo-blog-assets/
  uploads/yyyy/mm/dd/<uuid>-<filename>
  posts/<post-slug>/<filename>
  exports/yyyy-mm-dd/<backup>.zip
  imports/<task-id>/
```

Do not migrate historical Git assets to R2 without URL mapping and regression testing.

## Recommended use

Use R2 for:

- uploaded media from future admin flows
- generated exports
- temporary import bundles
- derivative assets that do not belong in the canonical post repository

Keep canonical Markdown and small example assets in Git.

## URL strategy

Pick one public asset path strategy and keep it stable:

- direct R2 public domain
- Cloudflare custom domain in front of R2
- Worker-mediated asset URLs

Do not switch URL shape later without a migration and redirect plan.

## Stage 3 prototype

This repository now includes dry-run scaffold routes for upload planning:

- `GET /api/assets/r2-template`
- `POST /api/assets/r2-preview`
- `POST /api/assets/r2-signed-upload`
- `POST /api/assets/r2-tasks`

This repository now also includes two bounded live prototypes:

- `POST /api/assets/r2-upload`
- `PUT /api/assets/r2-upload/:token`

The signed route mints a short-lived worker upload URL. The token route consumes that URL, expects the admin request secret header, and writes the bytes to R2. It is not one-time unless nonce consumption is added.

They do not yet provide:

- production upload handlers
- direct browser-to-R2 uploads
- asset lifecycle cleanup jobs
- historical asset migration tooling
