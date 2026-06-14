# Production Live-write Trial — Evidence Report

> Status: Passed  
> Scope: exactly one controlled production live-write trial request.  
> No secrets, tokens, private keys, or sensitive URLs are recorded.  

---

## 1. Run Metadata

| Field | Value |
|---|---|
| Run date | 2026-06-14 |
| Operator | Antigravity |
| Execution window | `2026-06-14 15:55-16:55 UTC+8` |
| Request count | 1 |
| Mode | `live` (with `LIVE_WRITES_ENABLED=true` temporarily) |
| Target slug | `production-live-write-trial-20260614` |
| Pull Request URL | `https://github.com/ranbeioc/hexo-blog/pull/26` |
| Commit SHA | `8d9412f52bdeb3709ddb50ddaac5e8330a973970` |
| Approval reference | [production-livewrite-trial-approval.md](production-livewrite-trial-approval.md) |
| Risk review reference | [production-livewrite-trial-risk-review.md](production-livewrite-trial-risk-review.md) |

---

## 2. Pre-execution Checklist

| Check | Expected | Actual | Status |
|---|---|---|---|
| `LIVE_WRITES_ENABLED` temporarily set to `true` | true (only during execution window) | true | ✅ |
| Branch protection on `main` | Enabled | Enabled | ✅ |
| GitHub App least-privilege / Token scope | Contents R/W, PRs R/W, Metadata RO | Verified | ✅ |
| Cloudflare Access policy | Configured | Configured | ✅ |
| Turnstile verification | Active | Active | ✅ |
| Rate limiting | Configured | Configured | ✅ |
| Secret scan | No secrets in workspace | Passed | ✅ |
| Owner approval recorded | Yes | Yes | ✅ |
| Risk review completed | Yes | Yes | ✅ |

---

## 3. Execution Command

```bash
# Production Live-write Trial via smoke-async-publish.mjs
# Environment variables must be set from local .env or CLI.
# Required env vars:
#   ASYNC_PUBLISH_MODE=e2e
#   ASYNC_PUBLISH_EXPECT_LIVE_WRITES=true
#   ASYNC_PUBLISH_TARGET_URL=[redacted production URL]
#   [admin secret env var - redacted]
#   [turnstile token env var - redacted]
#   SMOKE_POST_SLUG=production-live-write-trial-20260614
#   SMOKE_POST_TITLE="Production Live-write Trial"
#   SMOKE_POST_BODY="This is a controlled production live-write trial. The resulting PR may be merged to production main after verification."
#   SMOKE_PUBLISH_TARGET=github
node scripts/smoke-async-publish.mjs
```

---

## 4. Execution Evidence

| Check | Expected | Actual | Status | Notes |
|---|---|---|---|---|
| request count | 1 | 1 | ✅ | Exactly one request sent |
| Response status | 202 Accepted | 202 Accepted | ✅ | Task successfully enqueued |
| Task enqueued | Yes | Yes | ✅ | Task ID: `33ac13af-c771-45b6-a6e0-dfd04a2c5521` |
| Task completed | Yes | Yes | ✅ | Polling completed in ~35 seconds |
| Branch created | Yes, one `draft/` prefix branch | Yes | ✅ | `draft/production-live-write-trial-20260614` |
| PR created | Yes, one PR | Yes | ✅ | PR #26 |
| PR merged | No (will remain open for owner review) | No | ✅ | PR #26 remains open on remote |
| Main unchanged | Yes | Yes | ✅ | Target repo main branch unmodified |
| R2 write | None | None | ✅ | No R2 assets upload triggered |
| Secret leakage | None | None | ✅ | Verified, no secrets logged |

---

## 5. Post-execution Cleanup & Status

| Action | Expected | Actual | Status |
|---|---|---|---|
| Restore `LIVE_WRITES_ENABLED=false` | false | false (Re-deployed to production) | ✅ |
| Confirm subsequent write requests fail | 403 Forbidden | Confirmed (API rejects mutations with 403) | ✅ |

---

## 6. Verdict

- [x] Passed
- [ ] Failed
- [ ] Blocked

Reason:

```text
The production live-write trial completed successfully. Under a controlled execution window, exactly one write request was processed. The Queue Worker successfully created branch draft/production-live-write-trial-20260614 and opened PR #26 on ranbeioc/hexo-blog. The environment variable LIVE_WRITES_ENABLED=false was immediately restored, and subsequent writes are rejected as expected. The PR remains open for final merge verification by the repository owner.
```

---

## 7. Follow-up Required

- [x] `LIVE_WRITES_ENABLED=false` restored.
- [x] Subsequent writes rejected with 403.
- [x] PR #26 created as controlled trial output.
- [x] Owner reviewed PR #26.
- [x] Owner decided to close PR #26 without merge.
- [x] PR #26 closed without merge.
- [x] Generated test content was not released to `hexo-blog/main`.
- [x] No auto-merge used.
- [x] No direct main write used.
- [x] No additional production request executed.
- [x] Draft branch deleted.

Current follow-up status:

```text
Owner reviewed PR #26 and decided not to publish the generated test content. PR #26 was closed without merge. The controlled live-write trial remains valid because the system successfully created a draft branch and PR, while release to main remained under manual owner control.
```
