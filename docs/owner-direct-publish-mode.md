# Owner Direct Publish Mode

## Scope

This document specifies the design, flow, configuration, and security gates for the optional **Owner Direct Publish Mode** in `xhalo-blog`. This mode allows a site owner to bypass the default Pull Request review process and commit content revisions directly to the target repository's `main` branch.

## Default State

* **PR-only is the safe default**: Open-source deployments, default installations, and standard user environments must keep PR-only as the active publishing mechanism.
* **Direct Publish is Disabled by Default**: Direct main branch committing remains completely disabled under default configuration baselines.

## Configuration

The mode is controlled via three variables in the Worker variables block or `.env` file:

```text
PUBLISH_MODE=pr_only
OWNER_DIRECT_PUBLISH_ENABLED=false
OWNER_DIRECT_CONFIRMATION_PHRASE=DIRECT PUBLISH TO MAIN
```

To enable the mode, the variables must be explicitly set to:
* `PUBLISH_MODE=owner_direct`
* `OWNER_DIRECT_PUBLISH_ENABLED=true`

## Admin UI Flow

1. **Readiness Check**: On page load, the Admin Panel queries `/api/readiness`. Only when the readiness snapshot returns:
   ```json
   {
     "publishMode": "owner_direct",
     "ownerDirectPublishEnabled": true
   }
   ```
   will the Direct Publish warning section and commit button be shown in the UI.
2. **Dual Confirmation**: 
   - The user must check the confirmation checkbox: `I understand this bypasses PR review and commits directly to main.`
   - The user must type the exact phrase: `DIRECT PUBLISH TO MAIN` in the verification field.
   - The button stays disabled until both conditions are met.
3. **Execution**: Clicking `Owner Direct Publish to main` makes a `POST /api/drafts/direct-publish` request. On success, the UI displays:
   `Direct commit created on main. Cloudflare Pages build may start automatically.`
   and displays commit details (SHA, URL, repo, path) in the results panel.

## API Flow

* Endpoint: `POST /api/drafts/direct-publish`
* Payload structure:
  ```json
  {
    "title": "Article title",
    "slug": "article-slug",
    "summary": "Article summary",
    "body": "Markdown body",
    "categories": ["notes"],
    "tags": ["xhalo-blog"],
    "status": "published",
    "confirmationPhrase": "DIRECT PUBLISH TO MAIN"
  }
  ```
* Successful Response:
  ```json
  {
    "ok": true,
    "mode": "owner_direct",
    "targetRepo": "owner/repo",
    "targetBranch": "main",
    "targetPath": "source/_posts/article-slug.md",
    "commitSha": "sha",
    "commitUrl": "url",
    "auditId": "audit-id",
    "message": "Direct commit created on main. Cloudflare Pages build may start automatically."
  }
  ```

## Safety Gates

The worker API enforces the following constraints before performing any writes:
1. **Admin Authorization**: The request must supply a valid `x-xhalo-admin-secret` header.
2. **Turnstile Verification**: The request must pass Turnstile verification if a site key is configured.
3. **Mode Guard**: Rejects the request if `PUBLISH_MODE !== 'owner_direct'` or `OWNER_DIRECT_PUBLISH_ENABLED !== true`.
4. **Confirmation Matching**: Rejects the request if `confirmationPhrase` does not match the configured `OWNER_DIRECT_CONFIRMATION_PHRASE`.
5. **Path Validation**: The target file path must resolve strictly under `source/_posts/` (no path traversals like `../`).
6. **Overwrite Protection**: If the target file already exists on the target branch, the direct publish API will fail with `409 Conflict`. Overwriting an existing post requires using the explicit Owner Direct Update workflow (see [owner-direct-existing-article-update-mode.md](./owner-direct-existing-article-update-mode.md)).
7. **Single Article Constraints**: Only accepts a single JSON post object. No batch payload commits, no R2 bucket writes, and no D1 schema changes.

## Audit Log

Every direct publish attempt writes a record to D1 `audit_logs`:
* Successful actions log with `action: 'owner_direct_publish'` and status `200`.
* Failed actions log with `action: 'owner_direct_publish_failed'` and appropriate status codes (`400`/`403`/`409`/`500`).
* Logs capture operator metadata, target repository, branch, file path, commit SHA, and audit IDs. No authentication tokens or secret keys are logged.

## Rollback Guidance

Owner Direct Publish writes directly to the repository's `main` branch. Because it bypasses the review pull request workflow, automatic rollback is not supported. If an error is published:
1. Reverting the change requires committing a manual Git revert in the target repository.
2. Subsequent corrections should be made through a follow-up commit or by returning to the recommended PR-only workflow.

## What This Mode Does Not Do

* It **does not** create staging branches or review Pull Requests.
* It **does not** perform automated merges or auto-approve commits.
* It **does not** support batch uploading or media asset staging to R2 inside the direct publish pipeline.

## When to Use PR-only Instead

* **Multi-author blogs**: Any repository shared by multiple authors must keep `PUBLISH_MODE=pr_only` to ensure content quality and verification.
* **Content review and verification**: When publishing complex articles containing diagrams, code snippets, or configurations, PR-only provides a preview deployment URL to verify layout and formatting before merging.
* **Unattended publishing**: Direct publish should never be configured for unattended automation.
