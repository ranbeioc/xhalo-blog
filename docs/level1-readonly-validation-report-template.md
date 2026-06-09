# Level 1 Read-only Validation Report (Template)

This report logs the connection and compatibility status of the worker environment against the target repository under read-only scope constraints.

---

## 1. Environment Configuration

| Property | Value / Description |
|---|---|
| **Validation Date** | YYYY-MM-DD |
| **Target API Worker URL** | `<production-like-api-url>` |
| **Target GitHub Repository** | `<owner>/<repo>` |
| **Authentication Scope** | read-only token |
| **LIVE_WRITES_ENABLED Status** | `false` (Mandatory safety default) |

---

## 2. Validation Checks Matrix

Execute the validation command:
```bash
$env:LEVEL1_TARGET_URL="<production-like-api-url>"
$env:ADMIN_API_SHARED_SECRET="your-admin-shared-secret"
$env:LEVEL1_TURNSTILE_TOKEN="your-turnstile-token"
$env:GITHUB_OWNER="<owner>"
$env:GITHUB_REPO="<repo>"
$env:GITHUB_TOKEN="<read-only-token>"
npm run verify:level1
```

| Check ID | Scenario | Expected Outcome | Status |
|---|---|---|---|
| **L1-01** | `/api/readiness` call | Returns `200 OK` indicating active D1 connection. | [ ] Pass / [ ] Fail |
| **L1-02** | `/api/posts` call | Returns `200 OK` containing post items indexing list. | [ ] Pass / [ ] Fail |
| **L1-03** | dry-run publish request | Returns `200 OK` with structured file operation plan. | [ ] Pass / [ ] Fail |
| **L1-04** | live publish request | Blocked with `403 Forbidden` early gateway rejection. | [ ] Pass / [ ] Fail |
| **L1-05** | GitHub branch check | Remote branch `draft/level1-smoke-test-dry-run` does not exist. | [ ] Pass / [ ] Fail |
| **L1-06** | GitHub PR check | No Pull Request exists for `draft/level1-smoke-test-dry-run`. | [ ] Pass / [ ] Fail |
| **L1-07** | D1 write verification | No live publish task records or index changes created in D1. | [ ] Pass / [ ] Pass (Confirmed) |
| **L1-08** | R2 write verification | No objects created in production R2 buckets. | [ ] Pass / [ ] Pass (Confirmed) |

---

## 3. Findings & Observations

<!-- Describe any anomalies, unexpected connection latency, parser warnings, or credential scope discrepancies discovered. -->

---

## 4. Promotion Decision & Verdict

- **Compatibility Verdict**: [ ] Compatible / [ ] Incompatible
- **Promotion Decision**:
  - [ ] **HOLD**: Retain Level 1 validation scope; resolve issues before attempting again.
  - [ ] **Level 2 Trial Candidate**: connection and parsing are 100% compliant; proceed to prepare for the Level 2 single PR trial.
