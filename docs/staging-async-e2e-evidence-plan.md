# Staging Async E2E Evidence Plan

> Status: Planning only  
> Execution: Forbidden until explicit owner approval is recorded.

---

## 1. Purpose

This document defines the evidence collection plan for a future staging async publish E2E run.

The purpose is to verify that the async publishing pipeline can:

1. accept one authorized live publish request in staging;
2. create one D1 task;
3. enqueue one Queue Worker job;
4. process the job once;
5. create one draft branch in the approved test repository;
6. create one Pull Request in the approved test repository;
7. record sanitized audit evidence;
8. clean up branch/PR/test data;
9. restore `LIVE_WRITES_ENABLED=false`.

---

## 2. Approved Test Target

| Item | Value |
|---|---|
| GitHub owner | `ranbeioc` |
| GitHub repo | `xhalo-blog-test` |
| Base branch | `main` |
| Draft branch prefix | `draft/` |
| Test slug | `staging-async-e2e-smoke` |
| Expected branch count | 1 |
| Expected PR count | 1 |
| Auto merge | No |
| Direct main write | No |
| Production write | No |

---

## 3. Hard Boundaries

Forbidden:

```text
hexo-blog
production repo
direct main commit
auto merge
batch publish
production R2 writes
destructive D1 operations
multiple PR creation
unbounded queue retry
logging raw secrets
```

---

## 4. Required Pre-approval

Before executing the E2E run, the owner must explicitly approve:

| Field | Value |
|---|---|
| Date/time window | TBD |
| Operator | TBD |
| Target repo | `ranbeioc/xhalo-blog-test` |
| Test slug | `staging-async-e2e-smoke` |
| Branch prefix | `draft/` |
| Max PR count | 1 |
| Cleanup required | Yes |
| Auto merge allowed | No |
| Direct main write allowed | No |

---

## 5. Environment Inputs

Use runtime secret stores only. Do not write real values into docs.

```bash
ASYNC_PUBLISH_TARGET_URL="<staging-api-worker-url>"
ADMIN_API_SHARED_SECRET="<redacted-admin-shared-secret>"
SMOKE_TURNSTILE_TOKEN="<runtime-token-or-staging-test-token>"
GITHUB_OWNER="ranbeioc"
GITHUB_REPO="xhalo-blog-test"
GITHUB_BRANCH="main"
ASYNC_PUBLISH_MODE="e2e"
ASYNC_PUBLISH_EXPECT_LIVE_WRITES="true"
LIVE_WRITES_ENABLED="true"
```

`LIVE_WRITES_ENABLED=true` must only be active for the approved time window.

---

## 6. Pre-flight Checks

- [ ] `npm run check:all` passes.
- [ ] `npm run check:secrets` passes.
- [ ] `npm run test:secrets-fixture` passes.
- [ ] Level 2 gate checklist exists.
- [ ] cleanup runbook exists.
- [ ] permission verification exists.
- [ ] branch protection verification exists.
- [ ] Cloudflare runtime safety checklist exists.
- [ ] owner approval exists.
- [ ] no existing `draft/staging-async-e2e-smoke` branch.
- [ ] no existing open PR for `draft/staging-async-e2e-smoke`.

---

## 7. Future Execution Steps

Do not execute until approved.

1. Confirm owner approval.
2. Confirm `LIVE_WRITES_ENABLED=false` before starting.
3. Confirm target repo is `ranbeioc/xhalo-blog-test`.
4. Confirm no existing branch/PR collision.
5. Temporarily set `LIVE_WRITES_ENABLED=true` in staging only.
6. Run exactly one E2E async publish request.
7. Confirm API returns `202`.
8. Confirm D1 task is created.
9. Confirm Queue Worker processes the task.
10. Confirm GitHub branch is created.
11. Confirm GitHub PR is created.
12. Confirm audit logs include queued/completed.
13. Restore `LIVE_WRITES_ENABLED=false`.
14. Execute cleanup runbook.
15. Record sanitized evidence.

---

## 8. Success Criteria

- [ ] exactly one task created;
- [ ] exactly one branch created;
- [ ] exactly one PR created;
- [ ] PR targets `ranbeioc/xhalo-blog-test`;
- [ ] PR uses `draft/` prefix;
- [ ] no direct main commit;
- [ ] no auto merge;
- [ ] audit logs recorded;
- [ ] cleanup completed;
- [ ] `LIVE_WRITES_ENABLED=false` restored.

---

## 9. Failure Criteria

Any of the following blocks Level 2 Trial:

- more than one branch created;
- more than one PR created;
- any write to `hexo-blog`;
- any direct main commit;
- any auto merge;
- any secret logged;
- D1 task remains queued/retrying unexpectedly;
- Queue Worker retries create duplicate output;
- cleanup cannot be completed;
- `LIVE_WRITES_ENABLED=true` remains enabled.

---

## 10. Approval Review Requirement

The next step after this evidence prep is `Staging Async E2E Execution Approval Review`.

Actual staging E2E execution remains blocked until:

- `docs/staging-async-e2e-execution-approval.md` is completed;
- `docs/staging-async-e2e-preflight-checklist.md` is completed;
- owner approval is explicitly recorded;
- execution window and operator are recorded;
- cleanup runbook is ready.
