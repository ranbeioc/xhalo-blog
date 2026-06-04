# Custom Domain

Use a custom domain only after the example or template build is already stable on its default Pages URL.

## Recommended order

1. Add the domain to Cloudflare DNS.
2. Create or connect the Cloudflare Pages project.
3. Verify the default `*.pages.dev` deployment first.
4. Add the apex domain, for example `example.com`.
5. Add `www.example.com` only if you plan to serve it.
6. Pick one canonical host and redirect the other host to it.
7. Verify SSL status before publishing links.

## Recommended host shape

- Public blog: apex domain, for example `example.com`
- Optional redirect: `www.example.com` -> `example.com`
- Preview builds: keep them on `*.pages.dev`

Do not point preview branches at the production custom domain.

## Before switching traffic

Check all of these first:

- homepage returns `200`
- static assets load from the same host
- `_headers` behavior is present on HTML and static files
- sitemap and search files generate correctly
- canonical URLs and feed URLs match the final host

## Boundary

Do not copy a production domain, DNS record, or certificate setup from another private site into this scaffold repository.
