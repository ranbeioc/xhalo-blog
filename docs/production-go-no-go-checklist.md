# Production Go / No-Go Decision

This document records the formal Go / No-Go decision and readiness checklist for deploying `xhalo-blog` to production environments.

---

## 1. Current Gate Decision

* **Current Decision**: **NO-GO for live production writes**.
* **Approved Scope**: **Level 2 Single PR Trial completed; pending production-readiness review only**.
* **Reasoning**:
  1. The API and Queue Worker architecture has successfully passed staging unit and integration smoke testing.
  2. Level 1 read-only connection compatibility validation has been completed successfully and sanitized.
  3. Staging async E2E evidence and Level 2 Single PR Trial execution evidence have been completed, verified, and cleaned up.
  4. Staging environment variable `LIVE_WRITES_ENABLED` was successfully restored to `false`, and all test branches/PRs deleted.
  *Note: This approval does not authorize production publishing, direct main writes, auto-merge, batch publishing, or writes to `hexo-blog`.*

---

## 2. Production Gate Checklist

### 2.1 Pre-requisites for Level 1 (Read-Only Validation)
- [x] README aligned with the current Queue Worker asynchronous publishing capability.
- [x] Integration smoke tests (`smoke-async-publish.mjs`) pass successfully.
- [x] All unit tests (80/80) pass cleanly.
- [x] Secrets scanning checks pass with no raw tokens or credentials committed.
- [x] Admin token headers (`x-xhalo-admin-secret` / `cf-turnstile-token`) standardized in code and docs.
- [x] Staging async publish verification evidence generated and logged.
  *Note: Phase 7.1 async E2E evidence is completed and logged in docs.*

### 2.2 Pre-requisites for Level 2 (PR Generator Trial Mode)
- [x] Level 1 read-only connection compatibility validation completed successfully.
- [x] Level 2 gate checklist completed.
- [x] Level 2 cleanup runbook completed.
- [x] Staging async E2E evidence plan completed.
- [x] Staging async E2E evidence template completed.
- [x] Branch protection verification completed.
- [x] GitHub App / token least-privilege verification completed.
- [x] Cloudflare runtime safety checklist completed.
- [x] Repository owner has explicitly approved actual staging E2E execution.
- [x] Staging async E2E execution approval completed.
- [x] Staging async E2E preflight checklist completed.
- [x] Owner has approved the exact execution window and operator.
- [x] Target repository has branch protection enabled on `main` (blocking direct push/force-push).
- [x] GitHub App installation verified with least-privilege permissions (Contents: Read/Write, PRs: Read/Write, Metadata: Read-only).
- [x] Staging async E2E evidence completed and logged.
- [x] `LIVE_WRITES_ENABLED` is set to `false` by default on all environments except during active authorized testing.
- [x] Staging async E2E branch-prefix deviation resolved.
- [x] Branch prefix standard reconciled across docs and runtime.
- [x] Level 2 Single PR Trial approval document completed.
- [x] Level 2 Single PR Trial preflight checklist completed.
- [x] Owner has approved the exact Level 2 Trial execution window and operator.
- [x] Level 2 Trial cleanup runbook reviewed.
- [x] Repository owner has explicitly reviewed and approved this checklist.
- [x] Level 2 Single PR Trial evidence completed and logged.
- [x] Level 2 Single PR Trial cleanup completed.
- [x] Trial PR closed without merge.
- [x] Trial branch deleted.
- [x] `LIVE_WRITES_ENABLED=false` restored after trial.

### 2.3 Prohibited Configurations
- [ ] Worker configured to commit directly to `main` (Prohibited).
- [ ] Worker configured to auto-merge Pull Requests (Prohibited).
- [ ] Exposing unauthenticated or public live-write publish endpoints (Prohibited).
- [ ] Committing production secrets or URLs to documentation or code (Prohibited).

---

## 3. Disaster Recovery and Rollback Checklist
- [ ] Operator knows how to execute a Cloudflare Worker deployment rollback via Dashboard or Wrangler CLI.
- [ ] Pre-migration database backup commands verified and runbooks written.
- [ ] R2 draft prefix assets cleanup procedures documented.
- [ ] D1 audit log table maintenance query ready.
