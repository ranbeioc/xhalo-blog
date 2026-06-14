## Summary

This PR prepares the Level 2 Single PR Trial approval review. It adds the owner approval document, preflight checklist, and approval template while keeping the actual Level 2 Trial blocked.

## Changes

- Add `docs/level2-single-pr-trial-approval.md`.
- Add `docs/level2-single-pr-trial-preflight-checklist.md`.
- Add `docs/level2-single-pr-trial-owner-approval-template.md`.
- Update `docs/level2-gate-checklist.md` with Level 2 Trial approval gates.
- Update `docs/level2-single-pr-trial-plan.md` to use the reconciled `draft/` branch prefix.
- Update `docs/level2-cleanup-runbook.md` with Level 2 cleanup targets.
- Update `docs/production-go-no-go-checklist.md` to move the approved scope to Level 2 Trial Approval Review only.
- Update `docs/CLAUDE_BRANCH_PROGRESS.md` with Step 057.

## Validation

- [x] `npm ci`
- [x] `npm run check:all`
- [x] `npm run check:secrets`
- [x] `npm test`
- [x] `npm run test:secrets-fixture`

## Production Impact

None. This PR does not enable live writes, does not create a branch, does not create a PR, and does not write to any content repository.

## Gate Decision

Level 2 Single PR Trial remains blocked until explicit owner approval and preflight completion. Production live writes remain blocked.
