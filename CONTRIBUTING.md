# Contributing to xhalo-blog

Thank you for your interest in contributing to xhalo-blog. This document outlines the development workflow and requirements for submitting changes.

## Branch Policy

- **Never push directly to `main`.** All changes must go through pull requests.
- Create a feature or fix branch from `main`:
  ```bash
  git checkout main
  git pull --ff-only
  git checkout -b <your-branch-name>
  ```

## Development Workflow

1. **Create a branch** from `main`.
2. **Make small, focused commits** with clear messages.
3. **Run validation** before each commit:
   ```bash
   npm ci
   npm run check:all
   npm test
   ```
4. **Push your branch** and create a pull request.
5. **Wait for CI** to pass before requesting review.
6. **Update progress documentation** if working on a tracked task.

## Pull Request Requirements

Every pull request must fully document the changes to ensure auditability and maintain security standards. Use the PR template provided in `.github/pull_request_template.md`.

### Strict Completeness Policy (Merge Blockers)

A PR **MUST NOT** be merged if:
- The PR body still contains template comments (e.g. `<!-- What does this PR do? -->`).
- The **Summary** is empty or uninformative.
- The **Changes** section contains only placeholders or placeholder items (e.g., `-`).
- The **Validation** checkboxes are not updated/checked.
- The **Test Results** section still contains `npm test output here`.
- **Security Impact** or **Migration Impact** is left as `None` for code or config changes.


## Validation Checklist

Before submitting a PR, verify:

- [ ] `npm ci` installs cleanly
- [ ] `npm run check:all` passes (syntax, secrets, compatibility, build)
- [ ] `npm test` passes all test suites
- [ ] No secrets, production credentials, or private configuration committed
- [ ] Progress documentation updated (if applicable)

## Security-Related Changes

PRs that modify security-critical code must:

- Describe the security impact in the PR description
- Include or update relevant tests in `tests/`
- Reference the security documentation in `docs/security.md`
- Not weaken existing security controls (Cloudflare Access, Turnstile, admin secret)

## D1 / R2 / Worker Changes

PRs that modify database schema, R2 bindings, or Worker logic must:

- Describe migration impact in the PR description
- Create forward migrations (never modify existing migration files)
- Document upgrade steps in `docs/d1-migrations.md`
- Not bypass `LIVE_WRITES_ENABLED` guards

## Code Style

- Use ES modules (`import`/`export`)
- Use `node:test` for test suites
- Use `node:assert/strict` for assertions
- Keep Workers dependency-free (no npm packages in worker code)

## Security Issues

Do not open a public issue for sensitive security reports. See `SECURITY.md`.

## Branch Protection (Recommended)

Repository maintainers should enable:

- Require pull request reviews before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Block force pushes to `main`
