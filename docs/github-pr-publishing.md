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
- a production GitHub App implementation
- queue retry logic for failed publishing jobs
- downstream publish notification delivery
- a complete audit UI for publish history

Initial versions should not write directly to `main`.

Preview and draft workflows should stay on non-`main` branches until review is complete.
