# Turnstile and Access

## Turnstile

Use Turnstile for public write operations:

- Comment submission
- Public forms
- Bot binding flows
- High-frequency search or submit APIs

Do not place Turnstile in front of every static page.

In Stage 2.5, Turnstile is still a planned integration point. Keep the public site readable without challenge pages unless a route accepts untrusted write traffic.

## Suggested Turnstile targets

Good candidates:

- comment submission
- contact or feedback forms
- preview token requests
- abuse-prone write APIs

Poor candidates:

- homepage
- archive and tag pages
- static post reading
- sitemap and feed files

## Access

Use Cloudflare Access for:

- Admin panel
- Admin API
- Preview deployments
- Internal deployment status pages

## Suggested Access boundary

Use Access only around internal or operator-facing surfaces:

```text
/admin/*
/api/admin/*
/api/internal/*
```

Do not put the public blog behind Access.

## Stage 2.5 boundary

This repository documents where Access and Turnstile belong. It does not yet ship a complete enforcement implementation for all of these paths.
