# Admin Preview Security Model

This document describes the security architecture of the Admin Panel's Markdown preview feature.

## Why Raw HTML Is Prohibited

The Admin Panel includes a real-time Markdown preview that renders user-typed content as HTML. If unsanitized HTML were rendered directly via `innerHTML`, an attacker (or even an accidental paste) could inject:

- `<script>` tags that execute arbitrary JavaScript
- `<img onerror>` handlers that trigger on load failure
- `<a href="javascript:">` links that execute code on click
- `<iframe>` elements that load malicious content

Since the Admin Panel runs inside a Cloudflare Access-protected context with session credentials, XSS in this panel could lead to session hijacking, unauthorized API calls, or data exfiltration.

## Why External CDN Scripts Are Not Used

The previous implementation loaded `marked.js` from:

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

This posed multiple risks:

1. **No version pinning**: The URL resolves to whatever version jsDelivr considers "latest", which could change at any time.
2. **No Subresource Integrity (SRI)**: Without an `integrity` attribute, a compromised CDN could serve modified code.
3. **Supply chain attack surface**: A compromise of jsDelivr or the `marked` npm package could inject malicious code into every Admin Panel deployment.
4. **Offline/air-gapped incompatibility**: Self-hosted or restricted environments cannot reach external CDNs.

## Current Implementation

The Admin Panel now uses a custom `renderSafeMarkdown()` function (defined in `apps/admin/src/app.js`) that:

1. **Escapes ALL HTML entities first** — converts `<`, `>`, `&`, `"`, `'` to their entity equivalents before any Markdown processing.
2. **Applies safe Markdown patterns** — only after escaping, the function matches known-safe patterns like headers, bold, italic, etc.
3. **Whitelists link protocols** — only `https://`, `http://`, and `mailto:` are allowed as link targets. Dangerous protocols (`javascript:`, `data:`, `vbscript:`) are rejected.

### Supported Markdown Subset

| Syntax | Rendering |
|---|---|
| `# Header` through `###### Header` | `<h1>` through `<h6>` |
| Double newlines | Paragraph breaks (`<p>`) |
| `**bold**` | `<strong>bold</strong>` |
| `*italic*` | `<em>italic</em>` |
| `` `code` `` | `<code>code</code>` |
| Fenced code blocks (` ``` `) | `<pre><code>...</code></pre>` |
| `- item` or `* item` | `<ul><li>item</li></ul>` |
| `1. item` | `<ol><li>item</li></ol>` |
| `[text](https://...)` | `<a href="...">text</a>` |
| `[text](mailto:...)` | `<a href="mailto:...">text</a>` |

### Rejected Patterns

| Input | Result |
|---|---|
| `<script>alert(1)</script>` | Escaped to `&lt;script&gt;` |
| `<img src=x onerror=alert(1)>` | Escaped to `&lt;img ...` |
| `[click](javascript:alert(1))` | Rendered as plain text, no link |
| `<div onmouseover="...">` | Escaped to `&lt;div ...` |
| Any raw HTML tags | Always escaped |

## Future Considerations

If a full Markdown parser (e.g., `marked`, `markdown-it`) is needed in the future:

1. It **MUST** be paired with a sanitizer such as [DOMPurify](https://github.com/cure53/DOMPurify).
2. It **MUST** be installed as a local npm dependency, not loaded from a CDN.
3. It **MUST** have version pinning and lockfile tracking.
4. XSS test coverage (`tests/markdown-xss-safety.test.mjs`) must be updated to cover any new rendering paths.

## Test Coverage

The XSS safety tests are in `tests/markdown-xss-safety.test.mjs` and cover:

- Script tag injection
- Image onerror injection
- javascript: protocol links
- data: protocol links
- Nested HTML in markdown
- Event handler attributes
- Normal markdown rendering (headers, paragraphs, bold, italic, code, links, lists)
