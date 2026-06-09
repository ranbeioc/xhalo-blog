# Staging Async E2E Evidence Report

> Status: Template  
> This file must be copied or filled only after an approved staging E2E run.

---

## 1. Run Metadata

| Field | Value |
|---|---|
| Run date | TBD |
| Operator | TBD |
| Approval reference | TBD |
| Approval document | `docs/staging-async-e2e-execution-approval.md` |
| Preflight checklist | `docs/staging-async-e2e-preflight-checklist.md` |
| Target API Worker | `<staging-api-worker-url>` |
| Queue Worker | `<staging-queue-worker>` |
| Target repo | `ranbeioc/xhalo-blog-test` |
| Base branch | `main` |
| Test branch | `draft/staging-async-e2e-smoke` |
| Test slug | `staging-async-e2e-smoke` |
| Expected PR count | 1 |
| Actual PR count | TBD |

---

## 2. Pre-flight Evidence

- [ ] `LIVE_WRITES_ENABLED=false` before run.
- [ ] no existing test branch.
- [ ] no existing test PR.
- [ ] target repo confirmed.
- [ ] branch protection status recorded.
- [ ] token/app permission scope recorded.
- [ ] cleanup runbook ready.
- [ ] owner approval recorded.

---

## 3. Execution Evidence

| Step | Expected | Actual | Status |
|---|---|---|---|
| API publish request | `202` | TBD | TBD |
| D1 task created | one task | TBD | TBD |
| Queue Worker processed | terminal status | TBD | TBD |
| GitHub branch created | one `draft/` branch | TBD | TBD |
| GitHub PR created | one PR | TBD | TBD |
| Audit queued | recorded | TBD | TBD |
| Audit completed | recorded | TBD | TBD |
| Secret leakage | none | TBD | TBD |

---

## 4. Cleanup Evidence

| Resource | Expected cleanup | Actual | Status |
|---|---|---|---|
| `LIVE_WRITES_ENABLED` | restored to `false` | TBD | TBD |
| Test PR | closed without merge | TBD | TBD |
| Test branch | deleted | TBD | TBD |
| D1 test task | retained sanitized or cleaned | TBD | TBD |
| R2 test assets | removed or N/A | TBD | TBD |
| Audit evidence | sanitized record retained | TBD | TBD |

---

## 5. Sanitized Identifiers

Do not record secrets.

| Item | Value |
|---|---|
| Task id | `<redacted-task-id>` |
| PR number | `<number-only-or-redacted>` |
| Branch | `draft/staging-async-e2e-smoke` |
| Commit SHA | `<redacted-or-short-sha>` |

---

## Approval Confirmation

- [ ] Owner approval was recorded before execution.
- [ ] Preflight checklist passed before execution.
- [ ] Execution stayed within approved window.
- [ ] `LIVE_WRITES_ENABLED=true` was used only during approved window.

---

## 6. Verdict

- [ ] Passed
- [ ] Failed
- [ ] Inconclusive

Reason:

```text
TBD
```

---

## 7. Follow-up Actions

- [ ] Update Level 2 gate checklist.
- [ ] Update production go/no-go checklist.
- [ ] Record owner review.
- [ ] Decide whether Level 2 Single PR Trial may be planned.
