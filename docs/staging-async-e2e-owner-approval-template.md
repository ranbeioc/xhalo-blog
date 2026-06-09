# Staging Async E2E Owner Approval Template

> This template must be filled by the repository owner before actual staging async E2E execution.

---

## Approval Template

```text
I approve exactly one controlled staging async E2E execution for xhalo-blog.

Approved scope:
- target repository: ranbeioc/xhalo-blog-test
- base branch: main
- test branch: draft/staging-async-e2e-smoke
- test slug: staging-async-e2e-smoke
- maximum branch count: 1
- maximum PR count: 1
- execution window: <YYYY-MM-DD HH:mm-HH:mm timezone>
- operator: <operator>

I approve temporarily setting LIVE_WRITES_ENABLED=true in the staging environment only for this execution window.

I require the operator to restore LIVE_WRITES_ENABLED=false immediately after the test.

I do not approve:
- Level 2 Single PR Trial
- production live publish
- hexo-blog write
- production repo write
- direct main write
- auto merge
- batch publish
- production R2 write
- destructive D1 operation
- logging secrets

The operator must execute cleanup and record sanitized evidence after the run.
```

---

## Approval Recording Checklist

- [ ] approval copied into `docs/staging-async-e2e-execution-approval.md`.
- [ ] approval timestamp recorded.
- [ ] operator recorded.
- [ ] execution window recorded.
- [ ] owner identity recorded.
- [ ] no secrets included in approval.
