# D1 Database Migrations

This document describes the Cloudflare D1 migration strategy for xhalo-blog.

## Migration Files

| File | Purpose | Added in |
|---|---|---|
| `0001_initial.sql` | Create `posts_index`, `site_settings`, `tasks`, `audit_logs` tables | Stage 3 initial |
| `0002_add_posts_content.sql` | Add `content TEXT` column to `posts_index` | Hardening phase |
| `0003_harden_posts_index_constraints.sql` | Create unique index on slug and performance indexes | Stage 4 hardening |
| `0004_add_posts_index_preview_url.sql` | Add `preview_url TEXT` column to `posts_index` table | Stage 4 hardening |
| `0005_create_audit_logs.sql` | Create `audit_logs` table with indexes for observability | Stage 4-C observability |
| `0006_create_admin_users.sql` | Create `admin_users` table for first-login GitHub admin bootstrap | Phase 097-B |


## New Environment Setup

For a fresh D1 database, execute all migrations in sequential order:

```bash
npx wrangler d1 migrations apply <DB_NAME>
```

This runs `0001_initial.sql` through `0006_create_admin_users.sql` sequentially:
- `0001_initial.sql` creates baseline tables (`posts_index`, `site_settings`, `tasks`).
- `0002_add_posts_content.sql` adds the `content TEXT` column to `posts_index`.
- `0003_harden_posts_index_constraints.sql` adds the unique slug index and status/published_at performance indexes.
- `0004_add_posts_index_preview_url.sql` adds the `preview_url TEXT` column.
- `0005_create_audit_logs.sql` creates the full 14-column `audit_logs` table with performance indexes.
- `0006_create_admin_users.sql` creates the `admin_users` table with role index.

All migrations execute without conflicts on fresh databases.

## Existing Environment Upgrade

For existing databases that have already applied earlier migrations, Wrangler D1 tracks applied migration files in its internal `d1_migrations` table and will only execute unapplied migrations.

To verify applied migrations:

```sql
PRAGMA table_info(posts_index);
```
You should see `content` and `preview_url` in the output.

## Unique Index Upgrade & Preflight Checks (0003)

Migration `0003_harden_posts_index_constraints.sql` adds a `UNIQUE` index on the `slug` column to prevent duplicate post routes, along with performance tuning lookup indexes.

### Preflight: Check for Duplicate Slugs

Because SQLite does not allow creating a `UNIQUE` index on columns that contain duplicate values, you **must check for and clean up duplicate slugs** in your existing D1 database before applying this migration.

Run this preflight query in your D1 database:

```sql
SELECT slug, COUNT(*) AS count
FROM posts_index
GROUP BY slug
HAVING count > 1;
```

- **If the query returns zero rows**: You can safely apply migration 0003.
- **If the query returns duplicate rows**: Do **not** apply the migration yet. You must manually resolve the duplicates by renaming or deleting the conflicting records in `posts_index`.

Once all duplicate slugs are resolved, apply the migration:

```bash
npx wrangler d1 migrations apply <DB_NAME>
```

### Rollback Strategy

If you need to roll back the constraint changes introduced in 0003:

```sql
DROP INDEX IF EXISTS idx_posts_index_slug;
DROP INDEX IF EXISTS idx_posts_index_status;
DROP INDEX IF EXISTS idx_posts_index_published_at;
```

If you need to roll back the preview URL column changes introduced in 0004:

```sql
ALTER TABLE posts_index DROP COLUMN preview_url;
```

If you need to roll back the audit logs table introduced in 0005:

```sql
DROP TABLE IF EXISTS audit_logs;
```

If you need to roll back the admin user table introduced in 0006:

```sql
DROP TABLE IF EXISTS admin_users;
```

## Local Development

For local D1 preview databases (used with `wrangler dev`), Wrangler automatically applies migrations. If you encounter the duplicate column error during local development, delete the local `.wrangler/state` directory and restart:

```bash
rm -rf .wrangler/state
npx wrangler dev
```

## Migration Best Practices

- **Never modify** an already-deployed migration file (e.g., `0001_initial.sql`).
- Always create a **new forward migration** file for schema changes.
- Document upgrade steps for each migration.
- Test migrations against both fresh and existing databases.
