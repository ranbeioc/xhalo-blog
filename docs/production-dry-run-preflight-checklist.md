# Production Dry-run Preflight Checklist

> Status: Pending  
> Execution is forbidden until every required preflight item is complete or explicitly waived by the owner.

---

## 1. Repository Hygiene

- [ ] `npm run check:all` passes.
- [ ] `npm run check:secrets` passes.
- [ ] `npm run test:secrets-fixture` passes.
- [ ] No raw secret in current source tree.
- [ ] No concrete production secret URL in current source tree.
- [ ] No local absolute Windows file scheme marker in current source tree except explicitly marker-allowlisted historical progress docs.
- [ ] Smoke script parameterized and dry-run capable.

---

## 2. Prior Evidence

- [ ] Level 1 read-only validation passed.
- [ ] Staging Async E2E passed.
- [ ] Level 2 Single PR Trial passed.
- [ ] Level 2 cleanup completed.
- [ ] Post-Level2 evidence review completed.
- [ ] Production readiness checklist prepared.
- [ ] Production boundary inventory completed.
- [ ] Production rollback runbook reviewed.

---

## 3. Production Boundary

| Field | Expected | Actual | Status |
|---|---|---|---|
| Production content repo | read-only | TBD | TBD |
| `hexo-blog` write | no | TBD | TBD |
| Production branch creation | no | TBD | TBD |
| Production PR creation | no | TBD | TBD |
| Production R2 write | no | TBD | TBD |
| Destructive D1 operation | no | TBD | TBD |
| Direct main write | no | TBD | TBD |
| Auto merge | no | TBD | TBD |

---

## 4. Runtime Safety

- [ ] Production Worker identified.
- [ ] Production auth policy verified.
- [ ] Production `LIVE_WRITES_ENABLED=false` verified.
- [ ] Dry-run request cannot bypass live-write guard.
- [ ] Dry-run mode is explicitly set.
- [ ] Dry-run mode cannot enqueue production mutation task.
- [ ] Dry-run mode cannot create GitHub branch.
- [ ] Dry-run mode cannot create GitHub PR.
- [ ] Dry-run mode cannot write R2.
- [ ] Rollback operator assigned.

---

## 5. Execution Limits

- [ ] exactly one dry-run request.
- [ ] no branch creation.
- [ ] no PR creation.
- [ ] no production content mutation.
- [ ] no R2 mutation.
- [ ] no destructive D1 operation.
- [ ] no repeated batch dry-run.
- [ ] sanitized evidence only.

---

## 6. Preflight Verdict

- [ ] Passed.
- [ ] Failed.
- [x] Pending.

Reason:

```text
Pending production boundary verification and owner approval.
```
