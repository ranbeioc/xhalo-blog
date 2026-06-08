# Release Checklist

This document details the checks and validation steps required before tags are cut and releases are published for `xhalo-blog`.

---

## 1. Automated Validation Suite

Before preparing any release candidate:
- [ ] Run clean install:
  ```bash
  npm ci
  ```
- [ ] Run full validation suite:
  ```bash
  npm run check:all
  ```
  This automatically runs:
  - [ ] Linting & syntax validations (`check:syntax`)
  - [ ] Secret-scanning checking (`check:secrets`)
  - [ ] D1 migration integrity check (`check:migrations`)
  - [ ] Hexo theme adapter compatibility fixtures check (`check:compat`)
  - [ ] All workspaces builds:
    - Admin Panel build (`build:admin`)
    - Landing Page build (`build:landing`)
    - Basic Blog example build (`build:basic`)
    - Next Theme Blog example build (`build:next-example`)
    - NexT Theme template build (`build:next-template`)
  - [ ] API Worker unit and mock security tests (`npm test`)

---

## 2. Documentation Cleanliness & Boundaries

Check that the documentation meets open-source publication criteria:
- [ ] **No Local Paths**: Verify that no local Windows paths (e.g., `file : /// c: / Users / ...` or `/Users/...`) remain in markdown documentation.
- [ ] **No Private staging URLs**: Ensure staging Worker URLs (e.g., `<staging-account>.workers.dev`) are replaced with placeholders like `<staging-api-worker-url>`.
- [ ] **No Secret-Like Values**: Ensure that no passwords, private keys, or API tokens are written into files.
- [ ] **Boundary Wording**: Verify that the README and setup guides accurately describe the current implementation status (e.g. that Queue Worker async publishing is still a staging/in-progress feature).

---

## 3. Security Policy Gating

Ensure security gates are safe:
- [ ] **Non-destructive D1 migrations**: Ensure that forward migration SQL files never drop tables or fields in existing production/staging systems.
- [ ] **Staged variables defaults**: Ensure `LIVE_WRITES_ENABLED` defaults to `false` in all template files and Wrangler configurations.
- [ ] **Turnstile & Access defaults**: Ensure that all Turnstile keys and Cloudflare Access configurations default to secure configurations, and that Turnstile bypass keys are clearly marked as test-only.
- [ ] **Sanitized payloads**: Confirm that error handlers catch exceptions and return sanitized error responses (no server trace leaks).
- [ ] **Secret scanner rules**: Verify that `scripts/check-no-production-markers.mjs` runs on every pull request and block commits containing forbidden patterns.

---

## 4. Release Classification

Clearly classify the release scope in the versioning logs:
- [ ] **GitHub Source Release Only**: Target for `0.1.x` alpha releases. Suitable for direct git forks, staging, and operator reviews.
- [ ] **npm package release**: Future production releases. Requires workspace configuration changes and removing `"private": true` from target sub-packages.
- [ ] **Docker / template release**: Pre-configured build environments.
