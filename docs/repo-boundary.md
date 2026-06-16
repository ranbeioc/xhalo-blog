# Repository and Deployment Boundary

## xhalo-blog

xhalo-blog owns:

- blog frontend
- blog admin UI
- blog content API
- blog menu management
- blog media management
- Cloudflare Pages/Workers deployment for the blog system

xhalo-blog Admin frontend must be deployed only to xhalo-blog related Cloudflare Pages projects.

Allowed Pages project names:

- xhalo-blog
- xhalo-blog-staging

Disallowed Pages project names:

- xhalo-admin

## xhalo-admin

xhalo-admin is reserved for the global platform admin console.

It must not host the dedicated xhalo-blog blog admin UI.
