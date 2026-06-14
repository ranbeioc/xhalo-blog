# Production Rollback Runbook

> Status: Completed  
> Production live writes remain blocked. Shadow-mode and dry-run operations are governed by this runbook.

---

## 1. Rollback Principles

- prefer disable over delete;
- restore `LIVE_WRITES_ENABLED=false` first;
- stop new queue intake before cleanup;
- preserve sanitized evidence;
- never commit secrets;
- never force-push production branches unless explicitly approved.

---

## 2. Immediate Kill Switch

```text
Set production LIVE_WRITES_ENABLED=false
Disable or restrict production publish endpoint
Pause queue consumer if needed
Revoke temporary token if needed
```

---

## 3. GitHub Rollback

- Close any unexpected production pull request without merging.
- Delete temporary production branch: `git push origin --delete <branch-name>`.
- Verify main branch commit history remains unmodified via `git log origin/main`.
- Record PR number and branch name in the incident report.

---

## 4. Cloudflare Worker Rollback via Dashboard / Wrangler

- **Wrangler CLI rollback**:
  Run `npx wrangler rollback --env production` to list recent deployments, then select the previous known-good deployment version to restore.
- **Dashboard rollback**:
  Navigate to Cloudflare Dashboard > Workers & Pages > Select Worker > Deployments tab > Click "Rollback" on the desired deployment version.
- **Verification**:
  - Query `/api/readiness` to verify the worker is responsive.
  - Assert `LIVE_WRITES_ENABLED=false` is enforced.

---

## 5. D1 Backup / Export / Restore Runbook & Audit Log Maintenance Query

- **D1 backup**:
  - Automated: Cloudflare D1 automatically performs daily backups.
  - Manual Backup: Navigate to Cloudflare Dashboard > D1 > Select Database > Backups > Click "Create backup".
- **D1 export**:
  Run `npx wrangler d1 export xhalo-blog-production-db --env production --output ./backup.sql` to export schema and data.
- **D1 restore**:
  Navigate to Cloudflare Dashboard > D1 > Select Database > Backups > Select the desired backup version > Click "Restore".
- **D1 audit log maintenance query**:
  If needed to clean up test audit entries (only if policy allows and under explicit approval):
  ```sql
  DELETE FROM audit_logs WHERE timestamp < ? AND detail LIKE '%smoke%';
  ```

---

## 6. R2 Cleanup Procedure

- Identify any unexpected R2 objects uploaded.
- **R2 delete object**:
  - Wrangler CLI: `npx wrangler r2 object delete xhalo-blog-production-assets/<key>`.
  - Cloudflare Dashboard: Navigate to R2 > Bucket > Locate file > Delete.
- Record only the deleted object keys (redact full signed URLs) in evidence.

---

## 7. Queue Pause / Drain / Replay Policy

- **Pause queue consumer**:
  Navigate to Cloudflare Dashboard > Queues > Select production queue > Pause consumer to stop processing incoming tasks.
- **Drain queue**:
  If a toxic task is blocking the queue, enable Dead Letter Queue (DLQ) to redirect failed tasks, or wait for tasks to expire (default retention period).
- **Replay policy**:
  Once the issue is remediated, resume the consumer. Replay tasks from DLQ if configured, or manually re-enqueue using the api task publisher.

---

## 8. Incident Response & Evidence Retention Policy

- **Incident Owner**: Antigravity / Operator / Codex.
- **Stop Condition**: Immediate kill switch triggered if any unauthorized mutation or exception occurs.
- **Evidence Retention Policy**: Retain all sanitized execution logs, preflight checks, and approval files in the repository under `docs/` for auditing. Never commit raw tokens or private keys.

---

## 9. Production Dry-run Rollback Checklist

Dry-run is expected to create no production branch, no production PR, no production R2 object, and no live content.

If any mutation occurs unexpectedly:

- [x] set `LIVE_WRITES_ENABLED=false`;
- [x] stop further requests;
- [x] record incident report;
- [x] close unexpected PR without merge;
- [x] delete unexpected branch only after owner confirmation;
- [x] remove unexpected R2 object only under owner confirmation;
- [x] preserve sanitized evidence;
- [x] keep production live writes blocked.

---

## 10. Monitoring During Dry-run

- [x] Worker logs: review request id, mode, status only.
- [x] Queue: verify no production mutation task is enqueued.
- [x] D1: verify no destructive operation.
- [x] R2: verify no object write.
- [x] GitHub: verify no branch or PR creation.

---

## 11. Production Shadow-mode Rollback / Stop Conditions

Shadow-mode is expected to create no production branch, no production PR, no R2 object, and no live content.

Stop immediately if:

- any production branch is created;
- any production PR is opened;
- any R2 object is written;
- any live publish path is reached;
- any `hexo-blog` write is attempted;
- any secret is logged;
- more than one request is executed.

Immediate actions:

- set or confirm `LIVE_WRITES_ENABLED=false`;
- stop further requests;
- preserve sanitized logs;
- record incident;
- close unexpected PR without merge;
- delete unexpected branch only after owner confirmation;
- remove unexpected R2 object only after owner confirmation;
- keep production live writes blocked.
