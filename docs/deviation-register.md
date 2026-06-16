## D-001: xhalo-blog Admin preview deployed to xhalo-admin Pages project

### Type

Deployment boundary deviation.

### Symptom

xhalo-blog Admin preview appeared under:

- https://*.xhalo-admin.pages.dev
- https://staging.xhalo-admin.pages.dev/admin

### Expected

xhalo-blog Admin preview must be deployed under xhalo-blog related Pages projects only.

### Root Cause Candidates

- Cloudflare Pages project xhalo-admin bound to xhalo-blog repository or branch.
- Wrangler deployment command used `--project-name xhalo-admin`.
- CI environment variable pointed xhalo-blog admin deployment to xhalo-admin.
- Documentation copied incorrect Admin Frontend Pages URL and treated it as passed staging evidence.

### Fix

- Remove xhalo-admin from xhalo-blog admin deployment targets.
- Correct staging documentation.
- Add boundary regression check.
- Require future PRs to verify Pages project name before claiming Admin staging passed.
