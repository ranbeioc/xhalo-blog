# GitHub PR Publishing Flow

Git stays the source of truth. Dynamic write paths should create pull requests, not bypass them.

## Stage flow

1. User edits a draft in the future admin panel.
2. Assets are uploaded to R2 or staged in the repository.
3. The API creates a GitHub branch.
4. The API commits Markdown, metadata, and resource references.
5. The API opens a pull request against `main`.
6. The user reviews and merges the pull request.
7. Cloudflare Pages builds the updated static site from `main`.
8. D1 records task and deployment status.

## Why this matters

This keeps:

- content history in Git
- review and rollback inside GitHub
- production publishes tied to merged commits
- public Pages deploys separate from draft editing

## Stage 2.5 boundary

This repository only documents the flow and provides placeholder API structure.

It does not yet provide:

- a production admin panel
- a hardened production GitHub App implementation
- queue retry logic for failed publishing jobs
- downstream publish notification delivery
- a complete audit UI for publish history

Initial versions should not write directly to `main`.

Preview and draft workflows should stay on non-`main` branches until review is complete.

## Current live prototype boundary

The current prototype prefers a GitHub App installation token and falls back to `GITHUB_TOKEN` to create:

- a non-`main` draft branch
- one draft Markdown file commit
- one pull request into `main`

It is closer to the target GitHub App model, but it still does not include:

- installation scoping audits
- queue-backed retries for failed publish jobs
- richer branch naming, dedupe, and conflict handling

The live publish path should remain disabled unless:

- `ADMIN_API_SHARED_SECRET` is configured
- `LIVE_WRITES_ENABLED=true` is set explicitly
- Cloudflare Access is enforcing outer access control
- route-level tests have been verified by the operator

## Current reconciliation additions

The scaffold now includes:

- `POST /webhooks/github` for pull request webhook reconciliation
- `POST /webhooks/deployments/preview` for preview deployment reconciliation

These routes update D1 task rows and reconcile post status back into `posts_index`.

## Live Publishing Verification

For step-by-step instructions and request templates to verify the publishing flow against a test repository using staging resources, see the [Staging Live-Write Closed-Loop Verification](./live-write-verification.md) guide.

