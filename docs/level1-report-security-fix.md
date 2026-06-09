# Level 1 Validation Report Security Fix Report

This document records the analysis, remediation, and process corrections performed following the accidental inclusion of a staging admin shared secret in the initial Level 1 validation report.

---

## 1. Problem Identification

During **Phase C: Level 1 Read-only Validation Run** (logged in Step 047), the automated verification script `verify:level1` was successfully executed against the online staging environment. However, the generated report `docs/level1-readonly-validation-report-20260609.md` accidentally contained the raw value of the `ADMIN_API_SHARED_SECRET` variable:
```bash
$env:ADMIN_API_SHARED_SECRET="<redacted-admin-shared-secret>"
```
Additionally, the concrete Cloudflare staging domain (`<staging-api-worker-url>`) was exposed, and the Level 2 promo verdict was marked candidate without satisfying the prerequisite validation gates (such as staging E2E async evidence, branch protection verification, and owner approvals).

---

## 2. Mitigation and Remediation

### External Action (Immediate)
- **Secret Rotation**: The staging environment's `ADMIN_API_SHARED_SECRET` in Cloudflare has been rotated externally. The leaked secret is no longer valid.
- **Process Warning**: The rotated secret has not been logged in any repository file, PR, commit message, or conversation.

### Repository Remediation
1. **Redaction**: Redacted the secret and specific staging domain names in [docs/level1-readonly-validation-report-20260609.md](./docs/level1-readonly-validation-report-20260609.md), replacing them with standard placeholders (`<redacted-admin-shared-secret>` and `<staging-api-worker-url>`).
2. **Checks Downgrade**: Refactored L1-07 (D1 write checks) and L1-08 (R2 write checks) from `Confirmed` to `Inferred` (since they are inferred from the 403 gateway block, not direct diff queries).
3. **Verdict Tightening**: Downgraded the promotion verdict. Level 2 remains strictly blocked until all gates (least privilege, branch protection, async E2E evidence) are verified.

---

## 3. Scanner & CI Hardening

### Scanner Refactoring
We refactored [scripts/check-no-production-markers.mjs](./scripts/check-no-production-markers.mjs) to prevent future secret leaks:
- **Allowlist Separation**: Separated the allowlist into `markerAllowlist` (to skip domain/path checks in progress docs) and `secretAllowlist` (for scanner self-skipping). All documentation files, including progress logs and reports, are now strictly scanned for secrets.
- **Regex Correction**: Corrected colon-based regex pattern matching to ensure spaces around colons are optional, matching format styles like `KEY: "value"`.
- **Masked Values Bypass**: Allowed values with asterisks (like `gho_***` or `gho_************************************`) to bypass scanner alerts as safe redacted values.

### Regression Coverage
Added [tests/no-production-markers.test.mjs](./tests/no-production-markers.test.mjs) asserting:
- Correct rejection of concrete secrets (e.g. `staging-sec-...` or `gho_...`).
- Correct acceptance of safe placeholders.
- Registered `"test:secrets-fixture"` inside `package.json` and integrated it into the `"check:all"` check suite.
