# Level 2 Permission Verification

> Status: Template / Pending verification  
> Do not record raw tokens, private keys, or installation secrets.

---

## 1. Purpose

Verify that the GitHub credential used for staging async E2E and future Level 2 Trial has least-privilege scope.

---

## 2. Required GitHub Permissions

Allowed minimum permissions:

| Permission | Required | Notes |
|---|---|---|
| Metadata | Read-only | required by GitHub |
| Contents | Read/Write | required to create draft branch/file |
| Pull requests | Read/Write | required to open PR |
| Issues | No access unless PR comments are needed | avoid if possible |
| Actions | No access | not required |
| Administration | No access | forbidden |
| Secrets | No access | forbidden |
| Workflows | No access | forbidden |

---

## 3. Repository Scope

- [ ] Credential is limited to `ranbeioc/xhalo-blog-test`.
- [ ] Credential is not org-wide write.
- [ ] Credential does not include `hexo-blog`.
- [ ] Credential does not include production repositories.
- [ ] Credential cannot push directly to protected `main`.

---

## 4. Verification Checklist

- [ ] Credential owner/type identified as GitHub App installation or fine-grained token.
- [ ] Repository scope verified.
- [ ] Permission scope verified.
- [ ] Token is stored only in runtime secret store.
- [ ] Token is not printed in logs.
- [ ] Token is not present in PR body.
- [ ] Token is not committed.
- [ ] Token rotation procedure exists.

---

## 5. Evidence Format

Record only sanitized evidence:

```text
credential_type: GitHub App installation / fine-grained token
repo_scope: ranbeioc/xhalo-blog-test only
contents_permission: read/write
pull_request_permission: read/write
metadata_permission: read-only
admin_permission: none
token_logged: no
```

---

## 6. Verdict

- [ ] Permission verification passed.
- [ ] Permission verification failed.
- [ ] Pending.
