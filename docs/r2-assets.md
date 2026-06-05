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
- `POST /api/assets/r2-tasks`

These routes only derive the bucket binding, object key, public URL, and queued task metadata.

They do not yet provide:

- production upload handlers
- signed upload flows
- direct browser-to-R2 uploads
- asset lifecycle cleanup jobs
- historical asset migration tooling
