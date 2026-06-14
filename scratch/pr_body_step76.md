## Summary

Add admin PR-only publishing MVP for creating owner-reviewed draft article pull requests without direct main writes, auto-merge, or production execution.

## Scope

- [ ] Documentation only
- [x] Code change
- [x] Test/evidence update
- [ ] Production-impacting workflow

## Production Impact

- [x] No production impact
- [ ] Production read-only verification
- [ ] Production dry-run
- [ ] Production shadow-mode
- [ ] Production PR trial
- [ ] Production live-write trial

## Safety

- [x] No secrets committed
- [x] No direct main write
- [x] No auto-merge
- [x] No unapproved production write
- [x] `LIVE_WRITES_ENABLED` state documented if relevant

## Changes

- Add admin article editor fields.
- Add frontmatter preview.
- Add Markdown preview.
- Add PR-only publish action.
- Add task status display.
- Improve generated GitHub PR body format.
- Add publish validation tests.
- Add PR body generation tests.
- Add Admin MVP documentation.
- Update progress log.

## Validation

- [x] `npm ci`
- [x] `npm run check:all`
- [x] `npm run check:secrets`
- [x] `npm test`
- [x] `npm run test:secrets-fixture`
- [x] Admin build or equivalent validation
- [x] PR body quality positive case

## Evidence

docs/admin-publishing-mvp.md

## Notes

No production execution occurred. This PR only implements Admin MVP functionality and keeps all production publishing PR-only and owner-reviewed.
