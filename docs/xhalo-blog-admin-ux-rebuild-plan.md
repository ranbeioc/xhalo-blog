# xhalo-blog Admin — UX Rebuild Plan

> Information architecture and module layout for the admin UI rebuild.

## Routes

The admin UI exposes **8 top-level routes** via hash-based routing:

| Hash Route       | Label             | Module File      |
| ---------------- | ----------------- | ---------------- |
| `#dashboard`     | Dashboard         | `dashboard.js`   |
| `#posts`         | Posts             | `posts.js`       |
| `#editor`        | Editor            | `editor.js`      |
| `#media`         | Media             | `media.js`       |
| `#menus`         | Menus             | `menus.js`       |
| `#publishing`    | Publishing        | `publishing.js`  |
| `#audit`         | Audit Logs        | `audit.js`       |
| `#settings`      | Settings          | `settings.js`    |

## Navigation

- **Sidebar-based** navigation rendered on every page.
- Route changes are driven by `window.location.hash`.
- The active route is highlighted in the sidebar.
- The main content area swaps to the corresponding module panel on each navigation.

## Module Architecture

All feature modules are **ES modules** located under `src/modules/`. Each module exports a `render()` function (or equivalent) that returns its panel DOM.

```
src/
├── config.js
├── main.js
└── modules/
    ├── api-client.js      shared API fetch wrapper
    ├── auth.js            GitHub OAuth flow
    ├── dashboard.js       system health & readiness
    ├── posts.js           post list with search
    ├── editor.js          markdown editor with tabs
    ├── media.js           R2 media management
    ├── menus.js           menu item CRUD
    ├── publishing.js      safety center & gate matrix
    ├── audit.js           audit log table
    ├── settings.js        deployment boundary info
    └── ui.js              shared UI primitives (sidebar, layout)
```

## Component Index

| Module            | Responsibility                                              |
| ----------------- | ----------------------------------------------------------- |
| `api-client.js`   | Shared fetch wrapper; attaches auth headers, base URL       |
| `auth.js`         | GitHub OAuth login/logout, token storage                    |
| `dashboard.js`    | System health overview, readiness checks                    |
| `posts.js`        | List all posts, search/filter, link to editor               |
| `editor.js`       | Markdown editing with tab navigation (Edit, Preview, Diff, Plan) |
| `media.js`        | R2 media browser with dry-run upload form                   |
| `menus.js`        | Menu item list with add/delete controls                     |
| `publishing.js`   | Safety center showing gate status matrix                    |
| `audit.js`        | Audit log table (read-only)                                 |
| `settings.js`     | Displays deployment boundary and build info                 |
| `ui.js`           | Sidebar, layout shell, shared UI components                 |

## Safe vs Gated Actions

The rebuild distinguishes between **safe actions** that are always available and **gated actions** that are disabled until explicitly unlocked.

### Safe Actions (always enabled)

| Action   | Description                          |
| -------- | ------------------------------------ |
| Read     | Fetch and display any resource       |
| Preview  | Render markdown preview in editor    |
| Diff     | Show diff between local and remote   |
| Plan     | Dry-run publish plan (no side effects) |

### Gated Actions (disabled — no write paths enabled)

| Action               | Gate Status |
| -------------------- | ----------- |
| Direct Publish       | 🔒 Disabled |
| Direct Update        | 🔒 Disabled |
| R2 Upload            | 🔒 Disabled |
| Direct Config Update | 🔒 Disabled |

> [!WARNING]
> No write paths are enabled in the current rebuild phase. All gated action buttons
> are rendered in a disabled state and do not submit requests.
