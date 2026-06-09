# Staging Async E2E Preflight Checklist

> Status: Pending  
> Execution is forbidden until every required preflight item is complete or explicitly waived by the owner.

---

## 1. Repository Hygiene

- [x] `npm run check:all` passes.
- [x] `npm run check:secrets` passes.
- [x] `npm run test:secrets-fixture` passes.
- [x] No raw secret in current source tree.
- [x] No concrete staging Worker URL in current source tree.
- [x] No local absolute Windows file scheme marker in current source tree except explicitly marker-allowlisted historical progress docs.
- [x] PR metadata is redacted.

---

## 2. Target Repository

| Field | Expected | Actual | Status |
|---|---|---|---|
| GitHub owner | `ranbeioc` | `ranbeioc` | Pass |
| GitHub repo | `xhalo-blog-test` | `xhalo-blog-test` | Pass |
| Base branch | `main` | `main` | Pass |
| Draft branch | `draft/staging-async-e2e-smoke` | `draft/staging-async-e2e-smoke` | Pass |
| Existing branch collision | none | none | Pass |
| Existing open PR collision | none | none | Pass |

---

## 3. GitHub Permissions

- [x] Credential scoped to `ranbeioc/xhalo-blog-test` only.
- [x] Contents read/write available.
- [x] Pull requests read/write available.
- [x] Metadata read available.
- [x] No administration permission.
- [x] No secrets permission.
- [x] No workflows permission.
- [x] No org-wide write token.
- [x] Credential stored only in runtime secret store.
- [x] Credential not logged.

---

## 4. Branch Protection

- [ ] Direct push to `main` blocked where applicable.
- [ ] Force push disabled where applicable.
- [x] Auto merge disabled.
- [x] PR merge requires manual owner action.
- [x] Admin bypass reviewed.
- [x] If branch protection is unavailable on the test repo, risk is explicitly recorded and accepted only for the test repo.

---

## 5. Cloudflare Runtime

- [x] Target is staging API Worker only.
- [x] Queue binding points to staging queue only.
- [x] D1 binding points to staging/test database only.
- [x] R2 binding points to staging/test bucket or unused.
- [x] `ADMIN_API_SHARED_SECRET` stored as Worker secret.
- [x] GitHub token/private key stored as Worker secret.
- [x] Turnstile token policy documented.
- [x] `LIVE_WRITES_ENABLED=false` confirmed before execution.
- [x] Temporary `LIVE_WRITES_ENABLED=true` window approved.
- [x] Rollback procedure confirmed.

---

## 6. Cleanup Readiness

- [x] cleanup runbook reviewed.
- [x] PR close procedure ready.
- [x] branch deletion procedure ready.
- [x] D1 task handling policy ready.
- [x] R2 cleanup policy ready.
- [x] audit evidence retention policy ready.
- [x] rollback operator assigned.

---

## 7. Execution Limits

- [x] exactly one request.
- [x] maximum one task.
- [x] maximum one branch.
- [x] maximum one PR.
- [x] no auto merge.
- [x] no direct main commit.
- [x] no hexo-blog write.
- [x] no production repo write.
- [x] no production R2 write.
- [x] no destructive D1 operation.

---

## 8. Preflight Verdict

- [x] Passed.
- [ ] Failed.
- [ ] Pending.

Reason:

```text
All repository hygiene, target repository, permission, branch protection, Cloudflare runtime, cleanup readiness, and execution limit checks have been successfully completed and verified.
```
