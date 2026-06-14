# Production PR Review Runbook

---

## 1. Scope

This runbook applies to generated production PRs in `ranbeioc/hexo-blog`.

---

## 2. Required Checks

- [ ] PR title is meaningful.
- [ ] PR body is complete and contains no template placeholders.
- [ ] Exactly expected files changed.
- [ ] No secrets.
- [ ] No sensitive endpoint.
- [ ] No unexpected binary file.
- [ ] Frontmatter valid.
- [ ] `status` field intentional.
- [ ] Content path expected.
- [ ] No direct main write.
- [ ] No auto-merge.
- [ ] Owner reviewed.

---

## 3. PR Body Rejection Rules

Reject PR if body contains placeholders:

```text
<!-- What does this PR do?
<!-- List the key changes made
npm test output here
Additional Notes
TBD
placeholder
```

Reject PR if body quality gate fails:

```text
Reject PR if body contains template replacement markers.
Reject PR if Production Impact has zero or multiple selections.
Reject production-impacting PR if Evidence is empty or N/A.
Reject PR if Validation checkboxes are unchecked without N/A reason.
Reject PR if Safety checkboxes are unchecked without N/A reason.
```

---

## 4. Merge Decision

Only owner may choose:

* merge manually;
* request changes;
* close without merge.

Auto-merge remains prohibited.
