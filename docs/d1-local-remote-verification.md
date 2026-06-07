# D1 Local & Remote Database Verification

This document provides step-by-step instructions for executing, auditing, and rolling back Cloudflare D1 migrations.

## 1. Database Backups (Production Best Practice)

> [!CAUTION]
> **Always back up your D1 database before applying new migrations remotely.** If a schema migration fails mid-way, or data gets corrupted, you must have a backup to restore the state.

### Create a D1 Database Backup:
```bash
npx wrangler d1 backup create <DB_NAME>
```

### List Available Backups:
```bash
npx wrangler d1 backup list <DB_NAME>
```

---

## 2. Local Database Verification

During local development (using `wrangler dev` or local testing), Wrangler stores D1 state in a local SQLite file under `.wrangler/state`.

### A. Apply Migrations Locally
To manually apply migrations to your local D1 instance:
```bash
npx wrangler d1 migrations apply xhalo-blog --local
```

### B. Inspect Local Database Schema
Verify that the tables and schemas are set up correctly:
```bash
npx wrangler d1 execute xhalo-blog --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

To verify the `posts_index` schema structure:
```bash
npx wrangler d1 execute xhalo-blog --local --command "PRAGMA table_info(posts_index);"
```

To inspect existing indexes:
```bash
npx wrangler d1 execute xhalo-blog --local --command "PRAGMA index_list(posts_index);"
```

---

## 3. Remote Database Verification

### A. Check Migration Status Remotely
See which migrations have been applied to your production database:
```bash
npx wrangler d1 migrations list <DB_NAME> --remote
```

### B. Apply Migrations Remotely
To apply migrations (such as `0003_harden_posts_index_constraints.sql`) to your live production D1 database:
```bash
npx wrangler d1 migrations apply <DB_NAME> --remote
```

### C. Inspect Remote Database Schema
Verify the schema on your remote production database:
```bash
npx wrangler d1 execute <DB_NAME> --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Verify that the unique slug index `idx_posts_index_slug` is active:
```bash
npx wrangler d1 execute <DB_NAME> --remote --command "PRAGMA index_list(posts_index);"
```
