# Release Governance: v0.1.0-alpha.1

## Purpose
This document defines the release governance policy, constraints, and audit trails for the `v0.1.0-alpha.1` release candidate. It establishes strict boundaries to ensure production safety and clarify operational permissions.

## Current Release Candidate State
`v0.1.0-alpha.1` is an alpha release candidate. It represents the state of the codebase after integrating admin authentication, media manager preview, and site menu preview capabilities, with all production write options fully gated and disabled by default.

## Tag Status
The tag has already been finalized according to Phase 088 progress notes. This document now captures release governance after the fact and establishes stricter owner-approval requirements for subsequent release operations.

- **Tag Name**: `v0.1.0-alpha.1`
- **Tag Type**: Annotated
- **Tagger**: ranbeioc <ranbei@msn.com>
- **Date**: Mon Jun 15 20:54:48 2026 +0800
- **Target Commit SHA**: `9cb204501406aab57b81b6ce66a64f28c4946fa4`
- **PR #82 Integration**: Yes, the target commit contains the merge commit `c61e987` of PR #82 (Admin Staging Login and Capability Smoke Test).
- **Tag Mutation Policy**: Delete or force-push operations on the `v0.1.0-alpha.1` tag are strictly prohibited.

## Draft Release Status
- **Release Status**: Draft
- **Prerelease Flag**: False (`isPrerelease: false` in draft state)
- **Target Branch/Ref**: `main`
- **Draft Release URL**: `https://github.com/ranbeioc/xhalo-blog/releases/tag/untagged-6d48dad30ca27f5a9861`

## Evidence Included
- **Staging Smoke Test**: Staging environment capability smoke test results are merged via PR #82. These verify OAuth login, secure sessions, draft/post diff previews, and write-gate blocks on Cloudflare Staging.
- **D1 Audit Logs**: Successful validation of database schema constraints, security event logging, and audit tracking for mutation rejections.

## Owner Approval Requirements
Any subsequent operations (such as publishing the release, upgrading to staging write, or initiating production read-only/write operations) require explicit, phase-specific owner approval.
- **No Implied Approval**: Approval cannot be assumed based on the completion of previous tasks.
- **No Approval by Task Summary/Screenshot**: Summaries and screenshots do not constitute approval.
- **Explicit Approval Statement**: The owner must execute the exact template approval statement in the repository PR thread before any next action can proceed.

## Governance Exception Review
Any deviation from the standard branch -> PR -> owner review -> merge workflow is considered a governance exception.
- There are no active governance exceptions approved for `v0.1.0-alpha.1`.
- Any exception requires a signed runbook and an explicit owner statement.

## Allowed Actions
- **Read-only Inspection**: Tag status checks, draft release checks, and workflow configurations audit.
- **Staging Verification**: Executing staging read-only verification.
- **CI Configuration hardener**: Adding validation rules to GitHub Actions workflows.

## Forbidden Actions
- **No Production Writes**: `v0.1.0-alpha.1` is not approval for production writes.
- **No Live R2 Uploads**: It is not approval for R2 live uploads.
- **No Menu Config Writes**: It is not approval for menu config direct update.
- **No Auto-Merge**: It is not approval for auto-merge.
- **No GitHub Release Publish**: Publishing the draft release to the public is strictly forbidden.
- **No direct main write**: Direct push to main branch is blocked; must use Branch -> PR -> Owner Review -> Merge.

## Rollback / Correction Plan
If any violation occurs (e.g., accidental release publish, write-gate leaks), the following mitigation plan must be executed immediately:
1. Retract/delete the published release via the GitHub UI.
2. Re-verify the status of main commits and rollback any unauthorized main branch updates.
3. Terminate staging API deployments, disable the Cloudflare Workers bindings, and re-rotate secrets if compromised.

## Final Decision
`v0.1.0-alpha.1` remains a **Draft Release** and a **Gated Tag**. It is approved only as a candidate for local check and staging smoke evidence alignment. No production actions are authorized.
