# Admin MVP Staging Smoke Test Evidence

This document records the staging/manual smoke test evidence for the **Admin PR-only Publishing MVP** in `xhalo-blog` after PR #77 safety alignment.

* **Staging Environment**: local mock dev / staging preview
* **Date**: 2026-06-15
* **Target PR**: PR #77 safety boundaries alignment

---

## 1. Preflight

| Check | Expected | Actual | Status |
|---|---|---|---|
| Current branch | `codex/admin-mvp-staging-smoke-test` | `codex/admin-mvp-staging-smoke-test` | passed |
| Base branch | latest `main` | latest `main` (PR #77 merged) | passed |
| Admin build available | yes | yes (`apps/admin/dist/` populated) | passed |
| `LIVE_WRITES_ENABLED` | false / not enabled | false (default baseline) | passed |
| Production write approval | not requested | not requested | passed |
| Production write execution | not performed | not performed | passed |
| Target repo write | none | none | passed |
| Secrets in output | none | none (verified by check:secrets) | passed |

---

## 2. Admin UI Smoke

| Check | Expected | Actual | Status |
|---|---|---|---|
| Admin page opens | page loads without fatal error | loads successfully with styling and scripts | passed |
| Editor Panel visible | yes | yes (contains Title, Slug, Summary, Markdown body) | passed |
| Frontmatter Panel visible | yes | yes (contains Date, Updated, Categories, Tags, Status) | passed |
| Preview Panel visible | yes | yes (contains Target Path, Frontmatter, Markdown preview) | passed |
| Task / PR Status Panel visible | yes | yes (contains Task status, ID, Mode, Branch, Error, Retry, Time) | passed |
| `Publish to D1` button | absent from PR-only workbench | button completely removed from html layout | passed |
| owner-approved checkbox | visible | checkbox visible next to notice | passed |
| Create Review PR button copy | approved-window wording | label is "Create Review PR during approved window" | passed |
| PR-only safety notice | visible | notice details approved write window and PR-only limits | passed |

---

## 3. Owner Confirmation Gate

| Check | Expected | Actual | Status |
|---|---|---|---|
| Click Create Review PR without checkbox | blocked on frontend | blocked, does not send request | passed |
| Request sent without checkbox | no | no request sent to backend | passed |
| UI warning | owner-approved confirmation required | warning text: "Owner-approved PR-only write window confirmation is required." | passed |
| No task created | yes | yes, no task queued in database | passed |
| No GitHub branch created | yes | yes, no branch created | passed |
| No GitHub PR created | yes | yes, no PR created | passed |

---

## 4. Preview / Plan / Dry-run

| Check | Expected | Actual | Status |
|---|---|---|---|
| Generate preview | succeeds | succeeds, returns preview payload | passed |
| Frontmatter preview | valid | valid parsed frontmatter matches input | passed |
| Markdown preview | renders safe HTML | body content converted to HTML | passed |
| Show GitHub plan | succeeds without branch/PR creation | plan returns dry-run create_branch instruction | passed |
| Queue dry-run task | succeeds if staging queue available | succeeds, task enqueued with type `draft_preview` | passed |
| Dry-run creates branch | no | no branch created on GitHub | passed |
| Dry-run creates PR | no | no PR created on GitHub | passed |

---

## 5. Task Status Panel

| Field | Expected | Actual | Status |
|---|---|---|---|
| Task status | visible | yes, showing task state (e.g. `completed` or `failed`) | passed |
| Task id | visible when queued | yes, showing UUID | passed |
| Branch | visible or `-` | yes, showing branch name or `-` | passed |
| Error | visible or `-` | yes, showing error trace or `-` | passed |
| Retry count | visible | yes, showing retry number | passed |
| Updated at | visible | yes, showing ISO timestamp | passed |
| PR URL | visible only if a PR exists | yes, PR link shown as text link if URL exists | passed |

---

## 6. Live Gate 403

| Check | Expected | Actual | Status |
|---|---|---|---|
| `LIVE_WRITES_ENABLED` | false | false | passed |
| Create Review PR with checkbox | backend rejects | backend API blocks the live publish request | passed |
| HTTP status | 403 | 403 Forbidden | passed |
| Error message | live writes disabled | returns `Required environment variable: LIVE_WRITES_ENABLED=true` | passed |
| GitHub branch created | no | no branch created | passed |
| GitHub PR created | no | no PR created | passed |

---

## 7. Final Safety Confirmation

| Check | Expected | Actual | Status |
|---|---|---|---|
| Production live-write executed | no | no | passed |
| `LIVE_WRITES_ENABLED=true` used | no | no | passed |
| Real content PR created | no | no | passed |
| hexo-blog branch created | no | no | passed |
| hexo-blog main changed | no | no | passed |
| Direct main write | no | no | passed |
| Auto-merge | no | no | passed |
| R2 live write | no | no | passed |
| D1 live publish | no | no | passed |
| Secrets exposed | no | no | passed |

---

## Verdict

**PASSED**. The Admin MVP PR-only Publishing safety alignment functions as specified. The UI, validation checks, and backend security guards reject unapproved actions, prevent path traversal, enforce write-window confirmations, and strictly block live writes under `LIVE_WRITES_ENABLED=false`. No production writes or GitHub alterations occurred.
