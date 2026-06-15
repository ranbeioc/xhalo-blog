# Media Asset Manager

This document outlines the scope, validation constraints, safety rules, and future integration paths for the Media Asset Manager module in `xhalo-blog`.

## Scope

The Media Asset Manager helps authors validate, process, and generate markdown snippets for images, videos, and documents. In the current phase, it operates entirely as a **dry-run** preview generator.

## Supported MIME Types & File Extensions

Only the following formats are allowed:

| Category | MIME Type | Allowed Extensions |
| --- | --- | --- |
| **Images** | `image/png` | `.png` |
| | `image/jpeg` | `.jpg`, `.jpeg` |
| | `image/webp` | `.webp` |
| | `image/gif` | `.gif` |
| | `image/svg+xml` | `.svg` *(Flagged as High-Risk)* |
| **Documents** | `application/pdf` | `.pdf` |
| | `text/plain` | `.txt` |
| | `application/zip` | `.zip` |
| **Videos** | `video/mp4` | `.mp4` |
| | `video/webm` | `.webm` |

## Size Limits

File sizes are validated based on their media category:

* **Images**: Maximum 5MB (`5 * 1024 * 1024` bytes)
* **Documents**: Maximum 20MB (`20 * 1024 * 1024` bytes)
* **Videos**: Maximum 100MB (`100 * 1024 * 1024` bytes)

## Storage Targets

The system supports two storage destinations for media:

1. **R2 (CDN)**: Uploads are stored on Cloudflare R2 and served via CDN. Target path format: `posts/{slug}/{sanitized_filename}`.
2. **Git Asset Folder**: Stored directly in the Git repository alongside the article source. Target path format: `source/_posts/{slug}/{sanitized_filename}`.

## Markdown Snippets

Based on the MIME type and storage destination, the module generates specific snippets:

* **Images (R2)**: `![Alt Text](https://<cdn-domain>/posts/<slug>/filename.png)`
* **Images (Git)**: `{% asset_img filename.png Alt Text %}`
* **Videos (R2)**: `<video controls src="https://<cdn-domain>/posts/<slug>/filename.mp4"></video>`
* **Documents (PDF/ZIP/TXT)**: `[Label](https://<cdn-domain>/posts/<slug>/filename.pdf)`

## Dry-Run Boundary

No assets are written to Cloudflare R2 or committed to the repository in this phase. The `/api/assets/media-preview` endpoint validates the inputs and returns the target paths and markdown snippets for client integration, but does **not** persist any bytes.

## Security Restrictions

1. **Path Traversal Rejection**: Any filename containing path traversal sequences (e.g. `../` or `..`) or slash characters is rejected.
2. **Sanitization Requirement**: Filenames are sanitized (collapsing non-alphanumeric characters to hyphens, converting to lowercase). If the sanitized filename becomes empty, the request is rejected.
3. **Forbidden Extensions**: Active scripts, pages, or executables (e.g. `.exe`, `.js`, `.sh`, `.php`, `.html`, `.htm`, `.xhtml`) are strictly rejected.
4. **SVG Risk Mitigation**: SVG files are flagged as `highRisk: true` and returned with a note warning that they are restricted to dry-run previews.
5. **No Batch Payload**: The endpoint processes single assets; batch arrays are rejected.

## Future Integration Flows

### Future Live R2 Flow
In a subsequent phase, validating an R2 asset will generate a signed PUT URL permitting the client to upload the file directly to the R2 bucket using client-side secure chunks, verifying the MD5 hash on completion.

### Future Git Asset Folder PR Flow
Committed assets destined for the Git folder will be encoded as Base64 and bundled into the pull request payload alongside the article markdown, creating a unified publish commit.
