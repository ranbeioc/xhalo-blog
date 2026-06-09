# Cloudflare Runtime Safety Checklist

> Status: Template / Pending verification

---

## 1. Runtime Scope

Staging only.

Allowed workers:

```text
<staging-api-worker>
<staging-queue-worker>
```

Forbidden:

```text
production worker
production route
production R2 bucket
production D1 destructive operation
```

---

## 2. Required Settings

- [ ] `LIVE_WRITES_ENABLED=false` by default.
- [ ] `ADMIN_API_SHARED_SECRET` stored as Worker secret.
- [ ] GitHub token/private key stored as Worker secret.
- [ ] Turnstile secret stored as Worker secret or documented staging bypass policy exists.
- [ ] Cloudflare Access protects admin/API endpoints.
- [ ] Queue consumer configured for staging queue only.
- [ ] R2 bucket binding points to staging/test bucket or is unused.
- [ ] D1 binding points to staging/test database.

---

## 3. Temporary Live Write Window

Before E2E:

- [ ] owner approval recorded.
- [ ] execution window recorded.
- [ ] rollback operator identified.
- [ ] cleanup runbook ready.
- [ ] `LIVE_WRITES_ENABLED=false` confirmed.

During E2E:

- [ ] set `LIVE_WRITES_ENABLED=true` only in staging.
- [ ] perform exactly one request.
- [ ] observe one task / one branch / one PR.

After E2E:

- [ ] restore `LIVE_WRITES_ENABLED=false`.
- [ ] confirm live publish returns 403.
- [ ] close PR.
- [ ] delete branch.
- [ ] record sanitized evidence.

---

## 4. Failure Response

If duplicate write or unexpected production target is observed:

1. Set `LIVE_WRITES_ENABLED=false`.
2. Disable queue consumer if needed.
3. Stop further requests.
4. Preserve sanitized logs.
5. Execute cleanup runbook.
6. Block Level 2 progression.
7. Open remediation PR.

---

## 5. Verdict

- [ ] Runtime safety verified.
- [ ] Runtime safety failed.
- [ ] Pending.
