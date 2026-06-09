# Level 1 Read-only Validation Report

This report logs the connection and compatibility status of the worker environment against the target repository under read-only scope constraints.

> [!WARNING]
> **Security Notice**: A staging admin shared secret was previously recorded in this report. It was treated as exposed and rotated externally in Cloudflare. This report now uses redacted placeholders only.

---

## 1. Environment Configuration

| Property | Value / Description |
|---|---|
| **Validation Date** | 2026-06-09 |
| **Target API Worker URL** | `<staging-api-worker-url>` |
| **Target GitHub Repository** | `ranbeioc/xhalo-blog-test` |
| **Authentication Scope** | read-only token (GitHub CLI session) |
| **LIVE_WRITES_ENABLED Status** | `false` (Mandatory safety default) |

---

## 2. Validation Checks Matrix

Execute the validation command:
```bash
$env:LEVEL1_TARGET_URL="<staging-api-worker-url>"
$env:ADMIN_API_SHARED_SECRET="<redacted-admin-shared-secret>"
$env:LEVEL1_TURNSTILE_TOKEN="dummy-token"
$env:GITHUB_OWNER="ranbeioc"
$env:GITHUB_REPO="xhalo-blog-test"
$env:GITHUB_TOKEN="gho_************************************"
npm run verify:level1
```

| Check ID | Scenario | Expected Outcome | Status |
|---|---|---|---|
| **L1-01** | `/api/readiness` call | Returns `200 OK` indicating active D1 connection. | [x] Pass |
| **L1-02** | `/api/posts` call | Returns `200 OK` containing post items indexing list. | [x] Pass |
| **L1-03** | dry-run publish request | Returns `200 OK` with structured file operation plan. | [x] Pass |
| **L1-04** | live publish request | Blocked with `403 Forbidden` early gateway rejection. | [x] Pass |
| **L1-05** | GitHub branch check | Remote branch `drafts/level1-smoke-test-dry-run` does not exist. | [x] Pass |
| **L1-06** | GitHub PR check | No Pull Request exists for `drafts/level1-smoke-test-dry-run`. | [x] Pass |
| **L1-07** | D1 write verification | Inferred from early `403` live-write gateway block. No direct D1 diff query was recorded in this run. | [x] Pass (Inferred) |
| **L1-08** | R2 write verification | Inferred from early `403` live-write gateway block. No direct R2 object diff query was recorded in this run. | [x] Pass (Inferred) |

---

## 3. Findings & Observations

- **Transient Connections**: The validation script was upgraded with retry logic to ensure connection stability against worker cold starts or transient network failures.
- **Plan Schema Alignment**: The validation script was aligned with the core package's `buildGitHubWritePlan` structured format (`actions` array rather than the legacy `ops` key), ensuring complete schema compatibility.
- **Gateway Safeguard**: The `LIVE_WRITES_ENABLED=false` early-exit gateway functioned perfectly, intercepting the `live` publish request and returning `403 Forbidden` before queuing any tasks or reaching external APIs.

### Evidence Limitation
This Level 1 run verified the early live-write gateway block and GitHub branch/PR absence. It did not record direct D1 task diff queries or R2 object listing diffs. Direct D1/R2 evidence must be added before any Level 2 approval.

---

## 4. Promotion Decision & Verdict

- **Compatibility Verdict**: Compatible
- **Promotion Decision**:
  - [x] **Level 1 Read-only Validation**: Passed.
  - [ ] **Level 2 Trial Candidate**: Not approved yet.

Level 2 remains blocked until all Level 2 gate prerequisites are satisfied:
- Branch protection verified.
- GitHub App least-privilege permissions verified.
- Staging async E2E evidence completed and sanitized.
- Repository owner explicitly approves the trial.
- Cleanup runbook is ready.
- `LIVE_WRITES_ENABLED=false` remains the default.
