# Level 2 Cleanup Runbook

> Scope: cleanup procedure for the Level 2 Single PR Trial.  
> This runbook must be ready before trial execution.

---

## 1. Cleanup Targets

| Resource | Expected test value |
|---|---|
| Test repo | `ranbeioc/xhalo-blog-test` |
| Test branch | `drafts/level2-single-pr-trial` |
| Test PR | One PR created by trial |
| D1 task | One `draft_publish` task |
| D1 post/index record | One synthetic test slug |
| R2 objects | Only if assets were generated |
| Worker flag | `LIVE_WRITES_ENABLED=false` |

---

## 2. Immediate Safety Reset

First action after trial:

```text
Set LIVE_WRITES_ENABLED=false
```

Confirm:

```text
/api/drafts/publish live request returns 403
```

---

## 3. GitHub Cleanup

- [ ] Close test PR without merge.
- [ ] Delete `drafts/level2-single-pr-trial` branch.
- [ ] Confirm branch no longer exists.
- [ ] Confirm no open PR remains for the branch.
- [ ] Confirm no direct `main` commit occurred.

---

## 4. D1 Cleanup / Retention

D1 cleanup must distinguish between test state and audit evidence.

Suggested policy:

- keep audit evidence in sanitized form;
- remove or mark test task records if they can affect future runs;
- do not delete audit trail without exported evidence.

Checklist:

- [ ] Identify test task by slug or task id.
- [ ] Confirm terminal status.
- [ ] Export sanitized task summary.
- [ ] Remove or mark test record according to retention policy.
- [ ] Confirm no active queued task remains.

---

## 5. R2 Cleanup

If assets were generated:

- [ ] Identify test prefix.
- [ ] List objects under test prefix.
- [ ] Delete test objects.
- [ ] Confirm no production prefix was touched.

If no assets were generated:

- [ ] Record `N/A`.

---

## 6. Audit Evidence

Record sanitized evidence only:

```text
task id: <redacted-task-id>
branch: drafts/level2-single-pr-trial
pr: <redacted-or-number-only>
status: completed / cleaned
live writes restored: false
```

Do not record:

```text
admin secret
GitHub token
Turnstile secret
private key
raw webhook secret
```

---

## 7. Rollback

If Worker behavior is abnormal:

1. Set `LIVE_WRITES_ENABLED=false`.
2. Disable or pause queue consumer if needed.
3. Roll back Worker deployment.
4. Close test PR.
5. Delete test branch.
6. Preserve sanitized logs for review.
7. Block Level 2 until root cause is fixed.

---

## 8. Cleanup Completion Criteria

- [ ] `LIVE_WRITES_ENABLED=false`
- [ ] test PR closed
- [ ] test branch deleted
- [ ] no direct main commit
- [ ] D1 test state handled
- [ ] R2 test assets removed or N/A
- [ ] audit evidence recorded
- [ ] owner notified
