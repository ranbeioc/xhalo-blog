## Summary

<!-- What does this PR do? Why is this change needed? -->

## Changes

<!-- List the key changes made -->

-

## Security Impact

<!-- Does this PR modify authentication, authorization, input validation, or output encoding? -->
<!-- If yes, describe what changed and why. If no, write "None." -->

None.

## Migration Impact

<!-- Does this PR add or modify D1 migrations, R2 bindings, or environment variables? -->
<!-- If yes, describe upgrade steps. If no, write "None." -->

None.

## Validation

- [ ] `npm ci` installs cleanly
- [ ] `npm run check:all` passes
- [ ] `npm test` passes (all tests green)
- [ ] No secrets or production markers committed
- [ ] Progress documentation updated (if applicable)

## Test Results

```
npm test output here
```

## Additional Notes

<!-- Any context reviewers should know -->

---

> [!WARNING]
> ## Merge Blockers / Audit Gaps Enforcement
> A PR must **NOT** be merged if:
> - The PR body still contains template comments (e.g. `<!-- What does this PR do? -->`).
> - The **Summary** is empty or uninformative.
> - The **Changes** section contains only placeholders or placeholder items.
> - The **Validation** checkboxes are not updated/checked.
> - The **Test Results** section still contains `npm test output here`.
> - **Security Impact** or **Migration Impact** is left as `None` for code or config changes.

