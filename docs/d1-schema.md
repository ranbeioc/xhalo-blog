# D1 Schema

See `workers/api/migrations/0001_initial.sql`.

D1 stores metadata and platform state, not the canonical Markdown source.

Recommended tables:

- `posts_index`
- `site_settings`
- `tasks`
- `audit_logs`

## What belongs in D1

Use D1 for:

- post index metadata
- publishing task state
- settings needed by dynamic platform features
- audit events
- references to R2 or Git objects

Do not treat D1 as the source of truth for full article Markdown in this scaffold stage.

## What should stay outside D1

Keep these out of D1 as the canonical copy:

- full post Markdown source
- theme source files
- static public assets already versioned in Git
- secret material

## Stage 2.5 boundary

The current migration is a placeholder baseline. Future schema changes should be driven by real admin, publishing, and audit flows rather than speculative table expansion.
