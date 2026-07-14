# Bokal — Store Listing Copy

> Source: `docs/business/2026-07-13-business-recommendations.md` §4. Paste-ready for the
> Chrome Web Store and Microsoft Edge Add-ons listing forms. Do not alter wording — this is the
> approved, locked copy.

## TITLE (name field — 58 / 75 chars)

```
Bokal - Cookie Editor & Manager (Open Source, No Tracking)
```

Front-loads the descriptor because nobody searches "Bokal" yet; the ~35-char search truncation
still reads **"Bokal - Cookie Editor & Manager"**, capturing the two highest-intent queries,
while the trust tail shows on the detail page. **Do NOT** put "EditThisCookie" or
"Cookie-Editor" in the title/summary (impersonation/trademark = suspension risk).

## SUMMARY (126 / 132 chars — plain text, real search terms, no stuffing)

```
Edit, add, view & delete cookies incl. HttpOnly. JSON/Netscape export, JSON import, CHIPS inspector. Open source, no tracking.
```

## DESCRIPTION (paste-ready)

```
Bokal is an open-source cookie editor and cookie manager for developers, QA
engineers, and privacy-minded users. View, edit, add, and delete cookies —
including HttpOnly cookies — search and filter them, and import or export in
JSON and Netscape formats. Bokal is the trustworthy, open-source successor for
anyone left stranded by the EditThisCookie takedown and the copycat that
replaced it.

WHY BOKAL IS SAFE
Trust is the whole point of Bokal:
• Minimal permissions — no "tabs" permission at all. Bokal asks for access to a
  site only at the moment you choose to manage it, never to all sites up front.
• No remote code — everything Bokal runs is in the published package.
• No telemetry, no analytics, no ads, no tracking of any kind.
• Local-first — your cookies never leave your device: no Bokal server, no cloud,
  no account. (The only network activity is the optional Pro license check via
  ExtensionPay/Stripe, and only if you buy Pro.)
• Open source — every line is published so you (or anyone) can verify these
  claims for yourself.

FEATURES
• Full cookie control: view, add, edit, and delete cookies, including HttpOnly
  cookies that UI-only tools can't touch.
• Search and filter; view cookies for the current site or across all sites.
• Protect cookies from deletion, pin important ones to the top, and block
  cookies from specific domains (reactive cleanup).
• Automatic cleanup: keep a list of sites to preserve, then clear everything
  else with one click or a daily sweep (protected cookies are always kept).
• Cookie audit hints: flags missing SameSite, unpartitioned cross-site cookies,
  and oversized cookies right in the list.
• Export to JSON, Netscape (cookies.txt), and cookie-header formats — no
  "downloads" permission needed.
• Export for test automation: Playwright storageState and Puppeteer formats.
• Import from JSON (Cookie-Editor / EditThisCookie compatible), cookie headers,
  and Playwright/Puppeteer files.
• CHIPS partition inspector for modern partitioned cookies.
• DevTools panel: inspect and edit the current tab's cookies inside DevTools.
• Dark mode and fast, virtualized lists across thousands of cookies.

WHO IT'S FOR
• Web developers debugging sessions and authentication.
• QA engineers testing multiple accounts and login states.
• Privacy-conscious users who want to see and control what sites store.

PERMISSIONS, IN PLAIN ENGLISH
• cookies — the core function: read, create, edit, and delete cookies for the
  site you're managing.
• storage — saves your local preferences (dark mode) and cookie rules
  (protect/pin/block) on your device.
• sidePanel — renders Bokal's side-panel interface next to the page.
• unlimitedStorage — lets Pro cookie profiles grow past the default quota;
  everything stays on your device.
• alarms — schedules local periodic tasks: a re-check of your Pro license, and (only if you
  turn it on) the daily cookie-cleanup sweep; nothing is transmitted.
• activeTab — reads the current tab's address (only when you open Bokal) so it
  can request access to just that one site. Not the "tabs" permission.
• Host access — required by Chrome's cookies API to read/write cookies for a
  domain. Bokal requests it at runtime for the specific site you're on, never
  for all sites up front and nothing at install. It asks for all-sites access
  only when you open the all-cookies view, export all sites, or run cleanup.

COMPATIBILITY
Bokal imports Cookie-Editor and EditThisCookie JSON exports, so switching over
takes seconds.

BOKAL PRO (OPTIONAL — EVERYTHING ABOVE IS FREE)
Named local cookie profiles — snapshot a site's cookies and switch between saved
sets (for example, different test accounts) in one click, with optional
passphrase encryption (AES-GCM). Fully local, like everything else in Bokal:
your profiles never leave your device.

• $4.99 / month
• $19 / year
• $39 one-time — pay once, own it forever (launch price $29)

Already bought Pro? Open Bokal and click "Restore purchase".
```

> **⚠ Pro is LIVE — do not describe it as "coming soon".** The shipped build renders a working
> "★ Unlock Pro" button wired to ExtensionPay. You **must** tick the **in-app purchases / paid
> features** disclosure on the CWS and Edge submission forms.

## FEATURE-BULLET LIST (for the compact card / repo README reuse)

- View, add, edit, delete cookies — **including HttpOnly**
- Search & filter
- Export: **JSON + Netscape** (no downloads permission)
- Import: JSON (Cookie-Editor / EditThisCookie compatible)
- **CHIPS partition inspector**
- Dark mode + virtualized lists
- **No `tabs` permission · host access only when you grant it · no remote code · no telemetry · open source**

## Screenshots

All five are **1280×800**, generated by `apps/cookie-manager/scripts/gen-screenshots.mjs` from the
actual built extension driven in real Chromium — not mockups, and **not empty**. The generator runs
a local server on a real hostname (`app.example.com`), seeds a believable logged-in cookie jar, then
binds the panel to that tab exactly as the real side panel does, so every frame shows real cookies.

Regenerate with:
```bash
pnpm --filter @bokal/cookie-manager build:e2e
pnpm --filter @bokal/cookie-manager exec node scripts/gen-screenshots.mjs
```

1. **`01-cookies.png`** — the hero: 12 real cookies on a live site (session_id, auth_token,
   csrf_token…), search bar, scope selector, audit badges. **Caption:** "View, edit & delete every
   cookie — including HttpOnly."
2. **`02-editor.png`** — the editor opened on a real cookie: Name, Value, Domain, Path,
   Host-only/Secure/HttpOnly, SameSite, session toggle. **Caption:** "Edit value, expiry, SameSite
   and HttpOnly — the flags UI-only tools can't touch."
3. **`03-all-cookies.png`** — the all-sites view. **Caption:** "See every cookie in your browser,
   across all sites."
4. **`04-rules-cleanup.png`** — protect / pin / block rules and the whitelist cleanup sweep.
   **Caption:** "Protect the cookies you need. Sweep away the rest."
5. **`05-pro-profiles.png`** — Bokal Pro: an encrypted saved profile with Apply. **Caption:**
   "Bokal Pro: named cookie profiles — save and switch cookie sets in one click."

*(The old 3 frames showed "0 cookies · unknown site" over a blank panel — the generator opened the
side panel as a lone page with no tab to bind to. Fixed 2026-07-14.)*
