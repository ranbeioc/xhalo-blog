# Level 2 PR Generator Gate Checklist

> Status: Approved  
> Current decision: Approved for one controlled Level 2 Single PR Trial in the approved next stage.

---

## 1. Scope

Level 2 allows exactly one controlled PR-generation trial against the approved test repository. It does not allow production publishing, direct main writes, auto-merge, or repeated batch writes.

---

## 2. Required Gates

### G0 - Repository and source hygiene

- [x] Source tree contains no raw secrets.
- [x] Source tree contains no concrete staging Worker URL.
- [x] Source tree contains no local absolute Windows file scheme links except explicitly marker-allowlisted historical progress docs.
- [x] PR #50 metadata has been redacted.
- [x] `npm run check:all` passes.
- [x] `npm run check:secrets` passes.
- [x] `npm run test:secrets-fixture` passes.

### G1 - Level 1 read-only validation

- [x] Level 1 report exists.
- [x] Level 1 report uses placeholders only.
- [x] `/api/readiness` passed.
- [x] `/api/posts` passed.
- [x] dry-run publish passed.
- [x] live publish blocked with 403 under `LIVE_WRITES_ENABLED=false`.
- [x] no test branch was created.
- [x] no test PR was created.
- [x] D1/R2 evidence limitation is acknowledged.

### G2 - Staging async E2E evidence

*Related documents: [docs/staging-async-e2e-evidence-plan.md](./staging-async-e2e-evidence-plan.md) and [docs/staging-async-e2e-evidence-template.md](./staging-async-e2e-evidence-template.md)*

- [x] `ASYNC_PUBLISH_MODE=e2e` runbook is ready.
- [x] staging API Worker and Queue Worker are deployed.
- [x] test repo target is `ranbeioc/xhalo-blog-test`.
- [x] `LIVE_WRITES_ENABLED=true` is enabled only temporarily for the authorized staging E2E run.
- [x] API returns `202`.
- [x] task record transitions to terminal state.
- [x] Queue Worker processes the task.
- [x] GitHub draft branch is created in the test repo.
- [x] GitHub PR is created in the test repo.
- [x] audit logs include queued and completed actions.
- [x] cleanup is completed.
- [x] `LIVE_WRITES_ENABLED=false` is restored.
- [x] sanitized evidence is written to docs.
- [x] staging async E2E execution approval document completed.
- [x] staging async E2E preflight checklist completed.
- [x] owner approval statement recorded before execution.
- [x] Branch prefix standard reconciled after staging E2E.
- [x] E2E branch prefix deviation reviewed.

### G3 - GitHub repository protection

*Related document: [docs/branch-protection-verification.md](./branch-protection-verification.md)*

- [x] Target repository branch protection verified.
- [x] `main` blocks direct push where applicable.
- [x] force push disabled where applicable.
- [x] auto-merge not enabled.
- [x] PR merge requires manual owner action.
- [x] test branch naming prefix is restricted to `draft/`.

### G4 - GitHub App / token permissions

*Related document: [docs/level2-permission-verification.md](./level2-permission-verification.md)*

- [x] GitHub App or token is scoped to the test repository only.
- [x] Contents permission is minimum required for branch/file creation.
- [x] Pull Requests permission is minimum required for PR creation.
- [x] Metadata read permission is available.
- [x] No broad org-wide write token is used.
- [x] Token is not logged.
- [x] Token is not committed.
- [x] Token is not present in PR body or issue comments.

### G5 - Cloudflare runtime protection

*Related document: [docs/cloudflare-runtime-safety-checklist.md](./cloudflare-runtime-safety-checklist.md)*

- [x] Cloudflare Access policy protects admin/API endpoints.
- [x] Admin shared secret configured through Worker secret only.
- [x] Turnstile configured or explicit staging test-token policy documented.
- [x] `LIVE_WRITES_ENABLED=false` default verified.
- [x] Temporary `LIVE_WRITES_ENABLED=true` window is documented and bounded.
- [x] Rollback path is documented.

### G6 - Cleanup and rollback readiness

- [x] Cleanup runbook exists.
- [x] Test PR close procedure exists.
- [x] Draft branch deletion procedure exists.
- [x] D1 test task cleanup or retention policy exists.
- [x] R2 test object cleanup policy exists.
- [x] Audit evidence retention policy exists.
- [x] Worker rollback instructions exist.

### G7 - Owner approval

- [x] Repository owner explicitly approves Level 2 Single PR Trial.
- [x] Approval includes exact target repo, branch prefix, test slug, operator, time window.
- [x] Approval explicitly says this is not production publishing.

### G8 - Level 2 Single PR Trial approval

- [x] Level 2 Single PR Trial approval document completed.
- [x] Level 2 Single PR Trial preflight checklist completed.
- [x] Owner approval statement recorded before trial.
- [x] Trial execution window recorded.
- [x] Trial operator recorded.
- [x] Cleanup and rollback reviewed.

---

## 3. Current Gate Decision

- [x] Approved for Level 2 Single PR Trial
- [ ] Not approved yet

Reason: Owner approval and preflight have been completed. Trial is limited to one controlled next-stage run against ranbeioc/xhalo-blog-test using branch draft/level2-single-pr-trial.
