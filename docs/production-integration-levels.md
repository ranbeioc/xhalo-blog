# Production Integration Levels

This document defines the integration levels for connecting the `xhalo-blog` headless admin dashboard with the production Hexo blog repository (`<production-domain>`). These levels manage access boundaries and minimize risk to the live production website.

---

## Integration Level Matrix

| Level | Name | Write Permission | Git Branch Target | PR Auto-Merge | Recommended | Risk Profile |
|---|---|---|---|---|---|---|
| **Level 0** | **Hold (Staging-only)** | None (Prod) | N/A | No | No (Active dev) | Zero risk to production |
| **Level 1** | **Read-only Verification** | None | N/A | No | Yes (Initial audit) | Read-only; zero write risk |
| **Level 2** | **PR Generator Mode** | Indirect (Branches) | `draft/<slug>` | No | **Yes (Default Prod)** | Low; reviewable and isolatable |
| **Level 3** | **Full Workstation** | Direct (Main) | `main` | Yes | **No (Forbidden)** | High; direct live-writes |

---

## Level Descriptions

### Level 0: Hold (Staging-only)
The dashboard and background workers are connected only to the staging repository and staging database. 
* **State**: No access to the production repository or database is granted.
* **Goal**: Validate new software releases, test migrations, and conduct user experience testing.
* **Access Boundary**: All API/Queue Worker endpoints point to test configurations.

### Level 1: Read-only Compatibility Validation
The dashboard is connected to the production Hexo blog in a read-only configuration to verify content schemas and parser compatibility without any write capabilities.
* **Write Permission**: Database `posts_index` updates are permitted locally, but GitHub integration is disabled or restricted to `GET` endpoints.
* **Goal**: Audit compatibility of historical production posts against the newer `xhalo-blog` JSON parser and Hexo theme adapter compatibility profile.
* **Risk**: Negligible. No writes to production source files are possible.

### Level 2: PR Generator Mode (Recommended Baseline)
This is the recommended production integration baseline. The dashboard writes to isolated git branches and opens Pull Requests, but does **not** merge them.
* **Write Permission**: The GitHub App is granted permission to create branches and push commits containing draft changes, and to open/lookup Pull Requests.
* **Workflow**:
  1. Author clicks "Publish" in `xhalo-blog` Admin.
  2. The API Worker enqueues a `draft_publish` task and returns `202 Accepted`.
  3. The Queue Worker runs the task asynchronously: generates Markdown, checks out a branch (`draft/<slug>`), commits the file, and opens a Pull Request to `main`.
  4. Cloudflare Pages automatically builds a preview deployment for the PR.
  5. The author/editor reviews the preview site and manually merges the PR on GitHub when satisfied.
  6. Merging triggers the standard production Cloudflare Pages deployment.
* **Constraints**:
  * Auto-merge is strictly disabled.
  * Direct commits to the `main` branch are blocked.
  * All merges require human review.

### Level 3: Full Workstation (Not Recommended)
The dashboard directly merges or commits drafts into the `main` branch of the production repository, immediately deploying the content.
* **Write Permission**: Direct commits to the default branch (`main`) or automatic approval and merging of pull requests.
* **Risk**: High. Any validation failures, unauthorized access, or configuration issues would immediately corrupt the production website.
* **Recommendation**: **Do not use.** Level 3 is disabled in the codebase and blocked by branch protection policies.
