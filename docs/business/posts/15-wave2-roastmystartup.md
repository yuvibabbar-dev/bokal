# r/roastmystartup — Wave 2 (feedback venue, not an install channel)

> **Gate / notes:** Self-promo is allowed here *because the purpose is critique*. A launch-announcement framing is off-tone and gets removed. Ask for a roast and mean it — then actually engage with the answers, including the ones that sting.
>
> Expect few installs. The value is sharpening the pricing and positioning before Show HN, and one genuinely good critique here is worth more than fifty installs.

> Verified against source 2026-08-26; numbers, launch history and question 5 updated 2026-10-01 (store-search ranks measured that day — re-measure before posting, they move).

---

### r/roastmystartup

**Title:** Roast my pricing: $29.99 lifetime for one feature, on a free open-source tool with 106 users and $0 revenue

**Body:**

Roast away, specifically on the money.

**What it is:** Bokal, a cookie manager for Chrome. The whole cookie manager is free and open source (GPL-3.0) — full CRUD including HttpOnly, search, rules, cleanup, CHIPS partition inspector, DevTools panel, export to JSON/Netscape/Playwright/Puppeteer.

**What's paid:** exactly one feature. Named local cookie profiles — snapshot a site's cookies, switch between saved sets in one click. $4.99/mo, $19.99/yr, or $29.99 one-time.

**The numbers, unvarnished:** live on the Chrome Web Store since July 15. **106 users. Zero revenue. Zero GitHub stars.** Every install came from store search. My entire promotion was three posts on launch day — two removed by r/webdev mods (wrong day of the week), one Hacker News link that got a single point — and then nothing for eleven weeks, which is its own separate roast I'm already administering to myself.

**What I actually want torn apart:**

1. **Is one feature a product?** Pro is *only* cookie profiles. My reasoning was that a thin, honest paywall beats crippling the free tier. The counter-argument I can't dismiss: nobody buys a feature, they buy a solution, and "profiles" may be too small to register as either.
2. **Is $29.99 lifetime just wrong?** It's GPL, so anyone can fork out the licence check — I'm not relying on lock-in. Lifetime pricing on a tool needing indefinite maintenance may be a slow-motion mistake. But subscriptions for a local, offline dev utility feel insulting and I suspect they convert worse.
3. **Is the free tier too good?** It is a complete, capable cookie manager. Have I built something with no reason to ever pay for it?
4. **Is the positioning too clever?** My pitch is trust: no `tabs` permission, no site access at install, everything auditable. I recently discovered the 2M-user incumbent is *also* GPL-3.0 and *also* uses optional host permissions — so my real differentiators are one permission, partitioned-cookie support, and Playwright export. Is that enough of a wedge, or should I be leading with the dev features instead?
5. **Am I charging for the wrong feature?** I measured where I rank in Chrome Web Store search. Top ten for "playwright cookies" (#2), "partitioned cookies" (#3), "edit httponly cookies" (#5), "puppeteer cookies" (#7) — every one of them a *free* feature. For "cookie profiles", "account switcher" and "session switcher" — the thing I actually charge for — I don't appear at all, and the extensions that do are free and small (the biggest dedicated cookie-profile switcher I found has about 2,000 users). So the store sends me people who want what I give away, and nobody who wants what I sell. On top of that, inside the extension Pro is just a button labelled "★ Unlock Pro": no preview, no trial, no price until you've left for the checkout page.

**Links** (roast these too — the landing page especially):
- https://bokal.dev
- https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd
- https://github.com/yuvibabbar-dev/bokal

I'd rather hear it now than after I've spent another three months on this.
