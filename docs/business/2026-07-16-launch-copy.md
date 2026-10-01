I have everything I need, verified against the actual source (`wxt.config.ts`, `background.ts`, `paid-flow.test.ts`, `IoBar.tsx`, `crypto.ts`, README) and with real citation URLs. Below is the final, paste-ready kit.

---

> **CORRECTION 2026-10-01:** the next paragraph's "nothing had been posted / never fired" is WRONG.
> Three posts went out on 2026-07-16 (one HN link, two r/webdev posts) and all died within minutes —
> see `posts/README.md` → "What has actually been posted". The claim was inferred from zero GitHub
> stars and never checked against HN or Reddit.
>
> **REVISED 2026-08-23.** Nothing here had been posted as of this date — the kit was written
> 2026-07-16 and never fired (GitHub still shows 0 stars / 0 forks / 0 issues). This revision:
> (a) removed every "Edge is in review" claim — five weeks stale and Bokal does not appear in the
> Edge store, so verify in Partner Center before claiming anything; (b) removed the
> "$29.99 rising to ~$39" price-increase language everywhere — manufactured urgency reads badly on
> HN/Reddit and there is no conversion data to justify a raise; (c) reframed the EditThisCookie
> delisting as history ("back in December 2024") rather than news, since it is ~20 months old.
> Store status at revision time: **26 users, 5.0★ from 2 ratings, v1.0.2.**

---

# Bokal — Final Launch Kit

## 1. Pre-post checklist

1. **Accounts ready:** confirm the usernames you'll post from (HN, r/webdev, r/QualityAssurance, r/chrome_extensions, Product Hunt, X, LinkedIn, AlternativeTo). Each should have some prior history — brand-new accounts get auto-throttled or filtered.
2. **Citations loaded:** keep the two source links open to paste inline wherever the origin story appears — the gHacks delisting write-up (`https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/`) and the copycat-malware report (`https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/`).
3. **Optional legal touch:** the "Bokal" trademark knockout is clean, so this is not a launch gate — but a ~$300–500 attorney once-over before going loud is cheap insurance.
4. **Timing + presence:** post on a weekday morning US Eastern (Tue–Thu ~8–10am ET is the HN/PH sweet spot), then clear the next 4–6 hours to answer every comment yourself, fast and in your own voice.
5. **Edge is NOT live:** and do NOT say "in review" — that claim is five weeks stale and unverified. Everywhere it comes up, say "Chrome and Chromium browsers for now." Check Partner Center before claiming anything else.
6. **No incentivized reviews:** don't solicit, exchange, or hint at reviews anywhere — this audience punishes it and it breaks store policy.

---

## 2. Show HN

### Final title (recommended)

**Show HN: Bokal – Open-source cookie editor without the "tabs" permission**

*(Changed 2026-10-01 — the previous title, "…that asks for no host permissions up front", was what got submitted on 2026-07-16 and leads with a claim Cookie-Editor matches. See `posts/04-show-hn.md`.)*

### First comment (post immediately after submitting)

Maker here. One disclosure before anything else, because I'd rather you hear it from me than trip over it later: Bokal is free, and everything I list below stays free. There is exactly one paid feature — Pro cookie profiles ($4.99/mo or $29.99 one-time) — and I describe it honestly at the bottom.

**Why it exists.** Back in December 2024, EditThisCookie — a cookie editor reportedly used by ~3M people ([gHacks](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)) — vanished from the Chrome Web Store. Google never gave an official reason; the most plausible one is that it never migrated to Manifest V3. Then a copycat took the "EditThisCookie" name and was caught harvesting login credentials/tokens and pushing phishing content, growing past 50k users before anyone stopped it ([report](https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/)).

That's the *motivation*, not a reason to trust me — "the other guy committed crimes" proves nothing about Bokal. So here's the part you can actually check.

**The manifest — this is the whole thing, published build:**

    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage', 'alarms', 'activeTab']
    optional_host_permissions: ['<all_urls>']
    // no host_permissions
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" }

**On permissions, precisely — because a vague "no `<all_urls>`" would be a lie:**
- No `tabs` permission.
- No host permissions at install. `<all_urls>` appears only as an *optional* grant — the set Bokal is *allowed to ask for*, not something granted at install.
- By default it requests only the origin of the tab you opened it on (`activeTab` reads that one URL after your click, then it asks Chrome for that single site). All-sites is a separate, explicit opt-in you only hit if you open the all-cookies view or run an all-sites cleanup/export.
- Lifecycle, stated plainly: `activeTab` is ephemeral, but a per-site host grant *persists* until you revoke it (`chrome://extensions` → Details → Site access), and while it's granted it's a standing permission — Bokal can read that one origin's cookies with the panel closed. That's the honest shape of it.

To be blunt about what this tool is: reading and writing cookies including HttpOnly is session-hijack-grade access to whatever site you point it at. "Minimal" here means **narrow** — one site at a time, nothing at install — not **weak**. Within a site you've granted, it's fully capable, because that's the job. Which is exactly why the build has to be checkable.

**On "nothing leaves your device":**
- No remote code — everything Bokal runs ships inside the package (`script-src 'self'`).
- The only external service it ever contacts is ExtensionPay, for the Pro license check, and only after you open the upgrade page. The service worker *deliberately does not* start ExtPay on load (see `entrypoints/background.ts`), and a test asserts that a free user who never touches Pro makes zero ExtPay calls (`lib/pay/paid-flow.test.ts`). The Pro UI is a lazy chunk that never loads unless you're entitled.
- Don't take my word for it — install it, open DevTools → Network, exercise every free feature, and watch it stay empty.

**On "open source" vs "the store build *is* that source" — different claims, and I won't blur them.** I'm *not* claiming a byte-for-byte reproducible build; the store package is a minified production bundle. What you can do today: read the permission and payment code in the repo, build it from the release tag and load it unpacked (README "Verify"), and lean on the invariants locked by CI tests (the zero-network test above; a redaction/XSS test that cookie values are never logged). If you find daylight between what the shipped extension does and what the source says, that's the bug report I most want.

**It's GPL-3.0, Pro included.** Nothing stops you forking Bokal and deleting the license check — I'm not relying on license lock-in, and I'd rather say that than pretend Pro is a locked capability. The honest reason to pay is to fund the work and skip building a cookie-profile system yourself.

**Free (all of it):** full cookie CRUD including HttpOnly, search/filter, protect/pin/block rules, whitelist cleanup, a CHIPS partitioned-cookie inspector, a DevTools panel, dark mode, virtualized lists. **Export:** JSON, Netscape, a cookie-header string, Playwright `storageState`, Playwright `addCookies` array, and Puppeteer `setCookie` array. **Import:** JSON — including Cookie-Editor / EditThisCookie exports, Playwright `storageState`, and Playwright/Puppeteer cookie arrays — plus cookie-header strings, so switching costs nothing. As of v1.1.0 import also parses Netscape `cookies.txt`, including curl's `#HttpOnly_` marker.

**Being straight about the incumbent, because half of what I first wrote here was wrong.** Cookie-Editor is free, has ~2M users and 4.4★, is **also GPL-3.0** (1.7k GitHub stars), migrated to MV3 back in 2022, and has used `optional_host_permissions` since **August 2023**. So "open source" and "no install-time host permissions" are **not** things that separate Bokal from it. I pulled its `manifest.chrome.json` before writing this and corrected myself; better that than have you do it for me in the comments.

What actually differs is narrower, and all three are checkable:

- **Cookie-Editor requests `tabs`. Bokal doesn't** — it uses `activeTab` instead. `tabs` is the permission that makes Chrome show **"Read your browsing history"** on the install screen. That's the one permission-line difference, and you can see it before you click Add.
- **CHIPS / partitioned cookies** — Bokal has a partition inspector; Cookie-Editor's codebase contains no `partitionKey` handling at all.
- **Automation export** — Playwright `storageState` / `addCookies` and Puppeteer `setCookie`. Cookie-Editor has none.

If you don't touch partitioned cookies or test automation, and the browsing-history warning doesn't bother you, Cookie-Editor is a genuinely good tool and I'd rather you keep using it than switch on vibes.

**The one paid feature — Bokal Pro:** named local cookie profiles. Snapshot a site's cookies as a profile, then switch between saved sets in one click — and "switch" means it restores that set *into the live session in place* (across HttpOnly and partitioned cookies), not export-a-file-then-reimport. Optional AES-GCM (256-bit, PBKDF2 600k) passphrase encryption, everything in IndexedDB. $4.99/mo · $19.99/yr · $29.99 one-time.

Live on the Chrome Web Store now — Chrome and Chromium browsers.

- Site: https://bokal.dev
- Repo: https://github.com/yuvibabbar-dev/bokal
- Listing: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd

I'd genuinely like the permission model and the build torn apart — if you can make it see more than it should, or find a gap between the published extension and the source, that's the feedback I'm here for. How would you have designed the trust model differently?

---

## 3. Reddit

### r/webdev

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

**Paywall disclosure upfront:** everything above is free forever. The one paid feature ("Bokal Pro") is named local cookie profiles — snapshot a site's cookies and switch between saved sets in one click, where "switch" restores the set into the live session in place (not export-file-then-reimport), with optional AES-GCM passphrase encryption, stored 100% locally in IndexedDB. $4.99/mo, $19.99/yr, or $29.99 one-time. Pro is GPL too — you could fork out the license check; I'm not relying on lock-in. Your cookie data never leaves your device regardless of tier.

Some context on why I bothered: EditThisCookie was delisted back in Dec 2024 (most plausibly a failed MV3 migration — no official reason given), and a [malicious copycat](https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/) then took the name and was caught harvesting credentials/tokens and phishing ([gHacks](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)).

Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
Source: https://github.com/yuvibabbar-dev/bokal
Site: https://bokal.dev

Happy to get into the MV3 migration, the cookies API quirks, or the permission model — critical feedback welcome.

---

### r/QualityAssurance

**Title:** Cookie manager with named local profiles for juggling test accounts + Playwright storageState export (open source, maker here)

**Body:**

I'm the maker of Bokal, a Chrome cookie manager. Posting here specifically because the paid feature was built for a QA problem: **switching between multiple test accounts on the same site without constantly logging in and out.**

The workflow it's meant for:
- Log in as test-account A, snapshot that site's cookies into a named profile
- Do the same for B, C, admin, guest, whatever
- Switch between saved sets in one click — and "switch" restores that cookie set into the *live session in place* (across HttpOnly and partitioned cookies), so no re-login, no incognito juggling, no clearing storage between runs
- Optional AES-GCM passphrase encryption on the stored profiles, all in local IndexedDB (no server, no account)

The other half that's relevant to automation: it exports cookies to **Playwright `storageState`**, Playwright `addCookies`, and Puppeteer `setCookie` (also JSON / Netscape / cookie-header). So you can set up a session by hand in the browser and export it straight into your suite instead of scripting the login flow — or the reverse, import a session your framework produced to debug what the browser actually sees.

Everything else is free: full cookie CRUD including HttpOnly cookies (which UI-only tools can't edit), search/filter, protect/pin/block rules, a CHIPS partitioned-cookie inspector, a DevTools panel. It also reads Cookie-Editor / EditThisCookie JSON if you're coming from those.

**Honest paywall disclosure:** the named cookie profiles are the only paid feature ("Bokal Pro") — $4.99/mo, $19.99/yr, or $29.99 one-time. Everything else is free, and free users make zero network calls (verify in DevTools → Network); your cookie data never leaves your device on any tier. It's open source (GPL-3.0), no telemetry, and it requests access only to the site you're on when you open it — no install-time host permissions.

Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
Source: https://github.com/yuvibabbar-dev/bokal

If you manage a stack of test accounts, I'd genuinely like to hear whether the profiles workflow matches how you actually work — or where it falls short.

---

### r/chrome_extensions

**Title:** Bokal — an open-source MV3 cookie manager with no install-time host permissions (maker here)

**Body:**

I'm the maker. Bokal is a cookie manager for Chrome, and the reason it exists is the permission model, so I'll lead with that and paste the actual manifest.

Published build:

    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage', 'alarms', 'activeTab']
    optional_host_permissions: ['<all_urls>']
    // no host_permissions
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" }

What that means, precisely:
- **No `tabs` permission.**
- **No host permissions at install.** `<all_urls>` is present only as an *optional* grant — the set Bokal may request, not something granted on install. By default it requests just the active origin (`activeTab` reads the current URL after your toolbar click, then it asks Chrome for that one site). All-sites is a separate, explicit opt-in.
- **A per-site grant persists** until you revoke it (`chrome://extensions` → Details → Site access), and while granted it's a standing permission for that one origin. I'd rather own that than imply it's more ephemeral than it is.
- **No remote code** — everything runs from the bundled package (`script-src 'self'`).
- The only external service it ever contacts is ExtensionPay, for the Pro license check, and only after you open the upgrade page. The service worker deliberately doesn't start ExtPay on load (`entrypoints/background.ts`), and a test asserts a free user makes zero ExtPay calls (`lib/pay/paid-flow.test.ts`). Verify it yourself in DevTools → Network.
- GPL-3.0, so all of the above is checkable, not just claimed.

Why I bothered: EditThisCookie was delisted back in Dec 2024 (most plausibly a failed MV3 migration; [gHacks](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/) — no official reason from Google), and a [copycat](https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/) then took the name and was caught harvesting credentials/tokens and phishing. For a tool that by definition handles your session cookies, I wanted one that's narrow-by-default and fully auditable.

**Feature-wise (all free):** full cookie CRUD including HttpOnly, search/filter, export (JSON, Netscape, cookie-header, Playwright `storageState` / `addCookies`, Puppeteer `setCookie`) and import (JSON — incl. Cookie-Editor / EditThisCookie and Playwright/Puppeteer arrays — plus header strings and Netscape `cookies.txt`), protect/pin/block rules, whitelist cleanup, CHIPS partitioned-cookie inspector, DevTools panel, dark mode, virtualized lists.

**Paywall, disclosed upfront:** one paid feature ("Bokal Pro") — named local cookie profiles (snapshot a site's cookies and restore a saved set into the live session in one click, e.g. test accounts, with optional AES-GCM encryption, 100% local in IndexedDB). $4.99/mo, $19.99/yr, $29.99 one-time. Pro is GPL too — you could fork out the check; I'm not relying on license lock-in.

Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
Source: https://github.com/yuvibabbar-dev/bokal
Site: https://bokal.dev

Happy to get into the manifest, the optional-host-permission flow, or the CHIPS handling — critical feedback welcome.

---

## 4. Product Hunt

### Tagline (57 chars)
**Open-source cookie manager — no host permissions at install**

*Alternates (all ≤60):*
- Open-source, local-first cookie manager for Chrome (50)
- Cookie manager that keeps your cookies on your device (54)

### Short description
Bokal is an open-source (GPL-3.0) Manifest V3 cookie manager for Chrome. Full cookie CRUD including HttpOnly, search/filter, protect/pin/block rules, and export across JSON, Netscape, cookie-header, and Playwright/Puppeteer formats (import covers all of those, Netscape included) — plus a CHIPS partitioned-cookie inspector and a DevTools panel. No `<all_urls>` at install, no "tabs" permission, no telemetry, no remote code. Free users make zero network calls and your cookie data never leaves your device. Everything's free; the one paid feature (Bokal Pro, $29.99 one-time) adds named local cookie profiles with optional passphrase (AES-GCM) encryption.

### First maker comment (founder voice)

> Hey Product Hunt 👋 — maker of Bokal here.
>
> **Why I built this.** Back in December 2024, EditThisCookie — a cookie editor a lot of us debugged with for years (reportedly ~3M users, [per gHacks](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)) — quietly vanished from the Chrome Web Store. Google never gave an official reason; the most plausible story is it never migrated to Manifest V3. Then it got worse: a [copycat](https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/) grabbed the "EditThisCookie" name, grew to tens of thousands of users, and was caught harvesting login **credentials/tokens** and phishing people. That's about the worst outcome for a tool you hand cookie access to.
>
> So I built Bokal to be the version you can actually verify. The backstory is the *why* — not a reason to trust me. These are:
>
> **Trust is the whole product:**
> - Open-source, GPL-3.0 — read every line.
> - No "tabs" permission, and **no host permissions at install**. `<all_urls>` exists only as an optional grant; by default it requests just the site you're on, when you open it. A per-site grant persists until you revoke it in `chrome://extensions`.
> - No telemetry, no analytics, no ads, no remote code (everything bundled, `script-src 'self'`).
> - Local-first: no server, no account. **Free users make zero network calls** (check it in DevTools → Network), and your cookie data never leaves your device.
>
> **Free (all of it):**
> - Full cookie CRUD including **HttpOnly** cookies (UI-only tools can't touch those)
> - Search/filter, protect/pin/block rules, whitelist cleanup
> - Export: JSON, Netscape, cookie-header, Playwright `storageState`/`addCookies`, Puppeteer `setCookie` · Import: all of those, Netscape included
> - CHIPS partitioned-cookie inspector, DevTools panel, dark mode, virtualized lists
> - Reads Cookie-Editor / EditThisCookie JSON — switching costs nothing
>
> **The only paid feature — Bokal Pro:**
> - Named local cookie profiles: snapshot a site's cookies and restore a saved set into the live session in one click (e.g. test accounts), with optional AES-GCM passphrase encryption. 100% local (IndexedDB).
> - $4.99/mo · $19.99/yr · $29.99 one-time. Pro is GPL too — I'm not relying on license lock-in; the honest reason to pay is to fund the work.
>
> Live on the Chrome Web Store today.
>
> I'd genuinely love feedback — especially from devs and QA folks juggling sessions and multiple test accounts. Please tear into the permissions model. Thanks for taking a look.
>
> — [your name]
>
> Site: https://bokal.dev · Code: https://github.com/yuvibabbar-dev/bokal · Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd

### Topics / tags
Developer Tools · Chrome Extensions · Privacy · Open Source · Productivity

---

## 5. Launch essay

# What EditThisCookie's delisting taught me about browser trust

In December 2024, EditThisCookie disappeared from the Chrome Web Store. If you wrote web software in the last decade you probably used it — a cookie editor with millions of users (reportedly around 3M, [per gHacks](https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)) and a permanent spot in the QA and web-dev toolbox. Then it was gone. Google never gave an official reason, but the most plausible story is mundane: it never migrated to Manifest V3, and the old platform stopped being allowed.

What happened next is the part that stuck with me. A [copycat](https://cybersecuritynews.com/malicious-editthiscookie-chrome-extension/) showed up using the same name — "EditThisCookie®" — and rode the recognition of the original straight into people's browsers. It was caught harvesting credentials and session tokens and running phishing flows, and it reached 50k+ users before it was pulled. People installed it because they trusted a name, and the name had been hollowed out.

I kept coming back to one uncomfortable fact: a cookie editor is a near-perfect vehicle for that kind of attack. To do its job at all, it has to read cookies — and cookies are how you stay logged in. Your session cookie *is* your logged-in self. An extension that can read the cookies on your bank, your email, your company's admin panel doesn't need to guess your password; it can just borrow the session. The tool that helps you debug auth is, structurally, the tool best positioned to steal it. So "just trust the developer" is not a real answer. The trust has to be built into what the extension is *able* to do.

That's the constraint I built Bokal around.

## Permissions are the actual trust surface

Most extensions ask for broad access at install time — `<all_urls>` host permissions, the `tabs` permission — and users click through because the alternative is the extension not working. But that up-front grant is exactly the thing you can't verify. You're trusting that the code which *can* read every site you visit *won't*.

Bokal doesn't take that grant. Concretely:

- **No `tabs` permission at all.** It has no business enumerating your open tabs, so it can't.
- **No install-time host permissions.** It does not request `<all_urls>` up front. `<all_urls>` appears in the manifest only as an *optional* grant — the set Bokal may ask for — while it actually requests, by default, just the origin of the tab you opened it on (`activeTab` reads that one URL, then it asks Chrome for that single site). A granted per-site permission persists until you revoke it in `chrome://extensions`; that's the honest lifecycle, and it's still scoped to the one site you chose, not a standing key to everything.
- **No remote code.** The Content Security Policy is `script-src 'self'`; everything is bundled in the package you install. There is no path where Bokal fetches and runs code after review — closing off the after-the-fact behavior change that turns a trusted extension into a dangerous one.
- **Open source, GPL-3.0.** The repo is public. You don't have to take my word for any of the above; you can read it, inspect the published build against the source, and fork it if I ever do something you dislike.
- **Local-first.** No server, no account, no telemetry, no analytics, no ads. Free users make zero network calls (open DevTools → Network and confirm it), and your cookie data never leaves your device.

None of this is exotic. It's just declining capabilities a cookie editor doesn't strictly need — and the delisting-plus-copycat story is a good argument for why declining them matters. To be clear about what "minimal" means here: it means *narrow* — one site at a time, nothing at install — not *weak*. Within a site you've granted, Bokal has full read/write over its cookies, because that's the job. That access is inherently sensitive, which is precisely why the build is open and checkable.

The rest is the boring feature work you'd expect: full cookie CRUD including HttpOnly cookies (which UI-only, `document.cookie`-based tools can't touch), search and filtering, export across JSON, Netscape, cookie-header, and Playwright/Puppeteer formats (import covers all of them, Netscape included), protect/pin/block rules, a CHIPS partitioned-cookie inspector, a DevTools panel, dark mode. It also reads Cookie-Editor and EditThisCookie JSON, so moving over costs you nothing. And to be fair to the alternatives: Cookie-Editor is free, widely used, GPL-3.0 like Bokal, and has used optional host permissions since 2023 — so neither "open source" nor "no install-time host access" tells the two apart. What does: it requests `tabs` (the "read your browsing history" warning) where Bokal uses `activeTab`, and it has no partitioned-cookie or Playwright/Puppeteer support. That's a narrower case than I'd have liked to make, but it's the true one.

## The honest part about money

All of the above is free, and it stays free. I want to be upfront about the one thing that isn't, because finding a paywall by surprise is its own small betrayal of trust.

There is a paid tier, **Bokal Pro**, and it does exactly one thing: named local cookie profiles. You snapshot a site's cookies as a profile and switch between saved sets in one click — three test accounts, say, without logging in and out all day. The part that earns the price over the free export/import is that "switch" restores a saved set *into the live session in place*, across HttpOnly and partitioned cookies — not download-a-file-then-reimport-it. Profiles are stored locally in IndexedDB, with optional AES-GCM passphrase encryption (256-bit, PBKDF2 600k iterations). It's $4.99/mo, $19.99/yr, or a $29.99 one-time lifetime license.

Two fair questions. First: it's GPL, so what stops someone forking out the license check and shipping the profile switcher for free? Nothing — and that's fine. I'm not relying on license lock-in; the honest reason to pay is to fund the work and not rebuild the profile system yourself. Second: what happens to a *local-only* lifetime license if I stop working on it? The reassuring answer. Because profiles live on your machine and Pro isn't a cloud service, there's no server that can go dark and take your data with it. License checks talk to the payment provider (ExtensionPay) only if you open the upgrade page; free users never make a network call. And it's GPL — if I vanish, the code doesn't.

The lesson from the EditThisCookie mess wasn't "some developers are bad." It was that a browser extension should be trustworthy by construction, not by reputation — because reputation, as that story showed, is exactly the thing an attacker can steal. Bokal is my attempt to build the cookie editor that way. It's live on the Chrome Web Store now.

If that resonates, the code is open — read it before you trust it. That's the whole point.

---

## 6. Short-form / evergreen

### X / Twitter thread

**1/**
EditThisCookie — a cookie editor millions relied on — was delisted from the Chrome Web Store in Dec 2024. Then a copycat grabbed its name and got caught phishing and harvesting login credentials/tokens.

I built Bokal to be the opposite of that. 🧵
(gHacks: https://www.ghacks.net/2024/12/31/google-chrome-legit-editthiscookie-extension-removed-instead-of-malicious-copycat/)

**2/**
Bokal is an open-source (GPL-3.0) Manifest V3 cookie manager for Chrome.

- No "tabs" permission
- No host permissions at install — `<all_urls>` is optional-only; it asks for the site you're on, when you open it
- No telemetry, analytics, or ads
- No remote code (bundled, `script-src 'self'`)

**3/**
Full cookie CRUD, including HttpOnly cookies UI-only tools can't touch. Search/filter, protect/pin/block rules, whitelist cleanup, CHIPS partitioned-cookie inspector, DevTools panel, dark mode, virtualized lists.

Export: JSON, Netscape, cookie-header, Playwright `storageState`/`addCookies`, Puppeteer `setCookie`. Import: the same, Netscape included.

**4/**
Switching is free — it reads Cookie-Editor / EditThisCookie JSON.

Free users make zero network calls (check DevTools → Network); your cookie data never leaves your device. Local-first: no server, no account.

**5/**
One paid feature: Bokal Pro = named local cookie profiles. Snapshot a site's cookies, then restore a saved set into the live session in one click (e.g. test accounts), with optional AES-GCM passphrase encryption. 100% local (IndexedDB).

$4.99/mo · $19.99/yr · $29.99 one-time. Everything else is free.

**6/**
Live on Chrome now.

Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
Code: https://github.com/yuvibabbar-dev/bokal
Site: https://bokal.dev

It's open source — verify it yourself. Feedback welcome.

### LinkedIn post

Back in December 2024, EditThisCookie — a cookie editor used by millions — was quietly delisted from the Chrome Web Store. Shortly after, a copycat extension took its name and was caught phishing users and harvesting their login credentials and tokens.

For developers and QA engineers who live in cookies all day, that left a real trust gap. So I built Bokal: an open-source (GPL-3.0), Manifest V3 cookie manager for Chrome, designed so you don't have to take my word for anything.

How it's built:
• No "tabs" permission, and no install-time host permissions — `<all_urls>` is an optional grant only; Bokal requests access to the specific site you're on, when you open it.
• No telemetry, no analytics, no ads, no remote code — everything is bundled (CSP `script-src 'self'`).
• Local-first: no server, no account. Free users make zero network calls, and your cookie data never leaves your device.

What it does: full cookie CRUD including HttpOnly cookies (which UI-only tools can't edit), search/filter, protect/pin/block rules, whitelist cleanup, a CHIPS partitioned-cookie inspector, a DevTools panel, and export across JSON, Netscape, cookie-header, and Playwright/Puppeteer formats (import covers all of them, Netscape included). It also reads Cookie-Editor and EditThisCookie JSON, so switching costs nothing.

Everything above is free. The only paid tier, Bokal Pro, adds named local cookie profiles — snapshot a site's cookies and restore a saved set into the live session in one click (like different test accounts), with optional AES-GCM passphrase encryption, stored locally in IndexedDB. It's $4.99/mo, $19.99/yr, or $29.99 one-time.

Live on Chrome now.

Chrome Web Store: https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
Source: https://github.com/yuvibabbar-dev/bokal
Site: https://bokal.dev

If you work with sessions, auth, or multiple test accounts, I'd genuinely value your feedback.

### AlternativeTo entry

**Short description:**

Bokal is an open-source (GPL-3.0), Manifest V3 cookie manager for Chrome — an alternative to EditThisCookie and Cookie-Editor built around verifiable trust. It requests no "tabs" permission and no install-time host permissions: `<all_urls>` is declared only as an optional grant, and access is requested per-site when you open it. No telemetry, no analytics, no ads, no remote code — local-first with no server and no account, so free users make zero network calls and cookie data never leaves the device.

Features: full cookie CRUD including HttpOnly cookies, search/filter, protect/pin/block rules, whitelist cleanup, a CHIPS partitioned-cookie inspector, a DevTools panel, and dark mode. Export supports JSON, Netscape, cookie-header, Playwright `storageState`/`addCookies`, and Puppeteer `setCookie`; import covers all of those — Netscape included — and it reads Cookie-Editor and EditThisCookie JSON directly.

Freemium: everything above is free. The only paid feature, Bokal Pro, adds named local cookie profiles (snapshot and restore saved cookie sets into the live session) with optional AES-GCM passphrase encryption, stored 100% locally. $4.99/mo, $19.99/yr, or $29.99 one-time.

**Tags/fields:** Free (freemium) · Open Source · GPL-3.0 · Chrome extension
**Alternative to:** EditThisCookie, Cookie-Editor

### SEO page angles

**A. "EditThisCookie alternative"**
- **Title tag:** Open-Source EditThisCookie Alternative for Chrome (MV3) — Bokal
- **H1:** Looking for an EditThisCookie alternative? Bokal is the open-source successor.
- **Angle:** Capture migration/trust intent after the ~Dec 2024 delisting and the credential-phishing copycat. Tell the story honestly (cite gHacks + the malware report), then the pitch: open source, MV3, minimal permissions, one-click "Import your EditThisCookie JSON." Include a permissions comparison and a "why the original disappeared" explainer. Disclose the free/Pro split on the page.

**B. "Cookie-Editor alternative"**
- **Title tag:** Cookie-Editor Alternative: Open-Source, Minimal-Permission Cookie Manager — Bokal
- **H1:** A Cookie-Editor alternative built for developers who read the permissions.
- **Angle:** Comparison-intent page for people on the ~2M-user incumbent. Differentiate ONLY on what actually differs (verified 2026-08-26): no `tabs` permission = no "read your browsing history" install warning; CHIPS partition inspector; Playwright/Puppeteer export. Do NOT claim open source or optional host permissions as differentiators — Cookie-Editor is GPL-3.0 and has used optional_host_permissions since Aug 2023. Plus dev features (HttpOnly editing, CHIPS inspector, Playwright/Puppeteer export). Include a fair feature table and concede Cookie-Editor is free — no bashing.

**C. "export cookies for Playwright"**
- **Title tag:** Export Cookies for Playwright (storageState) from Chrome — Bokal
- **H1:** How to export a site's cookies as Playwright storageState.
- **Angle:** High-intent how-to for QA/automation. Step-by-step: open Bokal on the site → export → drop the `storageState` JSON into your Playwright test. Cover Puppeteer `setCookie`, Netscape, and cookie-header as secondary keywords, and tie in the Pro profiles use case for juggling test-account sessions.

---

## 7. Suggested launch sequence

1. **Soak (days -3 to 0):** ship the site + repo README polish, make sure the "Verify" steps and the zero-network claim are trivially checkable, and post nowhere yet — quietly confirm the store build is clean.
2. **Show HN (day 0, Tue–Thu ~8–10am ET):** your single highest-scrutiny launch; be at the keyboard all day to reply. Let it run 24h before anything else so the conversation isn't split.
3. **Reddit (day +1 to +2):** stagger the three subreddits a day apart (r/webdev → r/chrome_extensions → r/QualityAssurance), each posted natively, not cross-posted.
4. **Product Hunt (day +3 to +5, 12:01am PT):** run it after HN/Reddit have produced quotes and feedback you can fold in; then let the evergreen assets (X, LinkedIn, AlternativeTo, SEO pages) trickle out over the following week.