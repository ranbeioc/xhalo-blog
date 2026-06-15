# xhalo-blog Admin — Deployment Boundary

> Defines the isolated deployment boundary for the xhalo-blog admin UI.

## Project Location

The admin UI source lives in **`apps/admin/`** inside the `ranbeioc/xhalo-blog` repository. It is a self-contained single-page application with no dependency on the main blog build pipeline.

## Cloudflare Pages Project

| Property           | Value                        |
| ------------------ | ---------------------------- |
| Pages project name | `xhalo-blog-admin`           |
| Build command      | `node apps/admin/scripts/build.mjs` |
| Output directory   | `apps/admin/dist`            |

Preview URLs follow the standard Cloudflare Pages pattern:

```
https://<hash>.xhalo-blog-admin.pages.dev
```

> [!IMPORTANT]
> This project deploys to the dedicated **`xhalo-blog-admin`** Cloudflare Pages project.
> It is **NOT** part of the global `xhalo-admin` project. The two are entirely separate
> deployment targets with independent configuration, environment variables, and domains.

## Environment Variables

### `XHALO_ADMIN_API_BASE_URL`

This variable is injected during the build step and controls which API worker the admin UI communicates with.

| Environment | Example Value                                      |
| ----------- | -------------------------------------------------- |
| Staging     | `https://xhalo-blog-api-staging.<account>.workers.dev` |
| Production  | `https://xhalo-blog-api.<account>.workers.dev`         |

### Build-Time Placeholder Replacement

The build script (`apps/admin/scripts/build.mjs`) reads `XHALO_ADMIN_API_BASE_URL` from the environment and replaces the placeholder token inside `config.js`:

```
__XHALO_ADMIN_API_BASE_URL_PLACEHOLDER__  →  <actual URL>
```

This ensures that the compiled output contains the correct API base URL without requiring runtime configuration.

## Boundary Summary

```
ranbeioc/xhalo-blog (repo)
└── apps/
    └── admin/                  ← admin UI source
        ├── scripts/
        │   └── build.mjs       ← build entry point
        ├── src/
        │   ├── config.js       ← contains placeholder token
        │   └── modules/        ← feature modules
        └── dist/               ← build output (deployed)
```

- **Repo**: `ranbeioc/xhalo-blog`
- **Deploy target**: Cloudflare Pages → `xhalo-blog-admin`
- **Not related to**: `xhalo-admin` (a separate, global project)
