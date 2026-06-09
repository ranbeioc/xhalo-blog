# Production Boundary Inventory

> Status: Draft / Pending verification  
> Current decision: production execution remains blocked until this inventory is completed and reviewed.

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
| Production site | `<production-site-url>` | `<placeholder>` | Pending | Sensitive URL should remain placeholder if needed |
| Production content repo | `ranbeioc/hexo-blog` | `ranbeioc/hexo-blog` | Pass | Read-only unless separately approved |
| Production app repo | `ranbeioc/xhalo-blog` | `ranbeioc/xhalo-blog` | Pass | PR-only |
| Production base branch | `main` | `main` | Pass | No direct main write |
| Production Worker | `<production-worker-name>` | `<redacted-placeholder>` | Pending | Do not commit secret endpoint |
| Production queue | `<production-queue-name>` | `<redacted-placeholder>` | Pending | No execution until approved |
| Production D1 | `<production-d1-name>` | `<redacted-placeholder>` | Pending | No destructive operation |
| Production R2 | `<production-r2-bucket>` | `<redacted-placeholder>` | Pending | No write until separately approved |
| Production GitHub credential | GitHub App / token | `<credential-type-only>` | Pending | Least privilege required |
| Production domain | `<domain>` | `<redacted-placeholder>` | Pending | Placeholder allowed |
| Production Access/Auth | Cloudflare Access / Turnstile / admin secret | `<policy-only>` | Pending | Secrets never committed |

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
- [x] Production boundary pending.

Reason:

```text
Production resources are not fully enumerated and reviewed. Production execution remains blocked.
```
