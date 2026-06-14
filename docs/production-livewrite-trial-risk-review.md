# Production Live-write Trial — Risk Review

**Date**: 2026-06-14  
**Repository**: `ranbeioc/xhalo-blog`  
**Reviewer**: Antigravity  

---

## 1. Trial Description

Execute exactly one controlled production live-write trial to verify the production pipeline can successfully:

1. Receive an authorized publish request on the production worker.
2. Enqueue the task to the production TASK_QUEUE.
3. Consume the task via the production Queue Worker.
4. Create a draft branch `draft/production-live-write-trial-20260614` in the target production repository `ranbeioc/hexo-blog`.
5. Commit the compiled post Markdown file.
6. Create an open Pull Request on `ranbeioc/hexo-blog`.
7. Persist audit and task states in the production D1 database.
8. Revert `LIVE_WRITES_ENABLED=false` to restore safety.

---

## 2. Risk Assessment & Controls

### 2.1 Authorized Mutations (Controlled Live Writes)

* **Creation of 1 branch & 1 PR**: Low Risk. Enforced by limiting request count to 1 and using a specific trial slug. The PR will remain open for owner review.
* **Database task/audit logs**: Low Risk. Standard SQLite row inserts; non-destructive.

### 2.2 Prohibited Actions

| Action | Risk Level | Active Control |
|---|---|---|
| **Direct push to main** | Critical | Branch protection on `main` blocks direct push. |
| **Auto merge of trial PR** | Critical | No auto-merge enabled or coded. |
| **Multiple requests / loop** | Critical | Strict operator constraint (exactly one request). |
| **Secrets logged in files** | Critical | Static scan `check:secrets` checked. Env secrets configured on CF, not logged. |
| **Destructive D1 write** | Critical | Schema does not contain drops or truncates on normal run paths. |

### 2.3 Stop & Rollback Conditions

If any of the following occur, the operator must immediately halt and execute rollback:
* Multiple PRs are opened.
* Direct commits are registered on `main`.
* Secrets are leaked in response logs.
* Queue Worker throws continuous access tokens errors.

---

## 3. Rollback Runbook

1. **Close Pull Request** without merge via GitHub UI or `gh pr close <number>`.
2. **Delete draft branch** via `git push origin --delete draft/production-live-write-trial-20260614`.
3. **Verify main HEAD unchanged** via `git log main -1` on `hexo-blog`.
4. **Restore `LIVE_WRITES_ENABLED=false`** immediately by redeploying the worker with default vars.
