# Staging Async E2E Deviation Review - 2026-06-09

> Status: Completed  
> Scope: branch prefix reconciliation for the 2026-06-09 staging async E2E evidence.

---

## 1. Summary

The controlled staging async E2E run completed successfully at the runtime level, but the evidence report recorded a branch prefix that differs from the approval and planning documents.

Approved branch:

```text
drafts/staging-async-e2e-smoke
```

Actual branch recorded in evidence:

```text
draft/staging-async-e2e-smoke
```

This document reviews the deviation and records the reconciliation decision.

---

## 2. Runtime Result

| Item | Result |
|---|---|
| API publish request | `202` |
| D1 task | created |
| Queue Worker | completed |
| GitHub branch | one branch |
| GitHub PR | one PR |
| PR cleanup | closed without merge |
| branch cleanup | deleted |
| `LIVE_WRITES_ENABLED` | restored to `false` |
| Secret leakage | none observed |
| Production write | none observed |
| `hexo-blog` write | none observed |

---

## 3. Deviation

| Field | Approved | Actual | Status |
|---|---|---|---|
| branch prefix | `drafts/` | `draft/` | mismatch |
| test slug | `staging-async-e2e-smoke` | `staging-async-e2e-smoke` | match |
| target repo | `ranbeioc/xhalo-blog-test` | `ranbeioc/xhalo-blog-test` | match |
| PR count | 1 | 1 | match |
| cleanup | required | completed | match |

---

## 4. Root Cause Review

| Source | Expected | Actual | Notes |
|---|---|---|---|
| publish runtime code | `draft/` | `draft/` | defined in packages/core/src/index.js |
| queue worker code | `draft/` | `draft/` | inherited from packages/core |
| config/env | N/A | N/A | no overrides active |
| docs | `drafts/` | mixed | docs require reconciliation |
| evidence | `drafts/` expected | `draft/` actual | mismatch |

### Code vs Document Audit:
1. The REST API endpoints are consistently named using the plural form: `/api/drafts/publish`, `/api/drafts/template`, etc.
2. The Git branch prefix configuration in `packages/core/src/index.js` is hardcoded as `branchPrefix: 'draft/'` (singular).
3. The previous planning and approval documentation inadvertently mixed the plural REST endpoint naming convention (`drafts/`) with the singular git branch convention (`draft/`).
4. The staging E2E publish run correctly executed the standard code logic, creating a branch with the prefix `draft/` (e.g. `draft/staging-async-e2e-smoke`).

---

## 5. Reconciliation Decision

- [ ] Decision A: `drafts/` is the correct standard. E2E is passed with deviation / inconclusive and must be rerun after code/config fix.
- [x] Decision B: `draft/` is the correct standard. Update all docs from `drafts/` to `draft/`; E2E is accepted after reconciliation.
- [ ] Decision C: unresolved. Level 2 Trial remains blocked pending further review.

### Decision rationale:

```text
The singular prefix 'draft/' is hardcoded into packages/core/src/index.js as the branch prefix standard for the application. standardizing on 'draft/' requires zero code changes and aligns all documentation with the actual implementation. Standardizing on 'drafts/' would require modifying the branch creation logic in the codebase and re-running E2E validation. Therefore, Decision B is selected. All documentation will be reconciled to use the singular 'draft/' prefix.
```

---

## 6. Gate Impact

- [ ] Level 2 Trial may be planned after separate approval.
- [x] Level 2 Trial remains blocked.

Reason:

```text
Branch prefix reconciliation must be completed and reviewed before Level 2 Trial approval.
```

---

## 7. Follow-up Actions

- [x] Update evidence report verdict.
- [x] Update branch prefix references in approval/preflight/plan docs.
- [x] Update Level 2 gate checklist.
- [x] Update production go/no-go checklist.
- [x] Update CLAUDE_BRANCH_PROGRESS.md.
- [ ] Decide whether a new E2E run is required (Not required under Decision B).
