# D1 Database Migrations

This document describes the Cloudflare D1 migration strategy for xhalo-blog.

## Migration Files

| File | Purpose | Added in |
|---|---|---|
| `0001_initial.sql` | Create `posts_index`, `site_settings`, `tasks`, `audit_logs` tables | Stage 3 initial |
| `0002_add_posts_content.sql` | Add `content TEXT` column to `posts_index` | Hardening phase |

## New Environment Setup

For a fresh D1 database, execute all migrations in order:

```bash
npx wrangler d1 migrations apply <DB_NAME>
```

This runs `0001_initial.sql` then `0002_add_posts_content.sql`. Since `0001_initial.sql` already includes the `content TEXT` column in the `CREATE TABLE` statement, `0002` will fail with `duplicate column name: content`. This is expected and safe — see "Handling Duplicate Column" below.

## Existing Environment Upgrade

If your D1 database was created with an older version of `0001_initial.sql` that did **not** include the `content` column:

1. Run the forward migration:
   ```bash
   npx wrangler d1 execute <DB_NAME> --file=workers/api/migrations/0002_add_posts_content.sql
   ```

2. Verify the column exists:
   ```sql
   PRAGMA table_info(posts_index);
   ```
   You should see `content` in the output.

## Handling Duplicate Column

If `0001_initial.sql` already includes `content TEXT` in the `CREATE TABLE` statement, running `0002_add_posts_content.sql` will produce:

```
Error: duplicate column name: content
```

This is **safe to ignore**. The column already exists and no data is lost. To confirm:

```sql
PRAGMA table_info(posts_index);
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
