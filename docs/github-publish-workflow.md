# GitHub Publish Workflow

This document describes the GitHub-based publishing workflow in the `xhalo-blog` API Worker, covering authentication modes, idempotent branch and PR creation, file commit conflict handling, and preview URL reconciliation.

## 1. Authentication Modes

The Worker supports two authentication modes for GitHub API access:

### GitHub App JWT (Production)

When `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_INSTALLATION_ID` are all configured, the Worker:

1. Generates a short-lived JWT signed with RS256 using the App's private key.
2. Exchanges the JWT for an Installation Access Token (valid for ~60 minutes).
3. Uses the token for all subsequent API calls.

**Required environment variables:**
| Variable | Description |
|---|---|
| `GITHUB_APP_ID` | GitHub App numeric identifier |
| `GITHUB_APP_PRIVATE_KEY` | PEM-encoded RSA private key |
| `GITHUB_INSTALLATION_ID` | Numeric installation ID for the target org/repo |
| `GITHUB_OWNER` | Repository owner (org or user) |
| `GITHUB_REPO` | Repository name |
| `GITHUB_BRANCH` | Base branch for PRs (default: `main`) |

### Personal Access Token (Development)

When `GITHUB_TOKEN` is configured (without the App credentials), the Worker uses the token directly in the `Authorization: token <TOKEN>` header.

---

## 2. Branch Creation (Idempotent)

When the Worker publishes a draft, it creates a dedicated feature branch:

```
draft/publish-<slug>-<timestamp>
```

The `createBranchIfMissing(env, branchName, baseSha)` function:

1. Attempts to create a new ref via `POST /repos/{owner}/{repo}/git/refs`.
2. If the ref already exists (HTTP `422 Unprocessable Entity`), it returns `{ created: false }` instead of throwing.
3. The caller can proceed to commit files regardless of whether the branch was freshly created or already existed.

**Idempotency guarantee**: Calling `createBranchIfMissing` multiple times with the same branch name is safe — it will create the branch on the first call and silently succeed on subsequent calls.

---

## 3. File Commit (SHA-Based Conflict Resolution)

The `createDraftFileCommit(env, filePath, branchName, content, commitMessage)` function:

1. Fetches existing file metadata at `/repos/{owner}/{repo}/contents/{filePath}?ref={branchName}`.
2. If the file exists, extracts its current `sha` blob hash.
3. Sends a `PUT /repos/{owner}/{repo}/contents/{filePath}` request with:
   - `message`: The commit message.
   - `content`: Base64-encoded UTF-8 content.
   - `branch`: Target branch name.
   - `sha`: (If updating) The existing file's SHA to enable atomic update.

**Conflict behavior**:
- If the SHA is stale (another commit modified the file), GitHub returns `409 Conflict`.
- The Worker surfaces this as a structured `409` error to the client, allowing the admin UI to prompt for retry.

**New file behavior**:
- If `GET /repos/{owner}/{repo}/contents/{filePath}` returns `404`, the `sha` field is omitted, creating a new file.

---

## 4. Pull Request Creation (Idempotent)

The `createPullRequest(env, preview)` function:

1. Attempts to create a new PR via `POST /repos/{owner}/{repo}/pulls`.
2. If a PR for the same `head` branch already exists (HTTP `422`), it:
   a. Searches for open PRs matching `head={owner}:{branchName}`.
   b. Falls back to searching without the owner prefix.
   c. Returns the first matching PR instead of throwing.

**Idempotency guarantee**: Calling `createPullRequest` multiple times with the same branch produces the same result — the first call creates the PR; subsequent calls return the existing PR.

---

## 5. Preview URL Reconciliation

After a Cloudflare Pages preview deployment completes, the deployment webhook:

1. Receives the deployment event at `POST /webhooks/deployments/preview`.
2. Extracts the `previewUrl` from the deployment payload.
3. Calls `upsertPostIndexRecord` to persist the `preview_url` in the `posts_index` D1 table.

This enables the admin UI to display a live preview link for each published draft, even before the PR is merged.

### D1 Schema

The `preview_url` column was added in migration `0004_add_posts_index_preview_url.sql`:

```sql
ALTER TABLE posts_index ADD COLUMN preview_url TEXT;
```

The `upsertPostIndexRecord` function uses `INSERT ... ON CONFLICT(slug) DO UPDATE SET ...` to atomically create or update records including the `preview_url` field.

---

## 6. Error Response Codes

| Status | Meaning | When |
|---|---|---|
| `200` | Success | PR created or file committed |
| `400` | Bad Request | Invalid input (missing title, invalid slug, etc.) |
| `403` | Forbidden | Live writes disabled or auth failure |
| `409` | Conflict | File SHA mismatch during commit update |
| `422` | Validation Failed | GitHub rejected the request (handled internally for idempotency) |
| `500` | Internal Error | Unexpected GitHub API failure |

---

## 7. Security Considerations

- **Token Scope**: GitHub App installation tokens should be scoped to the minimum required permissions (`contents: write`, `pull_requests: write`).
- **Branch Isolation**: Each draft publishes to a unique branch, preventing cross-draft contamination.
- **Input Validation**: All slug, title, and content fields are validated before reaching the GitHub API layer (see `validatePublishInput`).
- **Path Traversal**: File paths are constructed from validated slugs — directory traversal sequences (`..`, `/`, `\`) are rejected at the input layer.
