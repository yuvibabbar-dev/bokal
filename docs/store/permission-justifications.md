# Wafer — Permission Justifications

> Source: `docs/business/2026-07-13-business-recommendations.md` §6f, cross-checked against the
> actual shipped manifest (`apps/cookie-manager/.output/chrome-mv3/manifest.json`):
>
> ```json
> "permissions": ["cookies", "storage", "sidePanel", "unlimitedStorage", "alarms"],
> "optional_host_permissions": ["<all_urls>"]
> ```
>
> Note: the manifest has **no `tabs` permission** — that is a deliberate, load-bearing part of
> the trust positioning (see business doc §1). `alarms` is used by Wafer but is not covered in
> business doc §6f; its justification below was added for this task to keep the CWS submission
> accurate. Paste each line verbatim into the corresponding per-permission justification field
> in the Chrome Web Store / Edge Partner Center dashboards.

- **`cookies`** — Core and only function: read, create, edit and delete cookies for the site the
  user is managing. Without it the extension cannot work.
- **`storage`** — Stores local preferences via `chrome.storage.local` (theme, and the Pro
  entitlement cache) and a temporary cookie snapshot via `chrome.storage.session` (so the panel
  can rehydrate instantly on reopen). Note: the query/CHIPS-toggle filter state is in-memory only
  and is not persisted. For Pro users, named cookie profiles/snapshots are stored separately in
  IndexedDB (not `chrome.storage.local`; see `unlimitedStorage` below). All data is kept on the
  device; nothing is transmitted.
- **`sidePanel`** — Provides the side-panel view so users can inspect and edit cookies next to
  the page they are working on.
- **`unlimitedStorage`** — Lifts the browser's default IndexedDB eviction/quota limits for the
  Pro cookie-profile library, so users can keep more than a handful of saved profiles/snapshots
  (profiles are stored in IndexedDB, not `chrome.storage.local`). Everything stays on the device;
  nothing is transmitted.
- **`alarms`** — Schedules a daily local re-check of the user's Pro entitlement status (e.g.
  trial expiry) so the paywall stays accurate without polling on every action. No data leaves
  the device; the alarm only triggers a local entitlement re-check.
- **Host permissions (`optional_host_permissions: ["<all_urls>"]`)** — The `chrome.cookies` API
  requires host access to read and write cookies for a domain. Wafer requests host access only
  at runtime for the specific site the user chooses to manage, never `<all_urls>` up front.
