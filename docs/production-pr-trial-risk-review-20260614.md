# Production PR Trial — Risk Review

**Date**: 2026-06-14
**Repository**: `ranbeioc/xhalo-blog`
**Reviewer**: Antigravity

---

## 1. Trial Description

Execute exactly one controlled production PR trial to verify the production pipeline can:

1. Create a draft branch in the production repository
2. Create a Pull Request against `main`
3. Return structured evidence of the branch/PR creation
4. Maintain all safety invariants (no merge, no live publish, no direct main write)

---

## 2. Risk Assessment

### 2.1 Authorized Actions (Low Risk)

| Action | Risk Level | Mitigation |
|--------|------------|------------|
| Create one draft branch | Low | Branch prefix enforced; branch deleted after evidence |
| Create one PR | Low | PR not merged; closed after evidence |
| Record D1 audit/task metadata | Low | Non-destructive insert; sanitized |

### 2.2 Prohibited Actions (Must Not Occur)

| Action | Risk Level | Control |
|--------|------------|---------|
| Merge PR to main | Critical | `LIVE_WRITES_ENABLED=false`; no auto-merge |
| Direct main write | Critical | Branch protection; `LIVE_WRITES_ENABLED=false` |
| R2 object write | Medium | Not part of PR trial scope; code path requires explicit upload |
| Live publish | Critical | `LIVE_WRITES_ENABLED=false`; queue consumer disabled |
| hexo-blog write | Critical | Different repository; not targeted |
| Secret logging | Critical | Evidence sanitized; `check:secrets` validation |

### 2.3 Failure Scenarios

| Scenario | Impact | Response |
|----------|--------|----------|
| Branch creation fails | None — no mutation occurred | Record failure evidence; stop |
| PR creation fails | One orphan branch | Delete branch; record evidence; stop |
| Unexpected second branch/PR | Extra repository artifacts | Close PR; delete branches; incident report |
| Worker timeout | No mutation if incomplete | Verify no partial writes; record evidence |

---

## 3. Rollback Plan

1. **Close trial PR** without merge via GitHub UI or `gh pr close`
2. **Delete trial branch** via `git push origin --delete <branch>` or GitHub UI
3. **Verify main unchanged** via `git log main -1` comparison with pre-trial HEAD
4. **Verify no R2 writes** via `wrangler r2 object list` or Dashboard
5. **Confirm `LIVE_WRITES_ENABLED=false`** via `wrangler secret list` or Dashboard

---

## 4. Pre-trial Verification

| Check | Expected | Status |
|-------|----------|--------|
| `LIVE_WRITES_ENABLED` | `false` | Pending |
| Branch protection on `main` | Enabled | Verified (prior evidence) |
| GitHub App least-privilege | Contents R/W, PRs R/W, Metadata RO | Verified (prior evidence) |
| Cloudflare Access policy | Configured | Verified (prior evidence) |
| Turnstile verification | Active | Verified (prior evidence) |
| Rate limiting | Configured | Verified (prior evidence) |
| Secret scan | No secrets in workspace | Pending (will run before push) |

---

## 5. Conclusion

**Risk Level**: Low — the trial creates one branch and one PR, both of which are cleaned up after evidence recording. All live-write paths are blocked by `LIVE_WRITES_ENABLED=false`.

**Recommendation**: Proceed with exactly one controlled production PR trial.
