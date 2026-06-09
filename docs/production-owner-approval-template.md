# Production Owner Approval Template

> This template is for future production-readiness stages.  
> It does not approve any production action by itself.

---

## Production Dry-run Approval Template

```text
I approve one controlled production dry-run for xhalo-blog.

Approved scope:
- mode: dry-run only
- production live write: no
- production repo branch creation: no
- production PR creation: no
- production R2 write: no
- destructive D1 operation: no
- direct main write: no
- auto merge: no
- batch publish: no
- execution window: <YYYY-MM-DD HH:mm-HH:mm timezone>
- operator: <operator>

The operator must record sanitized evidence and stop immediately if any live-write path is reached.
```

---

## Production Shadow-mode Approval Template

```text
I approve one controlled production shadow-mode validation for xhalo-blog.

Approved scope:
- mode: shadow-mode only
- production repo mutation: no
- production R2 write: no
- production live publish: no
- direct main write: no
- auto merge: no
- execution window: <YYYY-MM-DD HH:mm-HH:mm timezone>
- operator: <operator>

The operator must record intended actions only and must not create a production branch or PR.
```

---

## Production Live Write Approval Template

```text
Not approved yet.

Production live write requires a separate approval document after dry-run / shadow-mode evidence has been reviewed.
```
