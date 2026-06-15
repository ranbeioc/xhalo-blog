# xhalo-blog Admin — UI Smoke Test

> Manual smoke test checklist for the admin UI. Run through every item after each
> staging or production deploy.

## Prerequisites

- A deployed instance of `xhalo-blog-admin` (staging preview or production).
- A modern browser with DevTools available (for console and network inspection).
- GitHub OAuth credentials configured for the target domain.

## Checklist

### Sidebar & Routing

- [ ] Sidebar renders with all 8 routes:
  - Dashboard
  - Posts
  - Editor
  - Media
  - Menus
  - Publishing
  - Audit Logs
  - Settings
- [ ] Clicking each route changes the content area to the corresponding panel.

### Dashboard

- [ ] Dashboard panel shows system health information.
- [ ] Dashboard panel shows readiness status.

### Posts

- [ ] Posts panel displays a post list (may be empty on first deploy).
- [ ] Posts panel includes a search input that filters the list.

### Editor

- [ ] Editor panel renders tab navigation with 4 tabs:
  - Edit
  - Preview
  - Diff
  - Plan
- [ ] Switching tabs updates the editor content area.

### Media

- [ ] Media panel displays a dry-run upload form.
- [ ] Submitting the form does **not** trigger an actual R2 upload.

### Menus

- [ ] Menus panel shows a list of menu items.
- [ ] Add and delete controls are visible for menu items.

### Publishing

- [ ] Publishing safety center renders the gate status matrix.
- [ ] All gates display their current lock/unlock status.

### Audit Logs

- [ ] Audit panel shows a log table (may be empty if no entries exist).
- [ ] Table headers are present and correctly labeled.

### Settings

- [ ] Settings panel shows deployment boundary information.
- [ ] Build configuration details are displayed.

### Write-Action Gates

- [ ] **Direct Publish** buttons are disabled.
- [ ] **Direct Update** buttons are disabled.
- [ ] **Direct Config Update** buttons are disabled.
- [ ] Clicking any disabled button does **not** send an API request.

### Error-Free Operation

- [ ] No `404` errors appear in the browser Network tab.
- [ ] No uncaught JavaScript errors appear in the browser console.

## Result

| Field       | Value |
| ----------- | ----- |
| Tester      |       |
| Date        |       |
| Environment |       |
| URL         |       |
| Pass / Fail |       |
| Notes       |       |
