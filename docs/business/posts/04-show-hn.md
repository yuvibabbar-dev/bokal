# Show HN — highest scrutiny, post LAST of the big three

> **Gate / rules:** Title goes in the HN title field; the body below is the FIRST COMMENT, posted immediately after submitting. Weekday 8-10am ET. Clear 4-6 hours to reply to everything.
>
> **This is a RE-submission (found 2026-10-01).** Bokal was already submitted once: [item 48937187](https://news.ycombinator.com/item?id=48937187), Thu 2026-07-16 13:05 ET, from an account created that day, as a bare link to bokal.dev — **no "Show HN:" prefix and no maker comment**. It got 1 point and 0 comments, i.e. it never left /new. That outcome says nothing about the pitch; it is what a prefix-less link from a brand-new account gets. HN's FAQ explicitly allows reposting a story that "has not had significant attention". Do it properly this time:
> 1. **"Show HN:" prefix** — that is what routes it to the Show section.
> 2. **Link the GitHub repo, not bokal.dev** — a different URL avoids the duplicate detector pointing you back at the dead July item, and this audience prefers the source.
> 3. **Paste the first comment within a minute of submitting.**
> 4. Same account is fine. If a commenter mentions the July post, say so plainly: first attempt, no comment, sank.

> Paste-ready. Verified against source 2026-08-23. Do NOT claim Edge availability.

---

**Title:** Show HN: Bokal – Open-source cookie editor without the "tabs" permission

*(Changed 2026-10-01. The old title — "…that asks for no host permissions up front" — is what was submitted in July, and it leads with a claim that is true of Bokal but equally true of the 2M-user incumbent, so the first reply writes itself. `tabs` vs `activeTab` is the one permission-line difference; the title now says that. 72 chars, limit 80.)*

---

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
