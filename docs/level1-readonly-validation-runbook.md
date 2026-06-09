# Level 1 Read-Only Compatibility Validation Runbook

This runbook guides operators through executing a **Level 1 (Read-Only)** compatibility validation. In this mode, the worker environment reads configuration and repository data from the target production repository, but is strictly prohibited from executing writes, creating branches, or opening pull requests.

---

## 1. Prerequisites and Objectives

### Objectives
* Verify that the API Worker can authenticate and parse the configuration/structure of the target repository.
* Confirm that all dry-run routes function correctly.
* Ensure that no write operations are attempted or executed.

### Target Environment Requirements
* Staging/Pre-production API Worker instance running at `<production-api-url>` (protected by Cloudflare Access).
* Target Repository: Production Hexo Blog repository (`<owner>/<production-repo>`).

---

## 2. Configuration Settings

Ensure the following environment variables are bound/configured in the target Cloudflare Worker environment:

| Variable | Staging Value | Rationale |
|---|---|---|
| `LIVE_WRITES_ENABLED` | `false` | **Mandatory**. Rejects all write actions at the gateway level. |
| `GITHUB_OWNER` | `<owner>` | Target repository owner (username or organization). |
| `GITHUB_REPO` | `<production-repo>` | Target repository name. |
| `GITHUB_BRANCH` | `main` | Target repository default branch (e.g., `main`). |
| `GITHUB_TOKEN` | `<read-only-token>` | GitHub Personal Access Token or App Installation Token with **read-only** contents access. |
| `ADMIN_API_SHARED_SECRET` | `your-admin-shared-secret` | For admin authentication. |

*Note: Do not use `GITHUB_REPO_OWNER` or `GITHUB_REPO_NAME` unless aliases are explicitly implemented in code. Standard variables in the worker environment are `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH`.*

---

## 3. Verification Procedures

### Step 1: Readiness Verification
Execute a GET request to the readiness endpoint to verify auth and DB connection:
```bash
curl -X GET "https://<production-api-url>/api/readiness" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret"
```
**Expected Response (200 OK)**:
```json
{
  "status": "ready",
  "d1": "available"
}
```

### Step 2: Dry-run Draft Publish Execution
Submit a publish request specifying `mode: "dry-run"` to test parsing and structural compatibility. Since this is a POST request, a Turnstile challenge token must be provided:
```bash
curl -X POST "https://<production-api-url>/api/drafts/publish" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret" \
  -H "cf-turnstile-token: <turnstile-token>" \
  -H "content-type: application/json" \
  -d '{
    "title": "Staging Post",
    "slug": "staging-post",
    "body": "This is a compatibility check draft.",
    "mode": "dry-run",
    "publish_target": "github"
  }'
```

*Note: If `TURNSTILE_SECRET_KEY` is not configured in the environment, the API may bypass this verification. For staging/testing environments utilizing Cloudflare Turnstile test keys, the sitekey bypass token `dummy-token` may be passed. In production-like validation, use a real Turnstile challenge token.*

**Expected Response (200 OK)**:
```json
{
  "mode": "dry-run",
  "auth_mode": "token",
  "preview": {
    "draft": {
      "title": "Staging Post",
      "slug": "staging-post"
    },
    "filePath": "source/_posts/staging-post.md",
    "branchName": "draft/staging-post"
  },
  "plan": {
    "ops": [
      {
        "op": "create_branch",
        "branch": "draft/staging-post"
      },
      {
        "op": "commit_file",
        "path": "source/_posts/staging-post.md"
      },
      {
        "op": "create_pull_request",
        "title": "draft: Staging Post"
      }
    ]
  },
  "note": "Dry-run draft publish only. No branch, commit, or PR has been created."
}
```

### Step 3: Verify Gateway Safety (Write Attempt Check)
Force a write request by sending `mode: "live"`. The gateway must intercept and reject the request with `403 Forbidden` before checking Turnstile or sending tasks to the queue:
```bash
curl -X POST "https://<production-api-url>/api/drafts/publish" \
  -H "x-xhalo-admin-secret: your-admin-shared-secret" \
  -H "cf-turnstile-token: <turnstile-token>" \
  -H "content-type: application/json" \
  -d '{
    "title": "Staging Post",
    "slug": "staging-post",
    "body": "This is an unauthorized live write attempt.",
    "mode": "live",
    "publish_target": "github"
  }'
```
**Expected Response (403 Forbidden)**:
```json
{
  "error": "Live writes are disabled in this environment.",
  "required_env": "LIVE_WRITES_ENABLED=true"
}
```

### Step 4: Automated Verification Script
For a fully automated connection and read-only validation check, execute the verification script with the necessary environment variables:
```bash
LEVEL1_TARGET_URL="https://<production-api-url>" \
ADMIN_API_SHARED_SECRET="your-admin-shared-secret" \
LEVEL1_TURNSTILE_TOKEN="your-turnstile-token" \
GITHUB_OWNER="<owner>" \
GITHUB_REPO="<production-repo>" \
GITHUB_TOKEN="<read-only-token>" \
npm run verify:level1
```

**Expected Script Output**:
The script will perform assertions on readiness, post indexes, dry-run publishing structure, and live write blocks, followed by checking GitHub remote states to ensure no branch or PR exists:
```text
Starting Level 1 Read-Only Validation...
Target URL: https://<production-api-url>
Admin Secret: ********
Turnstile Token: your-turnstile-token
GitHub Repo: <owner>/<production-repo>

✓ [PASS] GET /api/readiness (Authentication and D1 Connection)
✓ [PASS] GET /api/posts (Retrieve Posts Index)
✓ [PASS] POST /api/drafts/publish (Dry-Run mode returns plan)
✓ [PASS] POST /api/drafts/publish (Live write is BLOCKED by gateway)

Verifying remote GitHub state for branch 'draft/level1-smoke-test-dry-run'...
✓ [PASS] GitHub: branch 'draft/level1-smoke-test-dry-run' does not exist (404 OK)
✓ [PASS] GitHub: no Pull Request exists for branch 'draft/level1-smoke-test-dry-run'

Level 1 Read-Only Validation Summary:
  Passed: 6
  Failed: 0

✓ Level 1 Read-Only Validation completed successfully!
```

---

## 4. Compatibility Report Checklist

After executing the validation, operators must check off the following items:
- [ ] No branches starting with `draft/` were created in the target repository on GitHub.
- [ ] No pull requests were opened.
- [ ] The API correctly generated files matching the Hexo path syntax (`source/_posts/<slug>.md`).
- [ ] Audit logs captured the dry-run operations (if configured).

