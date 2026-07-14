<p align="center">
  <img src="apps/cookie-manager/public/icon/128.png" width="96" height="96" alt="Wafer icon">
</p>

<h1 align="center">Wafer</h1>

<p align="center">
  A trustworthy, open-source cookie manager for Chrome and Edge (Manifest V3).<br>
  View, edit, add, delete, import, and export cookies — with nothing leaving your device.
</p>

---

> **Status:** pre-launch. The extension is feature-complete and passes its full test + build + E2E
> suite, but is not yet published to the Chrome Web Store / Edge Add-ons. See
> [`docs/HANDOFF.md`](docs/HANDOFF.md) for the current state and remaining launch steps.
>
> **License:** not yet finalized — a bundled dependency (ExtPay) is copyleft, which constrains the
> choice. See [`docs/licensing-notes.md`](docs/licensing-notes.md). Until a `LICENSE` file lands,
> this source is published for transparency and review, not yet under an OSI grant.

## What Wafer is

Wafer is a Manifest V3 cookie manager built around a single promise: **your cookies never leave
your device.** No server, no account, no telemetry, no analytics, no remote code. It reads and
writes cookies through Chrome's `cookies` API and does everything locally.

It's aimed at web developers debugging sessions and auth, QA engineers juggling multiple accounts
and login states, and privacy-conscious users who want to see and control what sites store.

## Features (all free)

- **Full cookie control** — view, add, edit, and delete cookies, including `HttpOnly` cookies that
  UI-only tools can't touch.
- **Search & filter**, and view cookies for the current site or across all sites.
- **Rules** — protect cookies from deletion, pin important ones to the top, and block cookies from
  specific domains (reactive cleanup in the background service worker).
- **Whitelist cleanup** — keep a list of sites to preserve, then clear everything else with one
  click or an optional daily sweep (protected cookies are always kept).
- **Cookie audit hints** — flags missing `SameSite`, unpartitioned cross-site cookies, and
  oversized cookies inline.
- **Export** to JSON, Netscape (`cookies.txt`), cookie-header, and test-automation formats
  (Playwright `storageState`, Puppeteer) — no `downloads` permission needed.
- **Import** from JSON (Cookie-Editor / EditThisCookie compatible), cookie-header strings, and
  Playwright/Puppeteer files, validated before write.
- **CHIPS partition inspector** for modern partitioned cookies.
- **DevTools panel** — inspect and edit the current tab's cookies inside DevTools.
- **Dark mode** and virtualized lists that stay fast across thousands of cookies.

## Wafer Pro (optional, paid)

Pro adds **named local cookie profiles** — snapshot a site's cookies and switch between saved sets
(e.g. different test accounts) in one click — with **optional passphrase encryption** (AES-GCM +
PBKDF2, 600k iterations). Profiles live only on your device in IndexedDB.

Pro is deliberately minimal on privacy impact:

- The **Pro UI is code-split into a separate lazy chunk** — it loads via dynamic `import()` only
  when you're entitled, and the main bundle contains no Pro logic, so a free user never fetches or
  runs it. (The chunk ships inside the package like any code-split app; it's simply never loaded
  unless you buy Pro.)
- **Free users make zero network calls.** Billing (via [ExtPay](https://extensionpay.com) → Stripe)
  is only ever contacted after you open the upgrade page. See
  [`docs/pro-monetization.md`](docs/pro-monetization.md).

## Trust posture

Every privacy claim here is meant to be **literally true against the code** — that's the product.

- **No `tabs` permission**, and **no install-time `host_permissions`.** Host access is
  `optional_host_permissions: ['<all_urls>']`, requested at runtime for the specific site you're
  managing (via `activeTab` to read the current URL), and only escalated to all-sites when you
  explicitly open the all-cookies view, export all sites, or run cleanup.
- **No remote code** — everything Wafer runs is in the published package.
- **Cookie values are never logged**, and render as text nodes only (an XSS regression test locks
  this). Enforced by [`redaction.test.ts`](apps/cookie-manager/lib/security/redaction.test.ts) in CI.
- The published manifest is:
  `cookies, storage, sidePanel, unlimitedStorage, alarms, activeTab` + optional `<all_urls>`.

Context: the [permission landscape backs a minimal-permission stance — a peer-reviewed 2022 study
found only ~39.8% of Chrome Web Store extensions comply with the spirit of least
privilege](https://link.springer.com/article/10.1007/s10207-022-00610-w). Wafer's threat model is
documented in [`docs/threat-model.md`](docs/threat-model.md).

## Repository layout

This is a pnpm monorepo.

```
apps/cookie-manager/   # the WXT + React + TypeScript extension (the product)
  entrypoints/         #   background.ts (service worker), sidepanel/ (App.tsx), devtools
  lib/                 #   cookies/, io/, pay/, profiles/, rules/, security/, permissions, ...
  stores/              #   zustand stores (cookies, entitlement, rules, profiles)
  components/          #   CookieRow/List/Editor, IoBar, SearchBar, pro/ProfilesPanel (lazy)
  e2e/                 #   Playwright fixtures + smoke/granted specs
packages/ui-kit/       # shared theme.css + useTheme
packages/tsconfig/     # shared TS config
site/                  # pre-launch landing page + hosted privacy policy (static)
docs/                  # HANDOFF, threat-model, pro-monetization, store/, business/, specs
```

## Getting started

Requires **Node ≥ 24** and **pnpm 9.9.0** (`corepack enable` will provide pnpm).

```bash
pnpm install
pnpm --filter @wafer/cookie-manager dev      # WXT dev server
pnpm --filter @wafer/cookie-manager build     # -> apps/cookie-manager/.output/chrome-mv3
```

Load `apps/cookie-manager/.output/chrome-mv3` as an unpacked extension at `chrome://extensions`.

### Verify

```bash
pnpm -r test                                              # unit tests (vitest)
pnpm --filter @wafer/cookie-manager exec tsc --noEmit     # type-check
pnpm --filter @wafer/cookie-manager build                 # production build
pnpm --filter @wafer/cookie-manager zip                   # -> .output/*.zip (store upload)
pnpm --filter @wafer/cookie-manager e2e                   # Playwright E2E (smoke)
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs type-check, unit tests, build, and
Playwright E2E against **both** the normal and E2E builds on every push and PR.

## Contributing & security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow and the invariants that keep
the trust posture true, and [`SECURITY.md`](SECURITY.md) to report a vulnerability.
