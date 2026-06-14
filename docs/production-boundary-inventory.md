# Production Boundary Inventory

> Status: Blocked  
> Current decision: production boundary cannot be verified without external runtime evidence.

---

## 1. Purpose

This document defines the production boundary for xhalo-blog.

No production dry-run, shadow-mode, or live-write execution may proceed until all required production resources are explicitly named or explicitly marked as not applicable.

---

## 2. Production Scope

Production includes any workflow touching:

```text
production site
production repository
hexo-blog
production Cloudflare Worker
production queue
production D1
production R2
production GitHub credential
production domain
production analytics/logs
```

---

## 3. Production Resource Inventory

| Resource | Expected | Actual | Status | Notes |
|---|---|---|---|---|
| Production site | `<production-site-url>` | `<redacted-production-site>` | Blocked | Missing external runtime evidence |
| Production content repo | `ranbeioc/hexo-blog` | `ranbeioc/hexo-blog` | Pass | Read-only |
| Production app repo | `ranbeioc/xhalo-blog` | `ranbeioc/xhalo-blog` | Pass | PR-only |
| Production base branch | `main` | `main` | Pass | No direct main write |
| Production Worker | `<production-worker-name>` | `<redacted-worker-id>` | Blocked | Missing external runtime evidence |
| Production queue | `<production-queue-name>` | `<redacted-queue-id>` | Blocked | Missing external runtime evidence |
| Production D1 | `<production-d1-name>` | `<redacted-d1-id>` | Blocked | Missing external runtime evidence |
| Production R2 | `<production-r2-bucket>` | `<redacted-r2-id-or-na>` | Blocked | Missing external runtime evidence |
| Production GitHub credential | GitHub App / token | `<credential-type-only>` | Blocked | Missing external runtime evidence |
| Production domain | `<domain>` | `<redacted-domain>` | Blocked | Missing external runtime evidence |
| Production Access/Auth | Cloudflare Access / Turnstile / admin secret | `<policy-only>` | Blocked | Missing external runtime evidence |

---

## 4. Repository Boundary

- [x] `hexo-blog` is explicitly read-only.
- [x] `xhalo-blog` is the application repo.
- [x] Production content repo write is blocked.
- [x] Production branch creation is blocked.
- [x] Production PR creation is blocked.
- [x] Direct main write is blocked.
- [x] Auto merge is blocked.

---

## 5. Current Decision

- [ ] Production boundary verified.
- [x] Production boundary blocked.

Reason:

```text
External Cloudflare/GitHub production runtime evidence is missing. No production dry-run may proceed.
```
