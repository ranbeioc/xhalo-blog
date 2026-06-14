# Production Readiness Checklist

> Status: Approved for controlled PR-only production pipeline after one successful live-write trial.  
> Current decision: Future production writes require explicit owner approval; direct main writes and auto-merge remain blocked.

---

## 1. Scope

This checklist must be completed before any production dry-run, shadow-mode, or live-write approval.

Production means any workflow touching:

```text
<production-site-url>
hexo-blog
production repository
production Cloudflare Worker
production D1
production R2
production queue
production GitHub token
```

---

## 2. Required Gates

### P0 - Evidence Baseline

- [x] Level 1 read-only validation completed.
- [x] Staging async E2E completed.
- [x] Level 2 Single PR Trial completed.
- [x] Level 2 cleanup completed.
- [x] Smoke script parameterized.
- [x] Production Go/No-Go remains NO-GO.

### P1 - Repository Boundary

- [x] `hexo-blog` is read-only unless separately approved.
- [x] Production repo target is explicitly named.
- [x] Production base branch is explicitly named.
- [x] No direct main write.
- [x] No auto merge.
- [x] PR-only workflow documented.
- [x] Rollback branch strategy documented.

### P2 - Cloudflare Production Runtime

- [x] Production Worker identified.
- [x] Production queue identified.
- [x] Production D1 identified.
- [x] Production R2 identified.
- [x] Secrets stored only in Cloudflare secrets.
- [x] `LIVE_WRITES_ENABLED=false` default verified.
- [x] Production Access / auth policy verified.
- [x] Turnstile policy verified.
- [x] Rate limits / abuse control documented.

### P3 - Content Safety

- [x] Test content cannot be published to real site.
- [x] Dry-run mode cannot create production PR.
- [x] Shadow-mode cannot mutate production repo.
- [x] Production publish requires separate owner approval.
- [x] Audit logs do not contain secrets.

### P4 - Backup and Rollback

- [x] Current production repo backup strategy documented.
- [x] D1 backup/export runbook documented.
- [x] R2 backup/restore policy documented.
- [x] Worker rollback runbook documented.
- [x] Queue drain/pause runbook documented.
- [x] Incident owner assigned.

### P5 - Monitoring

- [x] Worker logs review path documented.
- [x] Queue failure visibility documented.
- [x] D1 task/audit query documented.
- [x] Alerting or manual observation window documented.
- [x] Post-run evidence template prepared.

---

## 3. Current Decision

* Approved for production dry-run: **yes**
* Approved for production shadow-mode: **yes**
* Approved for one controlled live-write trial: **completed**
* Approved for ongoing unattended live writes: **no**
* Approved for direct main write: **no**
* Approved for auto merge: **no**

Reason:

```text
The controlled production live-write trial completed successfully, validating the asynchronous publish queue and GitHub App integrations. Future production writes still require explicit, window-bounded owner approvals, while direct commits to main and auto-merge remain strictly blocked.
```
