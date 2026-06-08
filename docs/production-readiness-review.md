# Production Readiness Review

This document evaluates the production readiness of `xhalo-blog` before any live production integration is authorized. It establishes the mandatory security controls, database backup policies, asset cleanup, and rollback gates.

---

## 1. Security & Authentication Controls

### 1.1 GitHub App Permissions (Least Privilege)
To operate in **Level 2 (PR Generator Mode)**, the GitHub App must be configured with the absolute minimum set of scopes required.
* **Repository Contents**: `Read & Write` (Required to create draft branches and commit Hexo Markdown source files).
* **Repository Pull Requests**: `Read & Write` (Required to open Pull Requests for staging reviews).
* **Repository Metadata**: `Read-only` (Mandatory baseline for all GitHub Apps).
* **All other permissions**: Set to `No Access`.

### 1.2 Branch Protection Rules (`main`)
To enforce review boundaries and prevent direct production contamination:
* **No Direct Pushes**: Direct pushes to `main` must be strictly blocked.
* **Pull Request Review**: At least one approving review from an authorized operator/administrator is required before merging.
* **Dismiss Stale Approvals**: Approvals must be dismissed when new commits are pushed to a draft branch.
* **Linear History**: Force-pushes must be blocked.

### 1.3 Network & API Security
* **Cloudflare Access**: Protect the admin dashboard (`/admin/*`) and administrative API endpoints (`/api/*`) by forcing authentication through Identity Providers (e.g., GitHub, Google, or OTP) restricted to the owner's identity.
* **Admin Shared Secret**: In addition to Cloudflare Access, incoming API requests must supply the `x-xhalo-admin-secret` header verifying they match the configured `ADMIN_API_SHARED_SECRET`.
* **Turnstile Integration**: Protect publish actions with Turnstile challenge tokens passed in the `cf-turnstile-token` header.

---

## 2. Operations & Disaster Recovery

### 2.1 Database (D1) Backup Strategy
* **Automated Backups**: Utilize Cloudflare D1's built-in daily automated backups.
* **Pre-Migration Backups**: Before applying any schema migrations or running major database operations, operators must export a manual SQL snapshot:
  ```bash
  npx wrangler d1 export <database-name> --remote --output ./backups/pre-migration-dump.sql
  ```
* **Restore Verification**: To verify restoration path, dry-run imports of the SQL dump into a local SQLite/D1 sandbox first.

### 2.2 R2 Storage Cleanup Procedures
* **Asset Lifecycles**: Standardize on draft-specific R2 prefixes.
* **Orphaned Draft Cleanup**: If a draft publish is discarded or closed without merging, write a cleanup script or manually purge the R2 objects matching the draft post slug to avoid storage accumulation.

### 2.3 Worker Rollback Plan
* **Instant Rollbacks**: Cloudflare Workers maintain historical deployment versions. If a deployed worker version causes degradation:
  1. Access the Cloudflare Dashboard -> Workers & Pages -> select your worker.
  2. Navigate to the **Deployments** tab.
  3. Locate the last stable deployment and click **Rollback**.
* **Database Rollback**: If a rollback requires schema reversion, apply the corresponding down-migration script manually via Wrangler D1 client.

### 2.4 Audit Log Retention
* **D1 Storage Limit**: Audit logs are written to the D1 `audit_logs` table.
* **Retention Policy**: To prevent database bloating, prune audit logs older than 90 days. Run a periodic maintenance task:
  ```sql
  DELETE FROM audit_logs WHERE timestamp < datetime('now', '-90 days');
  ```

---

## 3. Manual Approval Gates

Transitioning between levels requires explicit human confirmation:
* **Gate 0 -> 1 (Read-Only)**: Verify API compatibility using read-only GitHub credentials against the target production repo.
* **Gate 1 -> 2 (PR Generator Trial)**: Perform a single manual draft publish, verify branch creation and PR content, review code changes, and manually close or merge the PR.
* **Gate 2 -> 3 (Direct Production Writes)**: **STRICTLY PROHIBITED**. The system must never push commits directly to the production branch or bypass the PR approval boundary.
