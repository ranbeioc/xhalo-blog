# Global Guidelines for AI Coding Assistants (Gemini / Claude)

## PR Quality Gate Safety Rules (CRITICAL)

The repository runs an automated quality gate script (`scripts/check-pr-body-quality.mjs`) on all Pull Request bodies. To avoid failing this gate:

1. **Forbidden Words**: You **MUST NOT** use the following words anywhere in the PR body (case-insensitive):
   - `placeholder` (use "template token", "replacement variable", "config key template", or "symbolic token" instead)
   - `todo` (use "future task" or "remaining item" instead)
   - `tbd` (use "to be decided" or "pending review" instead)
   - `npm test output here`
   - `Additional Notes`

2. **Template Integration**: 
   - Follow the structure of `.github/pull_request_template.md` exactly.
   - Do **NOT** leave any unresolved HTML comments (`<!-- ... -->`) or template markers like `<replace with ...>`.
   - Ensure every checkbox under `## Safety` and `## Validation` is checked (e.g. `[x]`), or if unchecked, explicitly state `N/A` with a reason.
   - Exactly one checkbox under `## Production Impact` must be checked.
