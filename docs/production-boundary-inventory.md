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
| Production site | `<production-site-url>` | TBD | Pending | Do not record sensitive URL if considered private |
| Production content repo | `ranbeioc/hexo-blog` or TBD | TBD | Pending | Must remain read-only unless separately approved |
| Production app repo | `ranbeioc/xhalo-blog` or TBD | TBD | Pending | PR-only |
| Production base branch | `main` or TBD | TBD | Pending | No direct main write |
| Production Worker | `<production-worker-name>` | TBD | Pending | Do not commit secret URL |
| Production queue | `<production-queue-name>` | TBD | Pending | No execution until approved |
| Production D1 | `<production-d1-name>` | TBD | Pending | No destructive operation |
| Production R2 | `<production-r2-bucket>` | TBD | Pending | No write until separately approved |
| Production GitHub credential | GitHub App / token | TBD | Pending | Least privilege required |
| Production domain | `<domain>` | TBD | Pending | Placeholder only if sensitive |
| Production Access/Auth | Cloudflare Access / Turnstile / admin secret | TBD | Pending | Secrets never committed |

---

## 4. Repository Boundary

- [ ] `hexo-blog` is explicitly read-only.
- [ ] `xhalo-blog` is the application repo.
- [ ] Production content repo write is blocked.
- [ ] Production branch creation is blocked.
- [ ] Production PR creation is blocked.
- [ ] Direct main write is blocked.
- [ ] Auto merge is blocked.

---

## 5. Current Decision

- [ ] Production boundary verified.
- [x] Production boundary pending.

Reason:

```text
Production resources are not fully enumerated and reviewed. Production execution remains blocked.
```
