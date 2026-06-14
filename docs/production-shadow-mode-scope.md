# Production Shadow-mode Scope

> Status: Approved  
> Current decision: shadow-mode execution is not allowed unless explicitly approved.

---

## 1. Purpose

Production shadow-mode validates the production publish path without mutating production content repositories or publishing live content.

---

## 2. Allowed Actions

- validate auth;
- validate request schema;
- validate production routing;
- validate production Worker / Queue / D1 bindings;
- generate intended Git write plan preview;
- record sanitized shadow audit/task metadata only if non-mutating;
- return preview response;
- record sanitized evidence.

---

## 3. Forbidden Actions

- production live publish;
- `hexo-blog` write;
- production repo write;
- GitHub branch creation;
- GitHub PR creation;
- R2 object write;
- destructive D1 operation;
- direct main write;
- auto merge;
- batch publish;
- secret logging.

---

## 4. Safety Contract

Shadow-mode must be non-mutating.

If shadow-mode code path cannot prove non-mutation, shadow-mode execution must remain blocked.

---

## 5. Decision

- [x] Shadow-mode scope approved.
- [ ] Shadow-mode scope blocked.

Reason:

```text
The shadow-mode scope is approved as it strictly defines non-mutating validation operations. However, execution remains blocked pending explicit owner approval.
```
