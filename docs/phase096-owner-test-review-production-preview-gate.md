# Phase 096 - Owner Test Review and Production Preview Approval Gate

## 1. Current Verified Status

Phase 096 records the current owner-verified real test deployment and defines the approval gate required before any Phase 097 production read-only preview work can begin.

Verified evidence source:

- `docs/xhalo-blog-test-real-deployment-links-20260616.md`

Current real test links:

- Home: `https://xhalo-blog-test.pages.dev/`
- Admin: `https://xhalo-blog-test.pages.dev/admin`

Current verified status:

- `xhalo-blog-test` is the active real test deployment target
- the admin UI is served inside the `xhalo-blog` project under `/admin`
- owner reported that GitHub account authorization and login succeeded
- admin panels completed the current smoke scope
- write gates remain locked
- no production write is approved in this phase

## 2. GitHub Repository Map

| Repository | Role | Current phase boundary |
| --- | --- | --- |
| `ranbeioc/xhalo-blog` | Main source repo, admin, API, docs, tests | Active development |
| `ranbeioc/hexo-blog` | Content / production Hexo blog repo | Read-only / dry-run only |
| `ranbeioc/xhalo-admin` | Global admin project | Not used for xhalo-blog admin |

Additional repository boundary notes:

- the admin must remain in `ranbeioc/xhalo-blog/apps/admin`
- `xhalo-blog-admin` does not exist and is not needed
- xhalo-blog-admin does not exist and is not needed
- no branch, PR, commit, or mutation against `hexo-blog/main` is approved in this phase

## 3. Cloudflare Deployment Map

| Project | Type | Purpose | Current Phase Status | Write Permission |
|---|---|---|---|---|
| xhalo-blog-test | Cloudflare Pages | Test site and /admin UI | Active test target | No production write |
| xhalo-blog-staging-api | Worker | Staging API/Auth | Staging only | No production write |
| xhalo-blog-staging-queue | Queue Worker | Staging async tasks | Staging only | No production write |
| xhalo-blog-production-api | Worker | Production API/Auth | Approval gate only | Read-only only |
| xhalo-blog-production-queue | Queue Worker | Production async tasks | Approval gate only | No live-write |

Deployment boundary notes:

- `xhalo-blog-test` remains the current real test frontend
- `xhalo-blog-staging-api` remains the auth and API backend for the real test flow
- `xhalo-blog-staging-queue` remains staging-only and non-production
- `xhalo-blog-production-api` is not approved for production writes in this phase
- `xhalo-blog-production-queue` is not approved for production live-write tasks in this phase

## 4. xhalo-blog-test Owner Test Result

Home:
https://xhalo-blog-test.pages.dev/

Admin:
https://xhalo-blog-test.pages.dev/admin

Owner reported:
GitHub account can authorize and login successfully.

## 5. Admin Login Result

The `/admin` route is reachable on the current real test deployment.

- `https://xhalo-blog-test.pages.dev/admin` opens successfully
- the page shows the GitHub login entry point when unauthenticated
- successful login returns the browser to `/admin`
- logout returns the UI to the unauthenticated state

## 6. GitHub OAuth Result

The current real test OAuth flow is verified against the staging auth/API worker.

- OAuth start endpoint: `https://<staging-api-domain>/auth/github/start`
- OAuth callback endpoint: `https://<staging-api-domain>/auth/github/callback`
- session endpoint: `https://<staging-api-domain>/api/auth/session`

Owner-reported outcome:

- GitHub account authorization works
- login succeeds
- the authenticated browser returns to `https://xhalo-blog-test.pages.dev/admin`

## 7. Admin Panel Result

Current smoke scope is verified for:

- Dashboard
- Posts
- Editor
- Media
- Menus
- Publishing
- Audit Logs
- Settings

Current behavior boundary:

- Media is dry-run only
- Menus is preview-only
- Publishing shows locked safety gates
- Settings reflects the `xhalo-blog-test` deployment context

## 8. Write Gate Result

Current write gate result remains non-mutating.

- direct publish is blocked
- direct update is blocked
- direct config update is blocked
- live R2 upload is blocked
- production write actions are not enabled

Observed gate expectation:

- write interfaces must remain `403` or dry-run-only while the current phase is active

## 9. CI Visibility Gap

The repository now treats `.github/workflows/check.yml` as the single visible validation workflow for PR and `main` verification.

Required validation steps in the active workflow:

- `npm ci`
- `npm run check:all`
- `npm run check:secrets`
- `npm test`
- `npm run test:secrets-fixture`
- `npm run build:admin`

Explicit CI boundary:

- no Cloudflare deployment
- no `wrangler deploy`
- no production secrets usage
- no GitHub release publication
- no `hexo-blog` mutation

## 10. Production Preview Gate

The next phase is:

- `Phase 097 - Production Read-only Preview Verification`

Phase 097 is limited to read-only, dry-run, and auth-check operations.

Phase 097 is limited to:

1. Accessing production `/admin`
2. GitHub OAuth login on production `/admin`
3. `/api/auth/session` verification
4. `/api/health`
5. `/api/readiness`
6. Dashboard read-only
7. Posts read-only
8. Editor dry-run preview
9. Media dry-run preview
10. Menu preview-only
11. Publishing safety center
12. Audit logs read-only
13. Settings read-only
14. write interfaces returning `403` or dry-run-only

Phase 097 remains forbidden from enabling:

- `LIVE_WRITES_ENABLED=true`
- direct publish
- direct update
- R2 live upload
- menu direct update
- queue live-write task
- `hexo-blog/main` mutation
- auto merge
- release publish

## 11. Explicit Non-Approvals

No production direct publish is approved.
No production direct update is approved.
No production R2 live upload is approved.
No production menu config write is approved.
No production queue live-write task is approved.
No hexo-blog/main mutation is approved.
No auto-merge is approved.
No release publication is approved.

## 12. Required Owner Approval Phrase

`I approve Phase 097 production read-only preview verification. No production writes are approved.`

Without this exact approval phrase, Phase 097 must not start.

## 13. Next Phase Entry Criteria

Phase 097 may begin only after all of the following are true:

- this Phase 096 document is merged and available as the source of truth
- the current real test deployment remains `xhalo-blog-test`
- the CI workflow remains validation-only
- no production write capability has been enabled
- owner explicitly provides the required approval phrase

## 14. Verdict

Current phase verdict: `PASSED FOR OWNER REVIEW`

Meaning:

- owner test evidence is recorded
- project and deployment boundaries are recorded
- CI visibility is explicitly bounded
- production preview work is blocked behind owner approval

## Phase 097 Implementation Update

Phase 097 is implemented as a test-surface phase, not a production-write phase:

- `xhalo-blog-test` is composed as a full Cloudflare Pages test site using `npm run build:test-pages`
- Pages output is `dist/pages`
- Pages serves blog HTML, `/admin`, and normal static assets
- R2 remains media/attachment asset storage only and is not whole-site hosting
- first successful GitHub OAuth login can bootstrap an admin only in `DEPLOYMENT_ENV=test` or when `FIRST_GITHUB_LOGIN_ADMIN_ENABLED=true`
- `/api/auth/session` returns `user.role` and `user.isAdmin`
- `POST /api/drafts/test-direct-publish` is test-only and requires `DEPLOYMENT_ENV=test`, `PUBLISH_MODE=test_direct`, `TEST_DIRECT_PUBLISH_ENABLED=true`, and GitHub admin session
- `ranbeioc/hexo-blog@main` remains explicitly forbidden

This update does not approve production direct publish, production direct update, R2 live upload, queue live-write tasks, auto-merge, or release publication.
- no production writes are approved in Phase 096
