# Branch Protection Verification

> Status: Template / Pending verification

---

## 1. Target Repository

```text
ranbeioc/xhalo-blog-test
```

Target branch:

```text
main
```

---

## 2. Required Protection

- [ ] Direct pushes to `main` blocked where applicable.
- [ ] Force pushes disabled.
- [ ] Branch deletion disabled where applicable.
- [ ] PR merge requires manual owner action.
- [ ] Auto-merge disabled.
- [ ] Required status checks configured where applicable.
- [ ] Admin bypass policy reviewed.

---

## 3. Verification Evidence

| Check | Expected | Actual | Status |
|---|---|---|---|
| direct push blocked | yes | TBD | TBD |
| force push disabled | yes | TBD | TBD |
| auto merge disabled | yes | TBD | TBD |
| PR required | yes | TBD | TBD |
| required checks | optional/pending | TBD | TBD |
| admin bypass | reviewed | TBD | TBD |

---

## 4. Branch Prefix Policy

Allowed test branch prefix:

```text
drafts/
```

Allowed test branch for staging E2E:

```text
drafts/staging-async-e2e-smoke
```

Forbidden:

```text
main
master
release/*
production/*
```

---

## 5. Verdict

- [ ] Branch protection verification passed.
- [ ] Branch protection verification failed.
- [ ] Pending.
