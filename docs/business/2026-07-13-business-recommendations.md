# Bokal — Business Recommendations

**Date:** 2026-07-13
**Author:** Strategy Lead
**Status:** DECISIONS — locked for launch. This is a decision document, not a menu. Each choice below is the version we ship.

> **⚠ Corrections (2026-07-14, post-audit — where this doc and the live state disagree, the live
> state wins):**
> 1. **Live checkout prices are $4.99/mo · $19.99/yr · $29.99 lifetime launch** (→ ~$39 around
>    2026-09-14). The $19/$29 figures that appeared below predate the ExtPay setup and have been
>    corrected in place; the store listing must always match the live checkout.
> 2. **§6 predates the audit finding that ExtPay stores the Pro buyer's EMAIL in
>    `chrome.storage.sync`** — so the CWS **PII category IS ticked (THREE categories, not two)**,
>    and licence data (incl. that email) IS transmitted to ExtensionPay/Stripe when a user buys
>    Pro. §6b/6c are corrected in place; the §6a policy block is the pre-audit draft kept for
>    history. **Canonical store answers: `docs/store/data-use-answers.md`; canonical policy:
>    `docs/store/privacy-policy.md` (live at `/privacy.html`).**

**Product in one line:** Bokal is a Manifest V3 Chrome/Edge cookie manager positioned as the trustworthy, open-source successor to the delisted EditThisCookie — minimal permissions, no remote code, no telemetry, local-first.

---

## 1. Positioning

**Value prop (one line):** The cookie editor you can actually trust — full cookie control (including HttpOnly), open source, no tracking, and it never phones home.

**Tagline:** **"Every cookie, under your control. Nothing leaves your device."**
- Backup tagline for the store icon / promo tile: **"Bokal — the trustworthy cookie editor."**

**Lead differentiators (in priority order):**
1. **Minimal permissions.** No `tabs` permission. Host access is requested only at runtime for the specific site you choose (`optional_host_permissions`), never `<all_urls>` up front. Near-zero install warning.
2. **No remote code, no telemetry, local-first.** Nothing is transmitted off the device. No server, no cloud, no account, no analytics.
3. **Published open source.** The whole point: you (or anyone) can verify every claim in the repo — the direct answer to the malicious "EditThisCookie®" copycat that poisoned the category.
4. **Full power, including HttpOnly.** Real CRUD via the `chrome.cookies` API — view/add/edit/delete HttpOnly cookies that UI-only tools can't touch — plus CHIPS partition inspection for modern partitioned cookies.
5. **Migration-friendly.** Imports Cookie-Editor / EditThisCookie JSON, so switching costs nothing.

**Sharpest "why switch from Cookie-Editor" line:**
> **"Cookie-Editor asks for the `tabs` permission and is closed to the average user; Bokal drops `tabs`, requests site access only when you grant it, and publishes every line of source. Same power, less trust required."**

*Rationale (research):* EditThisCookie's 3M-user delisting plus the credential-stealing copycat (50k+ users) created a live trust vacuum, and the ASO research shows unexplained broad permissions measurably depress installs — trust is both the moat and the highest-leverage conversion lever, so we lead with it everywhere.

---

## 2. Free vs Pro Split

We do **not** cripple the free tier. Free stays fully useful so it wins installs, reviews, and the trust argument; Pro gates exactly one high-value workflow that only power users (QA/dev juggling test accounts) need.

### FREE (permanent, no account, no nag beyond a single review prompt)
- Full cookie **CRUD**: view, add, edit, delete — **including HttpOnly cookies** via the API
- **Search / filter** across cookies
- **Export:** JSON (Cookie-Editor-compatible shape) **and** Netscape `cookies.txt` — no `downloads` permission
- **Import:** JSON (Cookie-Editor / EditThisCookie compatible)
- **CHIPS partition inspector** (partitioned-cookie visibility)
- **Dark mode**
- **Virtualized lists** (handles thousands of cookies smoothly)
- Runtime host-permission flow (grant per site)

### PRO (the paid anchor — one feature, done well)
- **Named local cookie profiles / sets:** snapshot a site's cookies → save as a named profile → **apply / restore / delete**. The core job: switch between logged-in test accounts (e.g., admin vs. member vs. logged-out) in one click.
- **Optional passphrase encryption of the profile store at rest** (default OFF, opt-in, with an in-UI warning that profiles hold live credentials). When on, it encrypts the whole local profile store.
- **100% local.** Stored in `chrome.storage.local` (`unlimitedStorage`), graduating to IndexedDB for large libraries. No cloud, no sync, no backend.

**Why the free tier still wins trust/installs while Pro converts:**
- *Free wins installs:* a fully-free trusted incumbent (Cookie-Editor, ~2M users) already caps willingness-to-pay, so a generous free tier is table stakes to compete for the install and the review — and the trust story (open source, no telemetry) only lands if the useful thing is free to inspect and use.
- *Pro converts the right 1%:* real Chrome-extension free-to-paid runs 0.5–2% of active users, concentrated in QA/dev power users who juggle test accounts — exactly the pain that named profiles solve. Gating one high-value workflow at the moment of use converts that segment without alienating the 98% who came for free CRUD. Keeping Pro 100% local is what makes a lifetime license safe (see §3).

---

## 3. Pricing

### FINAL TIERS
| Plan | Price | Notes |
|---|---|---|
| Monthly | **$4.99 / mo** | Anchor only — makes annual look cheap; not a revenue line |
| Annual | **$19.99 / yr** | ~4 months of monthly; the "sensible subscriber" option |
| **Lifetime** | **$39 one-time** | **DEFAULT-SELECTED in the ExtPay paywall — this is the featured offer** |

- **Launch promo:** Lifetime **$29.99** for the first **~60 days** to seed reviews, then it returns to $39. (Never offer lifetime to legacy subscribers.)
- **Feature the lifetime, not the subscription.** For a local, no-backend, trust-first utility competing with a free incumbent, "pay once, own it, no subscription, no cloud, no telemetry" is both the best-converting and the most on-brand offer.

### FREE-TRIAL STANCE
- **7-day full-Pro reverse trial**, triggered **at the moment of use** — specifically when the user tries to **save/apply a second profile**. Everything Pro is unlocked for 7 days; at expiry it reverts to free unless they buy.
- *Why:* paywalling at the point of limitation lifts conversion ~3x and a reverse trial lifts it ~60% in the benchmarks; the second-profile trigger is the exact moment the multi-account value becomes concrete.

### REVENUE RATIONALE (one line, accounting for the ~7–8% take and the free incumbent)
Stripe's flat **$0.30** dominates the ~7–8% ExtPay(5%)+Stripe(2.9%+$0.30) take and punishes low monthly prices ($2.99/mo nets only ~$2.45, ~18% lost), so we push buyers onto **annual/lifetime** (which amortize the $0.30 and keep ~91%); because Pro is 100% local with ~zero marginal cost, a lifetime license behaves like classic software licensing — not cannibalized SaaS — so featuring **$39 lifetime** maximizes conversion against a free incumbent without a cost sink.

*Changes from Doc's strawman ($2.99/$19/$29):* monthly $2.99 → **$4.99** (survives the flat fee; pure anchor); lifetime $29 → **$39** (marginal cost ~zero, so the binding constraint is WTP/conversion, not cost; stays under the $40 threshold, reads as "less than a year of most dev tools," sits at ~2x annual so it reads as a deal without making annual pointless). Annual **$19/yr** unchanged.

*Guardrail:* Never add cloud/sync to Pro without repricing — a lifetime license only stays safe while marginal cost per user is ~zero. Canada's CAD $30k GST/HST small-supplier threshold sits far above realistic year-one revenue, so no near-term tax-registration burden — but track gross receipts if a lifetime launch spikes.

---

## 4. Store Listing Copy (paste-ready)

### TITLE (name field — 58 / 75 chars)
```
Bokal - Cookie Editor & Manager (Open Source, No Tracking)
```
Front-loads the descriptor because nobody searches "Bokal" yet; the ~35-char search truncation still reads **"Bokal - Cookie Editor & Manager"**, capturing the two highest-intent queries, while the trust tail shows on the detail page. **Do NOT** put "EditThisCookie" or "Cookie-Editor" in the title/summary (impersonation/trademark = suspension risk).

### SUMMARY (126 / 132 chars — plain text, real search terms, no stuffing)
```
Edit, add, view & delete cookies incl. HttpOnly. JSON/Netscape export, JSON import, CHIPS inspector. Open source, no tracking.
```

### DESCRIPTION (paste-ready)
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
• sidePanel — renders Bokal's side-panel interface next to the page.
• Host access — required by Chrome's cookies API to read/write cookies for a
  domain. Bokal requests it only at runtime for the specific site you choose,
  never for all sites up front.

COMPATIBILITY
Bokal imports Cookie-Editor and EditThisCookie JSON exports, so switching over
takes seconds.

COMING SOON (BOKAL PRO)
Named local cookie profiles — snapshot a site's cookies and switch between saved
sets (for example, different test accounts) in one click, with optional
passphrase encryption. Fully local, like everything else in Bokal.
```

### FEATURE-BULLET LIST (for the compact card / repo README reuse)
- View, add, edit, delete cookies — **including HttpOnly**
- Search & filter
- Export: **JSON + Netscape** (no downloads permission)
- Import: JSON (Cookie-Editor / EditThisCookie compatible)
- **CHIPS partition inspector**
- Dark mode + virtualized lists
- **No `tabs` permission · host access only when you grant it · no remote code · no telemetry · open source**

*Rationale (research):* Google's July-2026 listing guidance caps the summary at 132 chars and treats keyword stuffing as both a ranking penalty and a suspension trigger, so the copy stays human-readable; the first ~150–200 words carry the heaviest algorithmic weight, so they front-load real search terms plus the trust block; and the incumbent's bare "Cookie-Editor" title is a keyword-descriptor gap we exploit.

---

## 5. Screenshots Plan (5 × 1280×800, full-bleed, annotated — produced in M5/M6 from the running extension)

Ordered by conversion weight (first three carry ~70%). Each is a real capture of the shipped UI on a live site, annotated.

1. **HERO — cookie list.** Cookie list for a real, recognizable site with the search bar visible and a "No tracking · Open source" badge. **Caption:** "View, edit & delete every cookie — including HttpOnly."
2. **EDIT panel.** Editing a cookie's value / expiry / flags, with a callout on HttpOnly editing. **Caption:** "Edit value, expiry, SameSite and HttpOnly — the flags UI-only tools can't touch."
3. **TRUST / PERMISSIONS graphic.** The single biggest conversion lever, kept in the first three frames. **Caption:** "No `tabs` access · Host access only when you grant it · No remote code · No telemetry."
4. **IMPORT / EXPORT.** Showing JSON + Netscape side by side. **Caption:** "Import & export in JSON and Netscape — no downloads permission, compatible with Cookie-Editor/EditThisCookie."
5. **CHIPS inspector (dark mode).** Partition inspector for power-user credibility. **Caption:** "Inspect partitioned (CHIPS) cookies — in full dark mode."

Store icon stays a simple bokal/cookie mark — **no UI, no text**. Add an in-app review prompt after the user's **3rd successful cookie action** to build the review velocity the ranking algorithm rewards.

---

## 6. Privacy Policy + CWS Data-Use Answers

### 6a. FULL PRIVACY POLICY (host at a public URL; paste the URL into the CWS dashboard privacy field)

```
Privacy Policy — Bokal (last updated 2026-07-13)

Bokal is a local-first cookie manager.

What Bokal accesses: to do its job, Bokal reads and writes the cookies of the
site you choose to manage, using Chrome's cookies API. This includes
authentication cookies and other data stored in the site's browser storage.

What Bokal does NOT do: Bokal collects no personal information, tracks no
browsing history, and contains no analytics, telemetry, ads, or remote code.

Where your data goes: nowhere. Bokal transmits no data off your device. There is
no server, no cloud, and no account.

Local storage: your UI preferences and, if you use Pro cookie profiles, your
saved cookie snapshots are stored only on your device via chrome.storage.local;
Pro profiles can be encrypted at rest with a passphrase you set.

Third parties: none. We do not sell, share, or transfer any user data to anyone.

Payments (Pro): purchases are processed by ExtensionPay and Stripe; Bokal never
sees or stores your payment details, and no cookie data is shared with them.

Permissions: 'cookies' and host access are used solely to manage cookies for
sites you choose; 'storage' and 'unlimitedStorage' persist local preferences and
profiles on your device; 'sidePanel' renders the optional side-panel UI.

Changes: if data practices ever change, we will update this policy and disclose
it before the change takes effect.

Contact: yuvisbabbar@gmail.com

Limited Use: Bokal's use of information received from Chrome APIs and any user
data adheres to the Chrome Web Store User Data Policy, including the Limited Use
requirements.
```

**Also place this exact sentence visibly on the extension's homepage/landing page** (Google requires the affirmative Limited Use statement on the site, one click from home):
> *"Bokal's use of information received from Chrome APIs and any user data adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements."*

### 6b. CWS "Data collected" checkboxes — check EXACTLY THREE (corrected 2026-07-14)
| Category | Check? | Reason |
|---|---|---|
| **Authentication information** | ✅ **YES** | Google's definition = "logins, passwords, and authentication cookies"; Bokal reads/edits auth cookies |
| **Website content** | ✅ **YES** | Google's definition literally lists "cookies" as website content |
| **Personally identifiable information** | ✅ **YES** (corrected) | ExtPay stores the Pro buyer's **email** in `chrome.storage.sync` after purchase — verified against the live API. Ticking this is not optional. |
| Health information | ❌ No | — |
| Financial and payment information | ❌ No | Handled by ExtPay/Stripe as processors, not by Bokal |
| Personal communications | ❌ No | — |
| Location | ❌ No | — |
| **Web history** | ❌ **No** | Bokal logs no domains visited — do NOT check even though reviewers associate cookies with tracking |
| **User activity** | ❌ **No** | Bokal logs no clicks/keystrokes/actions |

### 6c. Collected / Transmitted (yes/no)
- **Collected (handled locally):** YES for Authentication information + Website content + PII
  (the Pro buyer's email, stored by ExtPay in `storage.sync`) — because "handle" includes
  local-only storage (login/auth functionality requires the disclosure even when nothing leaves
  the device).
- **Transmitted off device:** **NO** for cookie data / website content (enforced in code, asserted
  in E2E). **YES for licence data, including the Pro buyer's email — to ExtensionPay/Stripe, only
  if the user buys Pro.** Free users transmit nothing at all. Never certify "nothing is
  transmitted" on the CWS privacy tab.

### 6d. Three certification checkboxes — check ALL THREE (all true)
- ✅ "I do not sell or transfer user data to third parties, outside of the approved use cases."
- ✅ "I do not use or transfer user data for purposes that are unrelated to my item's single purpose."
- ✅ "I do not use or transfer user data to determine creditworthiness or for lending purposes."

### 6e. Single-purpose statement
> "Bokal is a cookie manager: it lets users view, add, edit, delete, search, import and export the cookies of the site they are working on. All data stays on the user's device."

### 6f. Per-permission justifications (paste verbatim)
- **`cookies`** — "Core and only function: read, create, edit and delete cookies for the site the user is managing. Without it the extension cannot work."
- **`storage`** — "Stores local UI preferences (dark mode, filters) and, for Pro users, named cookie profiles/snapshots. All data is kept on the device via chrome.storage.local; nothing is transmitted."
- **`sidePanel`** — "Provides the side-panel view so users can inspect and edit cookies next to the page they are working on."
- **`unlimitedStorage`** — "Lets Pro users keep more than a handful of local cookie profiles/snapshots without hitting the default 10 MB quota. Everything stays on the device; nothing is transmitted."
- **Host permissions (`optional_host_permissions: ["<all_urls>"]`)** — "The chrome.cookies API requires host access to read and write cookies for a domain. Bokal requests host access only at runtime for the specific site the user chooses to manage, never `<all_urls>` up front."

*Rationale (research):* The Aug-1-2026 "strictly-necessary" rule is a tailwind — cookies ARE Bokal's single purpose and nothing is transmitted, so Bokal is trivially compliant and turns the disclosure into a marketing asset. Re-affirm the policy + Limited Use statement on every publish, since certification is re-required each time.

---

## 7. Launch Checklist (account-bound — only the founder can do these)

- [ ] **ExtPay account** — register the extension at extensionpay.com; connect it to your **own Stripe** account (non-merchant-of-record; ~7–8% all-in take). Create the three products: Monthly $4.99, Annual $19.99, Lifetime $39 (set the $29.99 launch price for the first ~60 days), and set **Lifetime as default-selected**. *(DONE 2026-07-14 — live.)*
- [ ] **Stripe account** — complete Stripe onboarding as a Canada-based sole proprietor; confirm payout bank details and tax/identity verification.
- [ ] **Chrome Web Store developer account** — pay the one-time $5 registration fee; verify the publisher email.
- [ ] **Microsoft Edge Add-ons developer account** — register in Partner Center (no fee) for the Edge listing.
- [ ] **EU-DSA trader verification** — provide a **real business name, physical business address, email, and phone** in the CWS dashboard (required to remain distributed in the EU); expect it to be publicly displayed on the listing.
- [ ] **Host the privacy policy** — publish the §6a policy text at a stable public URL and paste that URL into the CWS dashboard privacy field; place the Limited Use sentence on the extension's homepage, one click from home.
- [ ] **(Recommended) Register the landing-page domain** and publish the open-source repo link before submission, so the trust claims are verifiable at review time.

---

### One-look decision summary
- **Tagline:** "Every cookie, under your control. Nothing leaves your device."
- **Pricing:** Monthly **$4.99** · Annual **$19.99** · **Lifetime $39** (launch **$29.99** for ~60 days) — **lifetime is the default-selected, featured offer**; 7-day full-Pro reverse trial triggered on saving/applying a second profile.
- **Free vs Pro:** Free keeps all CRUD/search/import-export/CHIPS/dark-mode (wins installs + trust); Pro gates only named local cookie profiles + optional passphrase encryption (converts the QA/dev ~1%).
- **Store title:** `Bokal - Cookie Editor & Manager (Open Source, No Tracking)`
- **Store summary (126 chars):** `Edit, add, view & delete cookies incl. HttpOnly. JSON/Netscape export, JSON import, CHIPS inspector. Open source, no tracking.`
