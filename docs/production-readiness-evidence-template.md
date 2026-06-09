# Production Readiness Evidence Template

> Use this template for production-facing validation evidence.  
> Never record raw secrets, tokens, private keys, or sensitive production URLs.

---

## 1. Run Metadata

| Field | Value |
|---|---|
| Run date | TBD |
| Mode | read-only / dry-run / shadow-mode / live-write |
| Operator | TBD |
| Approval reference | TBD |
| Preflight checklist | TBD |
| Production boundary inventory | TBD |
| Target repo | TBD |
| Production write allowed | no |
| `hexo-blog` write allowed | no |

---

## 2. Pre-run Checks

| Check | Expected | Actual | Status |
|---|---|---|---|
| Owner approval | yes | TBD | TBD |
| Execution window | active | TBD | TBD |
| `LIVE_WRITES_ENABLED` | `false` for dry-run | TBD | TBD |
| Production repo mutation | blocked | TBD | TBD |
| Production R2 mutation | blocked | TBD | TBD |
| Secret logging | none | TBD | TBD |

---

## 3. Execution Evidence

| Step | Expected | Actual | Status |
|---|---|---|---|
| Request count | 1 | TBD | TBD |
| Mode | dry-run / shadow | TBD | TBD |
| Branch creation | none | TBD | TBD |
| PR creation | none | TBD | TBD |
| R2 write | none | TBD | TBD |
| Live publish | none | TBD | TBD |
| Audit record | sanitized only | TBD | TBD |

---

## 4. Cleanup Evidence

| Resource | Expected | Actual | Status |
|---|---|---|---|
| Temporary state | none | TBD | TBD |
| Queue task | none or shadow only | TBD | TBD |
| D1 records | dry-run/shadow only | TBD | TBD |
| R2 objects | none | TBD | TBD |

---

## 5. Verdict

- [ ] Passed
- [ ] Failed
- [ ] Inconclusive

Reason:

```text
TBD
```
