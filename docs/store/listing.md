# Wafer — Store Listing Copy

> Source: `docs/business/2026-07-13-business-recommendations.md` §4. Paste-ready for the
> Chrome Web Store and Microsoft Edge Add-ons listing forms. Do not alter wording — this is the
> approved, locked copy.

## TITLE (name field — 60 / 75 chars)

```
Wafer - Cookie Editor & Manager (Open Source, No Tracking)
```

Front-loads the descriptor because nobody searches "Wafer" yet; the ~35-char search truncation
still reads **"Wafer - Cookie Editor & Manager"**, capturing the two highest-intent queries,
while the trust tail shows on the detail page. **Do NOT** put "EditThisCookie" or
"Cookie-Editor" in the title/summary (impersonation/trademark = suspension risk).

## SUMMARY (126 / 132 chars — plain text, real search terms, no stuffing)

```
Edit, add, view & delete cookies incl. HttpOnly. JSON/Netscape export, JSON import, CHIPS inspector. Open source, no tracking.
```

## DESCRIPTION (paste-ready)

```
Wafer is an open-source cookie editor and cookie manager for developers, QA
engineers, and privacy-minded users. View, edit, add, and delete cookies —
including HttpOnly cookies — search and filter them, and import or export in
JSON and Netscape formats. Wafer is the trustworthy, open-source successor for
anyone left stranded by the EditThisCookie takedown and the copycat that
replaced it.

WHY WAFER IS SAFE
Trust is the whole point of Wafer:
• Minimal permissions — no "tabs" permission at all. Wafer asks for access to a
  site only at the moment you choose to manage it, never to all sites up front.
• No remote code — everything Wafer runs is in the published package.
• No telemetry, no analytics, no ads, no tracking of any kind.
• Local-first — there is no server, no cloud, and no account. Nothing you do
  leaves your device.
• Open source — every line is published so you (or anyone) can verify these
  claims for yourself.

FEATURES
• Full cookie control: view, add, edit, and delete cookies, including HttpOnly
  cookies that UI-only tools can't touch.
• Search and filter across all cookies for a site.
• Export to JSON and Netscape (cookies.txt) — no "downloads" permission needed.
• Import from JSON (compatible with Cookie-Editor and EditThisCookie exports).
• CHIPS partition inspector for modern partitioned cookies.
• Dark mode.
• Fast, virtualized lists that stay smooth across thousands of cookies.

WHO IT'S FOR
• Web developers debugging sessions and authentication.
• QA engineers testing multiple accounts and login states.
• Privacy-conscious users who want to see and control what sites store.

PERMISSIONS, IN PLAIN ENGLISH
• cookies — the core function: read, create, edit, and delete cookies for the
  site you're managing.
• storage — saves your local preferences (dark mode, filters) on your device.
• sidePanel — renders Wafer's side-panel interface next to the page.
• Host access — required by Chrome's cookies API to read/write cookies for a
  domain. Wafer requests it only at runtime for the specific site you choose,
  never for all sites up front.

COMPATIBILITY
Wafer imports Cookie-Editor and EditThisCookie JSON exports, so switching over
takes seconds.

COMING SOON (WAFER PRO)
Named local cookie profiles — snapshot a site's cookies and switch between saved
sets (for example, different test accounts) in one click, with optional
passphrase encryption. Fully local, like everything else in Wafer.
```

## FEATURE-BULLET LIST (for the compact card / repo README reuse)

- View, add, edit, delete cookies — **including HttpOnly**
- Search & filter
- Export: **JSON + Netscape** (no downloads permission)
- Import: JSON (Cookie-Editor / EditThisCookie compatible)
- **CHIPS partition inspector**
- Dark mode + virtualized lists
- **No `tabs` permission · host access only when you grant it · no remote code · no telemetry · open source**

## Screenshots

<!-- Added in Task 4: 5 x 1280x800 screenshots + captions per business doc §5. -->
