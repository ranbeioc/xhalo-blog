# Staging Async E2E Preflight Checklist

> Status: Pending  
> Execution is forbidden until every required preflight item is complete or explicitly waived by the owner.

---

## 1. Repository Hygiene

- [ ] `npm run check:all` passes.
- [ ] `npm run check:secrets` passes.
- [ ] `npm run test:secrets-fixture` passes.
- [ ] No raw secret in current source tree.
- [ ] No concrete staging Worker URL in current source tree.
- [ ] No local absolute Windows file scheme marker in current source tree except explicitly marker-allowlisted historical progress docs.
- [ ] PR metadata is redacted.

---

## 2. Target Repository

| Field | Expected | Actual | Status |
|---|---|---|---|
| GitHub owner | `ranbeioc` | TBD | TBD |
| GitHub repo | `xhalo-blog-test` | TBD | TBD |
| Base branch | `main` | TBD | TBD |
| Draft branch | `drafts/staging-async-e2e-smoke` | TBD | TBD |
| Existing branch collision | none | TBD | TBD |
| Existing open PR collision | none | TBD | TBD |

---

## 3. GitHub Permissions

- [ ] Credential scoped to `ranbeioc/xhalo-blog-test` only.
- [ ] Contents read/write available.
- [ ] Pull requests read/write available.
- [ ] Metadata read available.
- [ ] No administration permission.
- [ ] No secrets permission.
- [ ] No workflows permission.
- [ ] No org-wide write token.
- [ ] Credential stored only in runtime secret store.
- [ ] Credential not logged.

---

## 4. Branch Protection

- [ ] Direct push to `main` blocked where applicable.
- [ ] Force push disabled where applicable.
- [ ] Auto merge disabled.
- [ ] PR merge requires manual owner action.
- [ ] Admin bypass reviewed.
- [ ] If branch protection is unavailable on the test repo, risk is explicitly recorded and accepted only for the test repo.

---

## 5. Cloudflare Runtime

- [ ] Target is staging API Worker only.
- [ ] Queue binding points to staging queue only.
- [ ] D1 binding points to staging/test database only.
- [ ] R2 binding points to staging/test bucket or unused.
- [ ] `ADMIN_API_SHARED_SECRET` stored as Worker secret.
- [ ] GitHub token/private key stored as Worker secret.
- [ ] Turnstile token policy documented.
- [ ] `LIVE_WRITES_ENABLED=false` confirmed before execution.
- [ ] Temporary `LIVE_WRITES_ENABLED=true` window approved.
- [ ] Rollback procedure confirmed.

---

## 6. Cleanup Readiness

- [ ] cleanup runbook reviewed.
- [ ] PR close procedure ready.
- [ ] branch deletion procedure ready.
- [ ] D1 task handling policy ready.
- [ ] R2 cleanup policy ready.
- [ ] audit evidence retention policy ready.
- [ ] rollback operator assigned.

---

## 7. Execution Limits

- [ ] exactly one request.
- [ ] maximum one task.
- [ ] maximum one branch.
- [ ] maximum one PR.
- [ ] no auto merge.
- [ ] no direct main commit.
- [ ] no hexo-blog write.
- [ ] no production repo write.
- [ ] no production R2 write.
- [ ] no destructive D1 operation.

---

## 8. Preflight Verdict

- [ ] Passed.
- [ ] Failed.
- [ ] Pending.

Reason:

```text
TBD
```
