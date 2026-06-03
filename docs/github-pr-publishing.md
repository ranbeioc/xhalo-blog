# GitHub PR Publishing Flow

1. User edits a draft in the admin panel.
2. Assets are uploaded to R2 or staged in the repository.
3. The API creates a GitHub branch.
4. The API commits Markdown and resource references.
5. The API opens a pull request.
6. The user reviews and merges the PR.
7. Cloudflare Pages builds the updated static site.
8. D1 records task and deployment status.

Initial versions should not write directly to `main`.
