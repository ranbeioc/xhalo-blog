# Production Rollback Plan

This document details the contingency and recovery procedures for rolling back components of the `xhalo-blog` deployment if a failure occurs during production operations.

---

## 1. D1 Database Recovery & Rollback

The D1 SQL database stores post indexing metadata, task records, configuration flags, and audit logs. 

### Automated Backups
Cloudflare D1 automatically schedules daily backups of your database. You can list and restore these backups via the Wrangler CLI.

### Runbook: Restoring from a Backup
To roll back the D1 database to a known stable snapshot:

1. **List available backups**:
   ```bash
   npx wrangler d1 backup list <database-name>
   ```
   Identify the backup ID corresponding to the target restoration timestamp.

2. **Restore the database**:
   ```bash
   npx wrangler d1 backup restore <database-name> <backup-id>
   ```
   *Warning: This will overwrite all current tables and rows. Active background task statuses will be rolled back to their state at the time of the backup.*

3. **Verify the database state**:
   Check schema integrity and connection readiness:
   ```bash
   npx wrangler d1 execute <database-name> --command "SELECT count(*) FROM posts_index;"
   ```

---

## 2. R2 Asset Storage Rollback

The R2 bucket stores uploaded draft attachments, images, and static resources. 

### Risk Vectors
* Malicious or corrupted file uploads overwriting existing assets.
* Accidental deletion of assets referenced by published posts.

### Rollback Strategy: Bucket Versioning
To protect against data loss or corruption, the production R2 bucket must be configured with **Object Versioning** enabled.

1. **Locate the Corrupted Asset**:
   Retrieve the object key and version ID via the Cloudflare dashboard or S3-compatible API.
2. **Restore Previous Object Version**:
   Using the AWS CLI or Wrangler configuration:
   ```bash
   aws s3api delete-object --bucket <production-bucket-name> --key <object-key> --version-id <latest-corrupted-version-id>
   ```
   Deleting the latest version automatically restores the previous version of the object as the active revision.

---

## 3. Worker Route & Script Rollback

If a new version of the API Worker or Queue Worker introduces runtime errors, memory leaks, or compatibility regressions:

### Wrangler Deploy Version Rollbacks
Cloudflare Workers retains a history of deployed versions. You can roll back instantly without rebuilding the codebase.

1. **List recent deployments**:
   ```bash
   npx wrangler deployments list
   ```
   Note the version ID or deployment ID of the previous stable deployment.

2. **Rollback to the stable deployment**:
   ```bash
   npx wrangler rollback <deployment-id>
   ```
   The routing traffic will be redirected immediately (typically within seconds).

---

## 4. Git and Pull Request Rollbacks

If a published post committed to a branch or merged into `main` corrupts the Hexo build pipeline:

### Rolling Back a PR in Generator Mode (Active branch, PR unmerged)
1. **Close the Pull Request**:
   Navigate to the PR on GitHub and click "Close pull request".
2. **Delete the Remote Branch**:
   ```bash
   git push origin --delete draft/<post-slug>
   ```

### Rolling Back a Merged Post (Merged to main, live site affected)
If the PR has already been merged to the production `main` branch, revert the commit directly:

1. **Locate the merge commit**:
   Find the commit hash of the merge on `main`.
2. **Revert the commit**:
   ```bash
   git checkout main
   git pull origin main
   git revert -m 1 <merge-commit-hash>
   ```
3. **Push the revert**:
   ```bash
   git push origin main
   ```
   This will remove the generated Markdown file from the source directory, triggering a production build that deletes the post from the live site.
