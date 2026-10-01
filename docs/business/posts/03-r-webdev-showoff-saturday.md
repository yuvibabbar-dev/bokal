# r/webdev — Showoff Saturday ONLY (must be a Saturday)

> **Gate / rules:** Use the Showoff Saturday flair. Rule 3: commercial promotion = ban. MENTION NO PRICING AT ALL in this one — the body below has already had it stripped; keep it that way in comments too.

> Paste-ready. Verified against source 2026-08-23. Do NOT claim Edge availability.
>
> **History you must respect (found 2026-10-01):** this post was already submitted to r/webdev **twice, two minutes apart, on Thursday 2026-07-16** ("Resource" flair) and **both were removed by a moderator** — wrong day, wrong flair, and a duplicate. So: **Saturday only, Showoff Saturday flair, exactly once.** If it does not appear in /new within a few minutes, do NOT repost — modmail politely and wait. A third removal on the same account is how a ban happens.

---

**Title:** I built an open-source, MV3 cookie editor after the EditThisCookie mess — Bokal (HttpOnly cookies, no install-time host permissions)

**Body:**

I'm the maker of Bokal, a cookie manager for Chrome. Posting here because most of you have hit the same wall I did: you need to inspect or tweak a session cookie while debugging auth, and the tool either can't touch HttpOnly cookies (UI-only editors can't) or asks for `<all_urls>` at install and you have no idea what it does with that access.

**What it does (all free):**
- Full cookie CRUD, **including HttpOnly cookies**, via the extension cookies API — not just what `document.cookie` can read
- Search/filter across cookies
- Export to JSON, Netscape, a cookie-header string, Playwright `storageState`, Playwright `addCookies`, and Puppeteer `setCookie`; import back from JSON (incl. Cookie-Editor/EditThisCookie and Playwright/Puppeteer arrays) or a header string — handy for moving a logged-in session into an automated test.
- Reads Cookie-Editor / EditThisCookie JSON, so switching costs nothing
- Protect/pin/block rules, whitelist cleanup, a CHIPS partitioned-cookie inspector, a DevTools panel, dark mode, virtualized lists for big cookie stores

**On permissions/trust, since that's the whole reason I built it:** no `tabs` permission, and **no host permissions at install**. The published manifest is `cookies, storage, sidePanel, unlimitedStorage, alarms, activeTab`, with `<all_urls>` present only as an *optional* grant — by default it requests just the site you're on, at the moment you open it (`activeTab` reads the current URL, then it asks Chrome for that one origin). A granted per-site permission persists until you revoke it in `chrome://extensions`. No telemetry, no analytics, no ads, no remote code (CSP `script-src 'self'`, everything bundled). Free users make zero network calls — verify it in DevTools → Network. It's GPL-3.0, so you can read exactly what it does.

**On money, briefly:** everything above is free and stays free, and free users make zero network calls (verify in DevTools → Network). There is one optional paid extra — local cookie profiles — which I'm deliberately not pitching here; it's on the store listing if you care. Your cookie data never leaves your device on any tier.

Some context on why I bothered: EditThisCookie was delisted back in Dec 2024 (most plausibly a failed MV3 migration — no official reason given), and a [malicious copycat](https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/) then took the name and was caught harvesting credentials/tokens and phishing ([gHacks](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)).

Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
Source: https://github.com/yuvibabbar-dev/bokal
Site: https://bokal.dev

Happy to get into the MV3 migration, the cookies API quirks, or the permission model — critical feedback welcome.

---
