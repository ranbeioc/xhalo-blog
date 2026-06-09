# Level 2 PR Generator Gate Checklist

> Status: Draft / Not approved  
> Current decision: Level 2 Trial is blocked until all required gates are checked and approved.

---

## 1. Scope

Level 2 allows exactly one controlled PR-generation trial against the approved test repository. It does not allow production publishing, direct main writes, auto-merge, or repeated batch writes.

---

## 2. Required Gates

### G0 - Repository and source hygiene

- [ ] Source tree contains no raw secrets.
- [ ] Source tree contains no concrete staging Worker URL.
- [ ] Source tree contains no local absolute Windows file scheme links except explicitly marker-allowlisted historical progress docs.
- [ ] PR #50 metadata has been redacted.
- [ ] `npm run check:all` passes.
- [ ] `npm run check:secrets` passes.
- [ ] `npm run test:secrets-fixture` passes.

### G1 - Level 1 read-only validation

- [ ] Level 1 report exists.
- [ ] Level 1 report uses placeholders only.
- [ ] `/api/readiness` passed.
- [ ] `/api/posts` passed.
- [ ] dry-run publish passed.
- [ ] live publish blocked with 403 under `LIVE_WRITES_ENABLED=false`.
- [ ] no test branch was created.
- [ ] no test PR was created.
- [ ] D1/R2 evidence limitation is acknowledged.

### G2 - Staging async E2E evidence

- [ ] `ASYNC_PUBLISH_MODE=e2e` runbook is ready.
- [ ] staging API Worker and Queue Worker are deployed.
- [ ] test repo target is `ranbeioc/xhalo-blog-test`.
- [ ] `LIVE_WRITES_ENABLED=true` is enabled only temporarily for the authorized staging E2E run.
- [ ] API returns `202`.
- [ ] task record transitions to terminal state.
- [ ] Queue Worker processes the task.
- [ ] GitHub draft branch is created in the test repo.
- [ ] GitHub PR is created in the test repo.
- [ ] audit logs include queued and completed actions.
- [ ] cleanup is completed.
- [ ] `LIVE_WRITES_ENABLED=false` is restored.
- [ ] sanitized evidence is written to docs.

### G3 - GitHub repository protection

- [ ] Target repository branch protection verified.
- [ ] `main` blocks direct push where applicable.
- [ ] force push disabled where applicable.
- [ ] auto-merge not enabled.
- [ ] PR merge requires manual owner action.
- [ ] test branch naming prefix is restricted to `drafts/`.

### G4 - GitHub App / token permissions

- [ ] GitHub App or token is scoped to the test repository only.
- [ ] Contents permission is minimum required for branch/file creation.
- [ ] Pull Requests permission is minimum required for PR creation.
- [ ] Metadata read permission is available.
- [ ] No broad org-wide write token is used.
- [ ] Token is not logged.
- [ ] Token is not committed.
- [ ] Token is not present in PR body or issue comments.

### G5 - Cloudflare runtime protection

- [ ] Cloudflare Access policy protects admin/API endpoints.
- [ ] Admin shared secret configured through Worker secret only.
- [ ] Turnstile configured or explicit staging test-token policy documented.
- [ ] `LIVE_WRITES_ENABLED=false` default verified.
- [ ] Temporary `LIVE_WRITES_ENABLED=true` window is documented and bounded.
- [ ] Rollback path is documented.

### G6 - Cleanup and rollback readiness

- [ ] Cleanup runbook exists.
- [ ] Test PR close procedure exists.
- [ ] Draft branch deletion procedure exists.
- [ ] D1 test task cleanup or retention policy exists.
- [ ] R2 test object cleanup policy exists.
- [ ] Audit evidence retention policy exists.
- [ ] Worker rollback instructions exist.

### G7 - Owner approval

- [ ] Repository owner explicitly approves Level 2 Single PR Trial.
- [ ] Approval includes exact target repo, branch prefix, test slug, operator, time window.
- [ ] Approval explicitly says this is not production publishing.

---

## 3. Current Gate Decision

- [ ] Approved for Level 2 Single PR Trial
- [x] Not approved yet

Reason: gate checklist is being prepared. Trial must not execute until all gates are complete and owner approval is recorded.
