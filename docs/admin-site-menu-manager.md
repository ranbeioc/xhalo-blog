# Site Menu Manager

This document defines the schema, validation rules, configuration loading mechanics, and safety boundaries of the Site Menu Manager module in `xhalo-blog`.

## Scope

The Site Menu Manager allows administrators to read the navigation configuration from the main branch config, modify navigation items (add, remove, reorder, toggle visibility), and preview the generated configuration diff.

## Config Source

* **Primary Path**: `/repos/{owner}/{repo}/contents/rb-blog.config.json?ref=main` on the GitHub repository.
* **Fallback Path**: If the primary config is missing (HTTP 404), it falls back to `/repos/{owner}/{repo}/contents/rb-blog.config.example.json?ref=main`.
* **Exception Handling**: Other API errors (500, network timeouts, etc.) are thrown.
* **Format**: The configuration file must contain a `theme.menu` or `menu` array.

## Menu Item Schema & Validation Rules

Every menu item in the array must comply with the following validation rules:

| Field | Type | Rules |
| --- | --- | --- |
| `id` | String | **Required**. Must contain only lowercase letters, numbers, and hyphens (`/^[a-z0-9-]+$/`). Must be unique across items. |
| `label` | String | **Required**. Length must be between 1 and 40 characters. |
| `path` | String | **Required**. Length must be between 1 and 200 characters. See Protocol gating below. |
| `order` | Integer | **Required**. Must be an integer between 0 and 9999. |
| `visible` | Boolean | **Required**. |
| `external` | Boolean | **Required**. |
| `icon` | String | *Optional*. Must contain only alphanumeric characters and hyphens (`/^[a-zA-Z0-9-]+$/`). |

### Protocol and Scheme Gating

To prevent injection and redirection attacks, the `path` field is strictly validated:

* **External Items (`external = true`)**: The path must explicitly start with `https://`. `http://` paths are rejected.
* **Internal Items (`external = false`)**: The path must explicitly start with `/`.
* **Forbidden Schemes**: Paths starting with `javascript:`, `data:`, or protocol-relative `//` are strictly rejected.

## Preview Flow

1. The client loads the current menu via `GET /api/site/menu`.
2. The client makes local edits and posts the new menu list to `POST /api/site/menu/preview`.
3. The server validates the entire menu list.
4. The server loads the base config, applies the menu changes, and generates a unified diff.
5. The diff text is returned for review.

## Safety Boundaries & Write Restrictions

* **Direct Update Disabled**: The `POST /api/site/menu/direct-update` endpoint is disabled by default. It requires `OWNER_DIRECT_CONFIG_UPDATE_ENABLED=true` to even run, and returns a stub indicating it is reserved for a future phase.
* **PR-first Update Plan**: The `POST /api/site/menu/pr` endpoint returns a dry-run stub. Menu configuration writes are designed to be PR-first (opening a Pull Request on GitHub to modify `rb-blog.config.json`) and are not enabled for live execution in this phase.
