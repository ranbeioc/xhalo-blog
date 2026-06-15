# Owner Direct Existing Article Update Mode

This document details the scope, default behavior, configuration, architecture, safety boundaries, and rollback guidelines for the optional **Owner Direct Existing Article Update Mode** in `xhalo-blog`.

---

## Scope

The **Owner Direct Existing Article Update Mode** allows the repository owner to edit an existing published article through the Admin panel, preview a unified line-by-line diff, and commit the changes directly to the target repository's `main` branch, bypassing the standard Pull Request review process.

---

## Default State

By default, the direct write and direct update workflows are **completely disabled**. The system mandates that:
1. `PUBLISH_MODE` defaults to `pr_only`.
2. `OWNER_DIRECT_PUBLISH_ENABLED` defaults to `false`.
3. `OWNER_DIRECT_UPDATE_ENABLED` defaults to `false`.

The default open-source deployments, prototype configurations, and collaborative workspaces should never enable this mode to prevent accidental production state corruption or unreviewed content mutations.

---

## Configuration

To activate this high-risk workflow on personal-site owner deployments, set the following environment variables on the API worker:

```ini
# Core target settings
GITHUB_BRANCH=main

# Direct publish activation
PUBLISH_MODE=owner_direct
OWNER_DIRECT_PUBLISH_ENABLED=true
OWNER_DIRECT_CONFIRMATION_PHRASE=DIRECT PUBLISH TO MAIN

# Direct update activation
OWNER_DIRECT_UPDATE_ENABLED=true
OWNER_DIRECT_UPDATE_CONFIRMATION_PHRASE=DIRECT UPDATE EXISTING POST
```

---

## Read Existing Article Flow

1. The Admin UI presents an **Existing Articles** editor workspace.
2. The user inputs the article slug and clicks **Load from main**.
3. The Admin UI invokes `GET /api/posts/source?slug=<slug>`.
4. The API Worker performs:
   - Verification of the operator's admin secret header.
   - Validation that `GITHUB_BRANCH=main`.
   - Verification that the slug contains no path traversals.
   - Querying the GitHub contents API on the `main` branch (`ref=main`).
   - Base64 decoding of the retrieved post Markdown content.
   - Parsing the Yaml frontmatter and the raw body.
5. The API Worker returns the raw markdown, parsed frontmatter fields, the body text, and the current file's **commit SHA**.
6. The Admin UI populates the editor workspace with the loaded content and holds the `baseSha` in memory.

---

## Diff Preview Flow

Before committing, the user must review changes:
1. The user clicks **Preview Update Diff**.
2. The Admin UI compiles the current form state and sends a `POST /api/drafts/direct-update-preview` request including the `baseSha`.
3. The API Worker fetches the latest state of the file from GitHub `main`.
4. The API Worker computes a unified line-by-line diff of the old raw document and the new generated raw document.
5. The API Worker counts additions, deletions, and checks if frontmatter or body sections changed.
6. The API Worker returns the unified diff text, stats, and a simplified HTML preview of the new content.
7. The Admin UI renders the statistics and diff block, enabling the **Direct Update** action panel only if all requirements are satisfied.

---

## Direct Update Flow

1. The user checks the warning confirmation box:
   *`I understand this will update an existing published article on main.`*
2. The user types the exact phrase:
   *`DIRECT UPDATE EXISTING POST`*
3. The user clicks **Owner Direct Update Existing Post**.
4. The Admin UI transmits the post payload with `baseSha` and the `confirmationPhrase` to `POST /api/drafts/direct-update`.
5. The API Worker applies all configuration, authorization, path, and Turnstile checks.
6. The API Worker queries the current SHA on GitHub.
7. If the SHAs match, the API Worker updates the content directly using the GitHub contents PUT API with `baseSha`.
8. The database index in D1 is updated, an audit log is recorded, and the commit information is returned.

---

## SHA Conflict Protection

To prevent overwriting concurrent updates from other devices or Git clients:
- The update request **must** supply `baseSha` representing the client's version.
- The API Worker compares the client's `baseSha` against the current GitHub file `sha`.
- If the current file `sha` does not equal `baseSha`, the request is rejected immediately with a `409 Conflict` status and the code `STALE_BASE_SHA`.
- The operator must reload the article, re-apply edits, and re-submit.

---

## Safety Gates

Any direct update request is rejected with `400`, `403`, or `409` if:
- Admin shared secret authentication fails.
- Turnstile token is invalid (if configured).
- `PUBLISH_MODE !== owner_direct` or `OWNER_DIRECT_PUBLISH_ENABLED !== true` or `OWNER_DIRECT_UPDATE_ENABLED !== true`.
- `GITHUB_BRANCH` is not configured as `main`.
- The target slug or path contains path traversals or lies outside the `source/_posts/` folder.
- The confirmation phrase does not match `OWNER_DIRECT_UPDATE_CONFIRMATION_PHRASE`.
- The target file does not exist on `main` (returns `404 TARGET_NOT_FOUND`).
- The target file's current SHA on `main` differs from `baseSha` (returns `409 STALE_BASE_SHA`).
- The payload is a batch array or attempts to modify R2 assets or D1 schemas.

---

## Audit Log

Every update attempt logs one of two actions to D1:
- `owner_direct_update` (Success)
- `owner_direct_update_failed` (Failure)

Logged metadata contains:
- `id`: unique audit log ID.
- `action`: log action.
- `resource_id`: the target article slug.
- `status_code`: HTTP status returned.
- `detail`: structured JSON details (excluding tokens, shared secrets, or keys) including target branch `main`, target path, old file SHA, new commit SHA, and lines added/deleted.

---

## Rollback Guidance

Direct update operations write directly to `main` and cannot be rolled back automatically by the worker. If content is corrupted:
1. **Manual Git Revert**: Revert the commit directly inside the GitHub repository UI or local shell:
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   git revert <commit-sha>
   git push origin main
   ```
2. **Standard Review PR**: Edit the article locally or in the editor and submit a standard Pull Request (PR-only mode) to apply correction.

---

## What This Mode Does Not Do

- **No Renames**: Does not support changing the slug of an existing article (moving or renaming files).
- **No Deletions**: Does not support deleting markdown files.
- **No Assets Mutation**: Does not support uploading, replacing, or deleting image or video attachments in direct mode.
- **No Auto-rollback**: Does not automate rollback or revert commits on write failures.

---

## When to Use PR-only Instead

- **Collaborative Writing**: When multiple people review or write articles.
- **Complex Edits**: When rearranging file paths, changing slugs, uploading new assets, or making structural frontmatter modifications.
- **Continuous Integration**: To leverage GitHub Actions pipelines, preview deployments, and quality checks before deploying to production.
