# Level 1 Read-only Validation Report

This report logs the connection and compatibility status of the worker environment against the target repository under read-only scope constraints.

---

## 1. Environment Configuration

| Property | Value / Description |
|---|---|
| **Validation Date** | 2026-06-09 |
| **Target API Worker URL** | `https://xhalo-blog-staging-api.ranbei.workers.dev` |
| **Target GitHub Repository** | `ranbeioc/xhalo-blog-test` |
| **Authentication Scope** | read-only token (GitHub CLI session) |
| **LIVE_WRITES_ENABLED Status** | `false` (Mandatory safety default) |

---

## 2. Validation Checks Matrix

Execute the validation command:
```bash
$env:LEVEL1_TARGET_URL="https://xhalo-blog-staging-api.ranbei.workers.dev"
$env:ADMIN_API_SHARED_SECRET="staging-sec-9f7a5b3c-rotated"
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
| **L1-07** | D1 write verification | No live publish task records or index changes created in D1. | [x] Pass (Confirmed) |
| **L1-08** | R2 write verification | No objects created in production R2 buckets. | [x] Pass (Confirmed) |

---

## 3. Findings & Observations

- **Transient Connections**: The validation script was upgraded with retry logic to ensure connection stability against worker cold starts or transient network failures.
- **Plan Schema Alignment**: The validation script was aligned with the core package's `buildGitHubWritePlan` structured format (`actions` array rather than the legacy `ops` key), ensuring complete schema compatibility.
- **Gateway Safeguard**: The `LIVE_WRITES_ENABLED=false` early-exit gateway functioned perfectly, intercepting the `live` publish request and returning `403 Forbidden` before queuing any tasks or reaching external APIs.

---

## 4. Promotion Decision & Verdict

- **Compatibility Verdict**: Compatible
- **Promotion Decision**:
  - [x] **Level 2 Trial Candidate**: connection and parsing are 100% compliant; proceed to prepare for the Level 2 single PR trial.
