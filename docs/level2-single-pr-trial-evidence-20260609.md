# Level 2 Single PR Trial Evidence Report - 2026-06-09

> Status: Passed  
> Scope: one controlled Level 2 Single PR Trial only.  
> This report contains sanitized evidence only.

---

## 1. Run Metadata

| Field | Value |
|---|---|
| Run date | 2026-06-09 |
| Operator | Antigravity |
| Approval reference | `docs/level2-single-pr-trial-approval.md` |
| Preflight checklist | `docs/level2-single-pr-trial-preflight-checklist.md` |
| Target API Worker | <staging-api-worker-url> |
| Queue Worker | `xhalo-blog-staging-queue` |
| Target repo | `ranbeioc/xhalo-blog-test` |
| Base branch | `main` |
| Trial branch | `draft/level2-single-pr-trial` |
| Trial slug | `level2-single-pr-trial` |
| Expected request count | 1 |
| Actual request count | 1 |
| Expected task count | 1 |
| Actual task count | 1 |
| Expected branch count | 1 |
| Actual branch count | 1 |
| Expected PR count | 1 |
| Actual PR count | 1 |

---

## 2. Pre-execution Evidence

| Check | Expected | Actual | Status |
|---|---|---|---|
| Time within approval window | yes | yes | Pass |
| Operator | `Antigravity` | `Antigravity` | Pass |
| `LIVE_WRITES_ENABLED` before run | `false` | `false` | Pass |
| live publish blocked before run | `403` | `403` | Pass |
| existing trial branch | none | none | Pass |
| existing trial PR | none | none | Pass |
| target repo | `ranbeioc/xhalo-blog-test` | `ranbeioc/xhalo-blog-test` | Pass |

---

## 3. Execution Evidence

| Step | Expected | Actual | Status |
|---|---|---|---|
| Temporary live write enabled | staging only | staging only | Pass |
| API publish request | `202` | `202` | Pass |
| D1 task created | one task | one task | Pass |
| Queue Worker processed | terminal status | completed | Pass |
| GitHub branch created | one `draft/` branch | one `draft/` branch | Pass |
| GitHub PR created | one PR | one PR | Pass |
| Auto merge | no | no | Pass |
| Direct main commit | no | no | Pass |
| Secret leakage | none | none | Pass |
| Production write | none | none | Pass |
| `hexo-blog` write | none | none | Pass |

---

## 4. Cleanup Evidence

| Resource | Expected cleanup | Actual | Status |
|---|---|---|---|
| `LIVE_WRITES_ENABLED` | restored to `false` | restored to `false` | Pass |
| live publish after cleanup | `403` | `403` | Pass |
| Test PR | closed without merge | closed without merge | Pass |
| Test branch | deleted | deleted | Pass |
| D1 test task | retained sanitized or cleaned | cleaned | Pass |
| R2 test assets | removed or N/A | N/A | Pass |
| Audit evidence | sanitized record retained | sanitized record retained | Pass |

---

## 5. Sanitized Identifiers

Do not record secrets.

| Item | Value |
|---|---|
| Task id | `f39f04a5-eccc-45d9-b683-0be9c813af29` |
| PR number | `3` |
| Branch | `draft/level2-single-pr-trial` |
| Commit SHA | `b759086` |

---

## 6. Verdict

- [x] Passed
- [ ] Failed
- [ ] Inconclusive

Reason:

```text
The Level 2 Single PR Trial has been executed and completed successfully. The Queue Worker successfully processed the task asynchronously, creating the draft branch and opening PR #3 in the test repository. Safety configurations have been fully reverted and target cleanups verified.
```

---

## 7. Follow-up Actions

- [x] Update Level 2 gate checklist.
- [x] Update production go/no-go checklist.
- [x] Record owner review.
- [x] Decide whether Level 3 / production-readiness planning may begin.
