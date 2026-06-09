# Production Dry-run / Shadow-mode Plan

> Status: Draft / Not approved  
> Current decision: production dry-run and shadow-mode are not approved yet.

---

## 1. Purpose

Define a safe pre-production validation path after Level 2 Trial.

The next production-facing phase must start with read-only or dry-run behavior, not live production writes.

---

## 2. Modes

### Mode A - Read-only Production Validation

Allowed:

```text
GET readiness
GET posts metadata
GET config status
GET version/build info
```

Forbidden:

```text
POST publish
branch creation
PR creation
R2 write
D1 destructive write
```

### Mode B - Production Dry-run

Allowed:

```text
POST publish with mode=dry-run
validate payload
validate target routing
validate auth
write only audit dry-run record if explicitly approved
```

Forbidden:

```text
GitHub branch creation
GitHub PR creation
production content write
R2 object write
auto merge
direct main write
```

### Mode C - Shadow-mode

Allowed:

```text
simulate production publish
create task in staging/shadow D1
log intended production branch/PR without creating it
```

Forbidden:

```text
production repo mutation
production R2 write
production live publish
production D1 destructive write
```

---

## 3. Approval Requirements

Each mode requires separate owner approval:

```text
Mode A approval
Mode B approval
Mode C approval
```

No approval here authorizes production live write.

---

## 4. Evidence Requirements

Each mode must record sanitized evidence:

```text
docs/production-dry-run-evidence-YYYYMMDD.md
```

---

## 5. Next-stage Dry-run Gate

Production dry-run may only proceed after:

- [ ] `docs/production-boundary-inventory.md` completed.
- [ ] `docs/production-readiness-checklist.md` reviewed.
- [ ] `docs/production-dry-run-approval.md` approved.
- [ ] `docs/production-dry-run-preflight-checklist.md` passed.
- [ ] owner execution window recorded.
- [ ] operator recorded.

No approval here authorizes production live write.
