# GitHub Actions Verification Gap

## Current Finding
Local and staging smoke evidence is not a full substitute for visible GitHub Actions status. The current workflow run history indicates that while checks pass locally and in manual smoke tests, automated CI visibility lacks full coverage of critical security and build checks (specifically secret scanning, secrets fixture validation, and admin UI compilations) before merging.

## Why This Matters
Without explicit, automated verification of all quality gates in GitHub Actions:
- Secret leaks could accidentally bypass local developer checks.
- Admin UI build errors might only be caught during staging deployment.
- Verification relies heavily on human rigor rather than systemic automation.

## Existing Local/Staging Evidence
- Manual execution of `npm run check:secrets` and `npm run test:secrets-fixture` on staging codebases.
- Manual verification of Admin UI builds (`npm run build:admin`) prior to manual Cloudflare Pages deployments.
- Staging smoke trials verify basic login and preview flows.

## Required CI Visibility
Before any production release or public alpha announcement, GitHub Actions should visibly validate `check:all`, secrets scan, tests, and admin build on PR and main. Every PR must block merge until the CI checks status shows green.

## Recommended Workflow Checks
The repository CI checks should be configured via `.github/workflows/check.yml` to trigger on all pull requests and pushes to the main branch, executing the following jobs:

```yaml
name: Check

on:
  push:
  pull_request:

jobs:
  scaffold:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run check:all
      - run: npm run check:secrets
      - run: npm test
      - run: npm run test:secrets-fixture
      - run: npm run build:admin
```

This configuration ensures:
- No deployment steps are executed.
- No production wrangler secrets are exposed to untrusted PRs.
- Monorepo consistency and build stability are verified.

## Exit Criteria
To close this verification gap:
1. Integrate the expanded check suite into the active `.github/workflows/check.yml` configuration (completed in this phase).
2. Verify that GitHub Actions successfully executes and displays green checkmarks for all new pull requests.
3. Establish PR protection rules on GitHub requiring the `scaffold` job of the `Check` workflow to pass before merging to `main`.
