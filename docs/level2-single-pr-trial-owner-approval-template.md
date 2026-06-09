# Level 2 Single PR Trial Owner Approval Template

> This template must be filled by the repository owner before actual Level 2 Single PR Trial execution.

---

## Approval Template

```text
I approve exactly one controlled Level 2 Single PR Trial for xhalo-blog.

Approved scope:
- target repository: ranbeioc/xhalo-blog-test
- base branch: main
- trial branch: draft/level2-single-pr-trial
- branch prefix: draft/
- trial slug: level2-single-pr-trial
- maximum publish request count: 1
- maximum branch count: 1
- maximum PR count: 1
- execution window: <YYYY-MM-DD HH:mm-HH:mm timezone>
- operator: <operator>

I approve temporarily setting LIVE_WRITES_ENABLED=true in the staging environment only for this execution window.

I require the operator to restore LIVE_WRITES_ENABLED=false immediately after the trial.

I do not approve:
- production live publish
- hexo-blog write
- production repo write
- direct main write
- auto merge
- batch publish
- production R2 write
- destructive D1 operation
- multiple PR generation
- multiple branch generation
- logging secrets

The operator must execute cleanup and record sanitized evidence after the run.
```

---

## Approval Recording Checklist

- [ ] approval copied into `docs/level2-single-pr-trial-approval.md`.
- [ ] approval timestamp recorded.
- [ ] operator recorded.
- [ ] execution window recorded.
- [ ] owner identity recorded.
- [ ] no secrets included in approval.
