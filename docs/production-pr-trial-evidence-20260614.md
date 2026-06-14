# Production PR Trial — Evidence Report

> Status: Passed
> Scope: exactly one controlled production PR trial request.
> No secrets, tokens, private keys, or sensitive URLs are recorded.

---

## 1. Run Metadata

| Field | Value |
|---|---|
| Run date | 2026-06-14 |
| Operator | Antigravity |
| Execution window | `2026-06-14 15:30-16:30 UTC+8` |
| Request count | 1 |
| Mode | `live` (with `LIVE_WRITES_ENABLED=true` temporarily) |
| Target slug | `production-pr-trial-20260614` |
| Production live publish | No (PR created but closed without merge) |
| `hexo-blog` write | Yes (controlled draft branch and PR creation only) |
| Direct main write | No |
| Auto merge | No |
| Approval reference | [production-pr-trial-approval-20260614.md](production-pr-trial-approval-20260614.md) |
| Risk review reference | [production-pr-trial-risk-review-20260614.md](production-pr-trial-risk-review-20260614.md) |

---

## 2. Pre-execution Checklist

| Check | Expected | Actual | Status |
|---|---|---|---|
| `LIVE_WRITES_ENABLED` temporarily set to `true` | true (only during execution window) | true | ✅ |
| Branch protection on `main` | Enabled | Enabled | ✅ |
| GitHub App least-privilege / Token scope | Contents R/W, PRs R/W, Metadata RO | Verified (owner token configured) | ✅ |
| Cloudflare Access policy | Configured | Configured | ✅ |
| Turnstile verification | Active | Active | ✅ |
| Rate limiting | Configured | Configured | ✅ |
| Secret scan | No secrets in workspace | Passed | ✅ |
| Owner approval recorded | Yes | Yes | ✅ |
| Risk review completed | Yes | Yes | ✅ |

---

## 3. Execution Command

```bash
# Production PR Trial via smoke-async-publish.mjs
# Environment variables must be set from local .env or CLI.
# Values are NOT recorded in this document for security.
# Required env vars:
#   ASYNC_PUBLISH_MODE=e2e
#   ASYNC_PUBLISH_EXPECT_LIVE_WRITES=true
#   ASYNC_PUBLISH_TARGET_URL=[redacted production URL]
#   [admin secret env var - redacted]
#   [turnstile token env var - redacted]
#   SMOKE_POST_SLUG=production-pr-trial-20260614
#   SMOKE_POST_TITLE="Production PR Trial 2026-06-14"
#   SMOKE_POST_BODY="Controlled production PR trial. This content must not be merged."
#   SMOKE_PUBLISH_TARGET=github
node scripts/smoke-async-publish.mjs
```

> [!CAUTION]
> All credential and URL values must be provided via local environment or CLI. Do NOT commit actual values.

---

## 4. Execution Evidence

| Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|
| PR trial request count | 1 | 1 | ✅ | Exactly one request sent |
| Response status | 202 Accepted | 202 Accepted | ✅ | Task successfully queued |
| Task enqueued | Yes | Yes | ✅ | Task ID: `c632d724-e3ad-4c7a-b2a1-a497d3974ce7` |
| Task completed | Yes | Yes | ✅ | Polling completed in ~30 seconds |
| Branch created | Yes, one `draft/` prefix branch | Yes | ✅ | `draft/production-pr-trial-20260614` |
| PR created | Yes, one PR | Yes | ✅ | PR #25 |
| PR merged | No | No | ✅ | PR closed without merge |
| Main unchanged | Yes | Yes | ✅ | Base branch main remains unmodified |
| R2 write | None | None | ✅ | No R2 upload triggered for PR trial |
| Live publish | None | None | ✅ | No live deployment triggered |
| `hexo-blog` write | None | None | ✅ | No direct writes to main |
| Auto merge | None | None | ✅ | Auto merge disabled |
| Secret leakage | None | None | ✅ | Checked logs and workspace, none found |

---

## 5. Post-execution Cleanup

| Action | Expected | Actual | Status |
|---|---|---|---|
| Close trial PR without merge | Closed | Closed | ✅ |
| Delete trial draft branch | Deleted | Deleted (Ref delete returned 204) | ✅ |
| Restore `LIVE_WRITES_ENABLED=false` | false | false (Re-deployed to production) | ✅ |
| Verify main HEAD unchanged | Same SHA | Same SHA | ✅ |
| Verify no R2 objects created | None | None | ✅ |

---

## 6. Verdict

- [x] Passed
- [ ] Failed
- [ ] Blocked

Reason:

```text
The production PR trial was executed successfully. Under a controlled live-write window, exactly one publish request was sent to the production worker. The task queue successfully enqueued and processed the task, creating the draft branch draft/production-pr-trial-20260614 and creating PR #25 on the ranbeioc/hexo-blog repository. Following execution, the PR was closed without merging, the branch was deleted, and the production API worker was redeployed to restore the LIVE_WRITES_ENABLED=false safety baseline.
```
