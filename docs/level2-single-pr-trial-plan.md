# Level 2 Single PR Trial Plan

> Status: Planning only  
> Execution: Forbidden until Level 2 gate checklist is fully approved.  
> Note: This plan is not execution approval. Execution requires docs/level2-single-pr-trial-approval.md and docs/level2-single-pr-trial-preflight-checklist.md.

---

## 1. Trial Scope

This trial allows one controlled GitHub PR generation against the approved test repository.

Allowed target:

```text
GITHUB_OWNER=ranbeioc
GITHUB_REPO=xhalo-blog-test
GITHUB_BRANCH=main
```

Allowed output:

```text
draft/<test-slug>
```

Allowed PR count:

```text
1
```

Allowed content:

```text
One synthetic test Markdown post.
```

Not allowed:

```text
hexo-blog
production repo
direct main commit
auto merge
batch publish
production R2 writes
destructive D1 operations
```

---

## 2. Required Pre-flight Checks

- [ ] Level 2 gate checklist fully approved.
- [ ] Target repository has branch protection enabled.
- [ ] GitHub App least privilege verified.
- [ ] Staging async E2E evidence completed.
- [ ] Cleanup runbook ready.
- [ ] Owner approval recorded.
- [ ] `LIVE_WRITES_ENABLED=false` before the test.
- [ ] Secret values loaded only from runtime environment.

---

## 3. Proposed Execution Window

| Field | Value |
|---|---|
| Operator | TBD |
| Date / Time | TBD |
| Target repo | `ranbeioc/xhalo-blog-test` |
| Target branch | `main` |
| Draft branch prefix | `draft/` |
| Test slug | `level2-single-pr-trial` |
| Expected PR count | 1 |
| Auto merge | No |
| Direct main write | No |
| Production write | No |

---

## 4. Environment Variables

Use runtime secrets only. Do not write values into docs.

```bash
LEVEL2_TARGET_URL="<staging-api-worker-url>"
ADMIN_API_SHARED_SECRET="<redacted-admin-shared-secret>"
LEVEL2_TURNSTILE_TOKEN="<runtime-token-or-staging-test-token>"
GITHUB_OWNER="ranbeioc"
GITHUB_REPO="xhalo-blog-test"
GITHUB_BRANCH="main"
LIVE_WRITES_ENABLED="true"
ASYNC_PUBLISH_MODE="e2e"
ASYNC_PUBLISH_EXPECT_LIVE_WRITES="true"
```

`LIVE_WRITES_ENABLED=true` must only be enabled for the authorized trial window and must be restored to `false` immediately after.

---

## 5. Trial Steps

Do not execute these steps until approved.

1. Confirm gate checklist approved.
2. Confirm test repo target.
3. Confirm branch protection.
4. Confirm no existing `draft/level2-single-pr-trial` branch.
5. Temporarily enable `LIVE_WRITES_ENABLED=true` in staging only.
6. Submit one synthetic publish request.
7. Confirm API returns `202`.
8. Confirm queue task is created.
9. Confirm Queue Worker processes task.
10. Confirm GitHub branch created.
11. Confirm GitHub PR created.
12. Confirm PR content is synthetic test content only.
13. Confirm audit logs queued/completed.
14. Restore `LIVE_WRITES_ENABLED=false`.
15. Execute cleanup runbook.
16. Record sanitized evidence.

---

## 6. Success Criteria

- [ ] Exactly one PR created.
- [ ] PR targets test repo only.
- [ ] PR uses `draft/` branch prefix.
- [ ] No direct main commit.
- [ ] No auto merge.
- [ ] No production repo write.
- [ ] Audit logs recorded.
- [ ] Cleanup completed.
- [ ] `LIVE_WRITES_ENABLED=false` restored.

---

## 7. Failure Criteria

- [ ] More than one branch created.
- [ ] More than one PR created.
- [ ] Any write to `hexo-blog`.
- [ ] Any direct commit to `main`.
- [ ] Any auto merge.
- [ ] Any secret logged.
- [ ] Queue retry loop creates repeated writes.
- [ ] Cleanup cannot be completed.
- [ ] `LIVE_WRITES_ENABLED=true` remains enabled after the test.

Any failure blocks further trials.
