# Production Readiness Checklist

> Status: Draft / Not approved  
> Current decision: production live writes remain blocked.

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

- [ ] Level 1 read-only validation completed.
- [ ] Staging async E2E completed.
- [ ] Level 2 Single PR Trial completed.
- [ ] Level 2 cleanup completed.
- [ ] Smoke script parameterized.
- [ ] Production Go/No-Go remains NO-GO.

### P1 - Repository Boundary

- [ ] `hexo-blog` is read-only unless separately approved.
- [ ] Production repo target is explicitly named.
- [ ] Production base branch is explicitly named.
- [ ] No direct main write.
- [ ] No auto merge.
- [ ] PR-only workflow documented.
- [ ] Rollback branch strategy documented.

### P2 - Cloudflare Production Runtime

- [ ] Production Worker identified.
- [ ] Production queue identified.
- [ ] Production D1 identified.
- [ ] Production R2 identified.
- [ ] Secrets stored only in Cloudflare secrets.
- [ ] `LIVE_WRITES_ENABLED=false` default verified.
- [ ] Production Access / auth policy verified.
- [ ] Turnstile policy verified.
- [ ] Rate limits / abuse control documented.

### P3 - Content Safety

- [ ] Test content cannot be published to real site.
- [ ] Dry-run mode cannot create production PR.
- [ ] Shadow-mode cannot mutate production repo.
- [ ] Production publish requires separate owner approval.
- [ ] Audit logs do not contain secrets.

### P4 - Backup and Rollback

- [ ] Current production repo backup strategy documented.
- [ ] D1 backup/export runbook documented.
- [ ] R2 backup/restore policy documented.
- [ ] Worker rollback runbook documented.
- [ ] Queue drain/pause runbook documented.
- [ ] Incident owner assigned.

### P5 - Monitoring

- [ ] Worker logs review path documented.
- [ ] Queue failure visibility documented.
- [ ] D1 task/audit query documented.
- [ ] Alerting or manual observation window documented.
- [ ] Post-run evidence template prepared.

---

## 3. Current Decision

- [ ] Approved for production dry-run.
- [ ] Approved for production shadow-mode.
- [ ] Approved for production live write.
- [x] Not approved yet.

Reason:

```text
Production readiness checklist is being prepared. No production execution is approved.
```
