# Production Go / No-Go Decision

This document records the formal Go / No-Go decision and readiness checklist for deploying `xhalo-blog` to production environments.

---

## 1. Current Gate Decision

* **Current Decision**: **NO-GO for live production writes**.
* **Approved Scope**: **Approved for Staging Async E2E Execution Approval Review only**.
* **Reasoning**:
  1. The API and Queue Worker architecture has successfully passed staging unit and integration smoke testing.
  2. Level 1 read-only connection compatibility validation has been completed successfully and sanitized.
  3. Staging async E2E evidence templates and safety plans have been prepared.
  4. Before enabling active writes, the operator must complete the staging E2E run under explicit owner approval and verify the resulting E2E evidence.

---

## 2. Production Gate Checklist

### 2.1 Pre-requisites for Level 1 (Read-Only Validation)
- [x] README aligned with the current Queue Worker asynchronous publishing capability.
- [x] Integration smoke tests (`smoke-async-publish.mjs`) pass successfully.
- [x] All unit tests (80/80) pass cleanly.
- [x] Secrets scanning checks pass with no raw tokens or credentials committed.
- [x] Admin token headers (`x-xhalo-admin-secret` / `cf-turnstile-token`) standardized in code and docs.
- [ ] Staging async publish verification evidence generated and logged.
  *Note: Phase 7.1 async evidence template exists; real sanitized staging evidence remains pending.*

### 2.2 Pre-requisites for Level 2 (PR Generator Trial Mode)
- [x] Level 1 read-only connection compatibility validation completed successfully.
- [x] Level 2 gate checklist completed.
- [x] Level 2 cleanup runbook completed.
- [ ] Staging async E2E evidence plan completed.
- [ ] Staging async E2E evidence template completed.
- [ ] Branch protection verification completed.
- [ ] GitHub App / token least-privilege verification completed.
- [ ] Cloudflare runtime safety checklist completed.
- [ ] Repository owner has explicitly approved actual staging E2E execution.
- [ ] Staging async E2E execution approval completed.
- [ ] Staging async E2E preflight checklist completed.
- [ ] Owner has approved the exact execution window and operator.
- [ ] Target repository has branch protection enabled on `main` (blocking direct push/force-push).
- [ ] GitHub App installation verified with least-privilege permissions (Contents: Read/Write, PRs: Read/Write, Metadata: Read-only).
- [ ] Staging async E2E evidence completed and logged.
- [ ] `LIVE_WRITES_ENABLED` is set to `false` by default on all environments except during active authorized testing.
- [ ] Repository owner has explicitly reviewed and approved this checklist.

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
