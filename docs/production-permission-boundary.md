# Production Permission Boundary

This document outlines the security controls, access restrictions, and permission boundaries required to safely operate `xhalo-blog` when integrated with the production website repository.

---

## 1. GitHub App Permissions (Least Privilege)

To implement Level 2 PR Generator Mode, the GitHub App used by the Cloudflare workers must be configured with the absolute minimum set of scopes required.

### Repository Permissions Required

| Permission | Access Level | Description | Rationale |
|---|---|---|---|
| **Contents** | **Read & Write** | Access to repository paths, commits, and branches | Required to create draft branches and commit Hexo Markdown files to `source/_posts/` |
| **Pull Requests** | **Read & Write** | Access to pull requests | Required to open a pull request for the draft branch and retrieve its URL |
| **Metadata** | **Read-only** | Repository metadata | Mandatory default scope for GitHub Apps |

*All other repository, organization, and user permissions must be set to **No Access**.*

---

## 2. GitHub Repository Protection Rules

To prevent any bypass of review workflows or direct modifications of production files, the default branch (`main`) of the Hexo blog repository must be protected.

### Recommended Branch Protection Policy for `main`

1. **Restrict Direct Pushes**:
   * Block all direct pushes to `main`. All additions and updates must arrive via Pull Requests.
2. **Require Pull Request Reviews**:
   * Require at least **1 approving review** from a repository owner or administrator before a pull request can be merged.
3. **Dismiss Stale Approvals**:
   * Dismiss approval reviews when new commits are pushed to the draft branch.
4. **Require Status Checks**:
   * Require automated build/lint checks to pass before merging (e.g., Cloudflare Pages build verification, Markdown linting).
5. **Block Force Pushes**:
   * Enable "Require linear history" and block force pushes by all users, including administrators.

---

## 3. Network and API Security (Cloudflare Access)

All mutation routes in the API Worker (`/api/*` and `/admin/*`) must be shielded behind administrative gates.

### Cloudflare Access Gateway Policies
* **Admin Dashboard Protection**:
  * Protect the dashboard page (`/admin/*`) with a Cloudflare Access policy.
  * Require Identity Provider authentication (e.g., Google, GitHub, or One-Time PIN) restricted to authorized email addresses.
* **API Route Access Control**:
  * Secure `/api/*` endpoints via Access service tokens or JWT validation.
  * The API Worker must validate the `CF-Access-JWT-Assertion` header using the public keys exposed by the Cloudflare Access team certificates endpoint.
  * In non-Access staging or local environments, a shared fallback header `x-admin-secret` must be validated, requiring a cryptographically secure token (minimum 32 characters).

---

## 4. Anti-Automation & Spam Protection (Cloudflare Turnstile)

To protect the publish queue from denial-of-service (DoS) attacks or automated script abuse:
* **Token Verification**:
  * The `POST /api/drafts/publish` endpoint verifies a Turnstile challenge token (`cf-turnstile-response`) passed in the request body.
  * If `TURNSTILE_SECRET_KEY` is configured in the environment, requests lacking a valid token or providing an invalid token are immediately rejected with a `403 Forbidden`.
* **Testing Configurations**:
  * For local integration testing and unit tests, the Turnstile dummy credentials (`1x0000000000000000000000000000000AA` / `2x0000000000000000000000000000000AA`) are documented and allowed only when explicitly running in non-production environments.

---

## 5. Audit Logging and Retention Policy

All administrative actions and publish lifecycles are logged to the D1 SQL database in the `audit_logs` table.

### Logging Scope
* Every API request to `/api/drafts/publish`, `/api/assets/r2-upload`, and `/api/tasks` records:
  * Timestamp, action, actor identifier (Access user email or admin-secret), HTTP method, request path, status code, IP address (sanitized or cloud-provided), User-Agent, and execution duration.
* Every queue consumption writes corresponding lifecycle logs:
  * `draft_publish_queued`: Logged by API Worker when task is registered.
  * `draft_publish_completed`: Logged by Queue Worker when file is committed and PR opened successfully.
  * `draft_publish_failed`: Logged by Queue Worker if a remote exception or configuration block occurs.

### Database Constraints and Retention
* **Zero Secret Storage**: The `audit_logs` table must never store raw authentication headers, JWT claims, or GitHub App tokens.
* **Retention Policy**: To prevent D1 storage bloat, a cron cleanup routine must be configured to purge logs older than 90 days:
  ```sql
  DELETE FROM audit_logs WHERE timestamp < datetime('now', '-90 days');
  ```
