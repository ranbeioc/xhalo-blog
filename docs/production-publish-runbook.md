# Production Publish Runbook

> Scope: controlled PR-only production publishing.

---

## 1. Default Production Baseline

```text
LIVE_WRITES_ENABLED=false
Direct main write: disabled
Auto merge: disabled
Batch publish: disabled
R2 write: disabled unless separately approved
```

---

## 2. Approved Publish Flow

1. Owner approves one production write window.
2. Operator confirms `LIVE_WRITES_ENABLED=false` baseline.
3. Operator temporarily enables `LIVE_WRITES_ENABLED=true`.
4. Operator sends exactly one request.
5. Queue Worker creates one draft branch and one PR.
6. Operator restores `LIVE_WRITES_ENABLED=false`.
7. Operator verifies subsequent writes fail with 403.
8. Owner manually reviews PR.
9. Owner manually merges or closes PR.
10. Evidence is recorded.

---

## 3. Forbidden Publish Flow

* direct push to `main`;
* auto-merge;
* repeated requests;
* batch publishing;
* unapproved R2 upload;
* unapproved destructive D1 operation;
* public unauthenticated publish endpoint.

---

## 4. Manual Merge Policy

Generated PRs may only be merged manually by the owner after:

* content review;
* frontmatter review;
* secret scan;
* branch diff review;
* deploy preview or local Hexo build if applicable.

---

## 5. Cleanup Policy

If PR is not merged:

* close PR without merge;
* delete draft branch after owner approval;
* preserve evidence;
* do not retry automatically.

---

## 6. Admin UI Publishing Guidelines

* **Approved Write Window**: Using the Admin UI to "Create Review PR" requires explicit owner-approved write windows. The operator must confirm this by checking the write-window confirmation checkbox.
* **PR-only workbench**: The Admin UI only supports PR-only publishing. It does not expose `Publish to D1` as a primary action.
* **Exclusion of D1 Writes**: Direct D1 writes are considered experimental prototypes. They are not part of the normal production publishing workflow and require separate, explicit owner approval.

