# D1 Schema

See `workers/api/migrations/0001_initial.sql`.

D1 stores metadata and platform state, not the canonical Markdown source.

Recommended tables:

- `posts_index`
- `site_settings`
- `tasks`
- `audit_logs`
