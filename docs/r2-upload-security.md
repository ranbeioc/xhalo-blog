# R2 Upload Security Model

This document describes the security controls, validation rules, and threat mitigation strategies implemented in the `xhalo-blog` API Worker for R2 asset uploads.

## 1. Allowed MIME Types & Extension Constraints

To prevent uploading executable scripts (e.g. `.html` files containing XSS payloads, or `.js` files containing malicious scripts) or unverified media types, the API Worker enforces a strict allowlist.

Every asset upload must match one of the following MIME types and have a matching file extension:

| Content-Type | Allowed Extensions | Purpose |
|---|---|---|
| `image/png` | `.png` | Media assets (Lossless) |
| `image/jpeg` | `.jpg`, `.jpeg` | Photo assets (Lossy) |
| `image/webp` | `.webp` | Modern compressed web assets |
| `image/gif` | `.gif` | Animated image assets |
| `application/pdf` | `.pdf` | PDF documents / sheets |
| `video/mp4` | `.mp4` | Video files |
| `video/webm` | `.webm` | HTML5 WebM video files |
| `text/plain` | `.txt` | Plain text logs / notes |

If a request specifies a Content-Type not in the allowlist, or if the file extension does not match the allowed extensions for that Content-Type, the API Worker rejects the upload immediately with `400 Bad Request`.

---

## 2. Directory Traversal & Object Key Safety

Object keys in Cloudflare R2 are flat string identifiers, but they are parsed by web clients as virtual folder paths. To prevent path traversal attacks:

1. **Filename Sanitization**:
   The `sanitizeAssetSegment` utility cleanses filenames, stripping out any non-alphanumeric, dot, underscore, or dash characters.
2. **Explicit Character Block**:
   The API layer explicitly blocks filenames, scopes, or postSlugs containing double dots (`..`), forward slashes (`/`), or backslashes (`\`).
3. **Directory Isolation**:
   R2 object keys are generated automatically using standard templates (e.g., `uploads/YYYY/MM/DD/filename` or `posts/post-slug/YYYY-MM-DD-filename`). This structure restricts files to dedicated directories, keeping assets isolated from system configurations.

---

## 3. Payload size Limitations

To prevent resource exhaustion, denial-of-service (DoS) attacks, or storage bloat:

- **Direct API Uploads**: Limited to **256 KiB**.
- **Signed Worker Uploads**: Limited to **1 MiB**.

If a client attempts to upload an asset exceeding these limits, the API Worker returns `413 Payload Too Large`.

---

## 4. Signed Upload Protocol

For client-side uploads, the API Worker generates a short-lived, cryptographically signed upload plan containing an HMAC token.

### HMAC Token Signing
The token contains:
- `objectKey`: The target R2 object path.
- `contentType`: The allowed Content-Type of the file.
- `exp`: Token expiration timestamp (TTL).
- `filename`, `scope`, `postSlug`, `publicUrl`.

The token signature is generated using the HMAC-SHA256 algorithm with the server secret `ASSETS_SIGNING_SECRET`.

### Token Expiration (TTL)
Tokens have a configurable TTL (defaulting to **120 seconds**). The API Worker rejects expired tokens with `410 Gone`.

### Replay Risk Warning
> [!WARNING]
> While signed upload tokens are short-lived, they are **not** one-time-use by default unless a nonce storage mechanism (like Cloudflare KV or D1) is integrated to track used tokens. Operators must restrict the TTL to the minimum time required for a client to execute the PUT request.

## Staging Security Verification

For instructions on executing R2 upload tests and verifying boundary rejections (such as disallowed MIME types or path traversals) against the live staging environment, refer to the [Staging Live-Write Closed-Loop Verification](file:///c:/Users/ranbe/Documents/Github/xhalo-blog/docs/live-write-verification.md) guide.

