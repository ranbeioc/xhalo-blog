# Production Rollback Runbook

> Status: Draft  
> Production live writes remain blocked until this runbook is completed and reviewed.

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

```text
Close unmerged production PR
Delete temporary production draft branch
Verify main unchanged
Record PR number and branch name
```

---

## 4. Cloudflare Worker Rollback

```text
Identify previous known-good Worker deployment
Rollback via Dashboard or Wrangler
Verify readiness endpoint
Verify live publish blocked
```

---

## 5. D1 Rollback / Cleanup

```text
Export/backup before destructive operation
Mark failed tasks as cancelled if needed
Do not delete audit records unless policy allows
Use sanitized evidence only
```

---

## 6. R2 Cleanup

```text
Identify test object prefix
Delete only approved test prefix
Do not delete production asset prefixes
Record object count only, not sensitive URLs
```

---

## 7. Incident Report

```text
docs/production-incident-report-YYYYMMDD.md
```
