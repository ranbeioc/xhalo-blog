# Owner Release Approval Template

This document provides the standard templates that the repository owner must use to approve release-related operations. 

> [!IMPORTANT]
> - **No Implied Approval**: Approvals are strictly phase-specific and cannot be assumed based on progress or task completion.
> - **No Approval by Visual Evidence**: Screenshots, task summaries, or logs alone do NOT constitute operational approval.
> - **Explicit and Verifiable**: Approval statements must be posted verbatim (with variables replaced) in the corresponding GitHub PR or issue thread by the owner before any gated actions are run.

---

## For Release Tag Creation
```text
I approve creating the v0.1.0-alpha.1 release tag from main commit <sha>.
```

## For Draft Release Creation
```text
I approve creating a GitHub Draft Release for v0.1.0-alpha.1.
```

## For Publishing GitHub Release
```text
I approve publishing the GitHub Release for v0.1.0-alpha.1.
```

## For Production Read-only Verification
```text
I approve production read-only verification only. No production writes are approved.
```

## For Production Write Enablement
```text
I approve production live-write trial under the attached runbook.
```

## For R2 Live Upload Enablement
```text
I approve R2 live upload enablement for assets under the attached plan.
```

## For Menu Config Write Enablement
```text
I approve menu config write enablement to modify Hexo configuration files.
```
