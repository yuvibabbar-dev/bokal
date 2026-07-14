# Bokal — Permission Justifications

> Source: `docs/business/2026-07-13-business-recommendations.md` §6f, cross-checked against the
> actual shipped manifest (`apps/cookie-manager/.output/chrome-mv3/manifest.json`):
>
> ```json
> "permissions": ["cookies", "storage", "sidePanel", "unlimitedStorage", "alarms", "activeTab"],
> "optional_host_permissions": ["<all_urls>"]
> ```
>
> Note: the manifest has **no `tabs` permission** — that is a deliberate, load-bearing part of
> the trust positioning (see business doc §1). `activeTab` (added in M11) is NOT `tabs`: it only
> exposes the current tab's URL after the user opens Bokal, so Bokal can request access to just
> that one site; it shows no install warning. `alarms` and `activeTab` are used by Bokal but were
> not in business doc §6f; their justifications below were added to keep the CWS submission
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
- **`alarms`** — Schedules two periodic tasks: (1) for users who have engaged Pro, a daily re-check
  of Pro entitlement status, which contacts ExtensionPay to verify the license — no cookie or
  browsing data is sent, only the license is checked, and **free users who never engage Pro make no
  such request**; and (2) — only when the user explicitly enables auto-sweep — a purely local daily
  cookie-cleanup sweep that clears cookies outside their keep-list. The alarm scheduling itself sends
  nothing; only the Pro license re-check touches the network, and only for Pro users.
- **`activeTab`** — Lets Bokal read the current tab's address (only after you open Bokal from the
  toolbar) so it can ask for access to just that one site. This is not the `tabs` permission and
  shows no install warning; it does not grant cookie access on its own.
- **Host permissions (`optional_host_permissions: ["<all_urls>"]`)** — The `chrome.cookies` API
  requires host access to read and write cookies for a domain. Bokal requests access **for the
  specific site you're on** at runtime (never `<all_urls>` up front, nothing at install). It
  requests all-sites access only when you explicitly open the all-cookies view, export all sites,
  or run cleanup — features that inherently span every site. `<all_urls>` is declared as
  *optional* solely because Chrome requires a declared pattern before an extension can request any
  subset of it (like a single site).
