# Bokal — Session Handoff / Resume Point

**The single self-contained entry point for the next session.** Last updated: **2026-07-14, post
store submission.** (Note: git history was rewritten on 2026-07-14 — any commit SHA you remember or
find in older notes from before that date is INVALID. `git log` is authoritative.)

---

## 1. Where things stand (verified ground truth)

- **Product:** "Bokal" (renamed from "Wafer" — a funded YC startup owns that name) — a complete MV3
  Chrome/Edge cookie manager. Free tier = full cookie CRUD/search/rules/cleanup/import/export/CHIPS/
  DevTools panel. Pro = named local cookie profiles + optional AES-GCM passphrase encryption.
- **Repo:** `/Users/yuvibabbar/Desktop/Projects/chrome_extensions/bokal` — **public** at
  `github.com/yuvibabbar-dev/bokal`, branch **`main`**, license **GPL-3.0-or-later** (forced by
  bundled AGPL ExtPay; see `docs/licensing-notes.md`).
- **Status: LIVE on the Chrome Web Store — approved and published 2026-07-15.**
  Listing: <https://chromewebstore.google.com/detail/bokal-cookie-editor-manag/oidemgbbhocfepdadkmfdlbjgdcjdldd>
  (extension id `oidemgbbhocfepdadkmfdlbjgdcjdldd`, v1.0.0). Trader verification still pending
  (listing shows the "non-trader" label until Google processes it; does not block anything).
  **Resolved 2026-07-15:** the live listing's privacy link is the WORKING github.io URL (verified
  on the public listing page) — the parked bokal.dev never threatened the review. Move the listing
  URLs to bokal.dev only after DNS + CNAME + custom domain are live, ideally bundled with the
  1.0.1 update.
- **Quality bar:** 125 unit tests (124 at submission; +1 openRestore coverage added in the
  post-submission review) · tsc clean · build + `check:bundle` guard · zip
  113 KB with LICENSE.txt + THIRD-PARTY-NOTICES.txt inside · Playwright E2E green on BOTH build
  variants (incl. full CRUD-through-UI against a real site, the real ExtPay purchase sequence against
  a mocked backend, and wrong-passphrase-destroys-nothing) · **CI green on GitHub Actions** (runs on
  every push to `main`: tsc, tests, build, bundle guard, E2E under xvfb).
- **Payments: LIVE.** ExtPay app id `bokal-test` (id is permanent — the display name is "Bokal",
  which is what customers see; do NOT change the id, it would orphan licenses). Stripe connected
  LIVE. Plans: **$4.99/mo · $19.99/yr · $29.99 one-time (launch price; raise to ~$39 after ~60
  days — around 2026-09-13, 60 days from the 2026-07-15 publish).** ExtPay auto-selects test mode for unpacked installs (test card
  4242 4242 4242 4242) and live mode for store installs — one app id serves both; never use a real
  card for testing.
- **Site: LIVE** via GitHub Pages from the **`gh-pages` branch** (branch-based Pages, NOT the
  Actions route — the repo's Actions token can't create Pages sites):
  - ⚠ **bokal.dev DNS IS NOT CONFIGURED (verified 2026-07-14 late):** the apex resolves to Porkbun
    PARKING IPs (207.207.210.x) and HTTPS does not answer; `.dev` is HSTS-preloaded, so browsers
    have no HTTP fallback. Until §5.1(a) is done, the ONLY working origin is
    `https://yuvibabbar-dev.github.io/bokal/`.
  - `https://bokal.dev/` (landing; Limited Use statement on the page) — target state, dead until DNS
  - `https://bokal.dev/privacy.html` — target state. RESOLVED 2026-07-15: the live listing links
    the github.io privacy URL (verified on the public listing page), so DNS is NOT review-critical
    — it now gates only the §5.1 chain (custom domain, official-URL verification, announce).
  - To republish: copy `site/*` + `.nojekyll` into a fresh checkout of `gh-pages` and force-push
    that branch (source of truth for content is `site/` on `main`).

## 2. How to resume

1. Read this file. `docs/build-log.md` = per-milestone history; `git log` = authoritative.
2. Verify state before changing anything:
   ```bash
   cd /Users/yuvibabbar/Desktop/Projects/chrome_extensions/bokal && pnpm install \
     && pnpm -r test && pnpm --filter @bokal/cookie-manager exec tsc --noEmit \
     && pnpm --filter @bokal/cookie-manager build \
     && pnpm --filter @bokal/cookie-manager check:bundle
   ```
3. Likely next events and what to do:
   - **"Approved / it's live"** → follow §4 LAUNCH DAY checklist.
   - **"Rejected / reviewer question"** → read the rejection text; the usual causes for cookie
     extensions are permission-justification gaps — the prepared answers live in
     `docs/store/permission-justifications.md` and `docs/store/data-use-answers.md`. Fix, bump the
     version in `apps/cookie-manager/wxt.config.ts`, rebuild, re-zip, re-upload.
   - **"Build feature X"** → plan under `docs/design/plans/`, branch off `main`, TDD, whole-branch
     review, merge. Deferred list in §5.

## 3. What happened in the last two sessions (compressed)

Rename Wafer→Bokal everywhere (code, docs, dir, git history rewritten to strip tool trailers — old
SHAs invalid). GPL-3.0 adopted (LICENSE + THIRD-PARTY-NOTICES; also shipped INSIDE the zip + in-panel
Source/License/Notices footer). Repo pack (README/CONTRIBUTING/SECURITY) + landing page + privacy
policy written, deployed. Logo: amber "cookie disc with flat edge" on graphite (concept in
`docs/design/specs/2026-07-13-bokal-brand-design.md`). Store prep hardened by an adversarial audit,
which caught: manifest title/summary are what CWS uses (set the SEO title there), a would-have-been
FALSE data-use certification (now scoped: cookie data never transmitted; Pro buyer's EMAIL is stored
by ExtPay in storage.sync → PII box ticked), listing said "coming soon" for a live paid tier (fixed +
prices matched to live checkout), all screenshots were blank (regenerated: 5 real frames via the
tab-binding technique), no restore-purchase path (built: `Billing.openRestore()` → ExtPay
`openLoginPage`, "Restore purchase" + "Manage subscription" UI, TDD), promo tiles created
(440x280 + 1400x560, 24-bit no-alpha), CI was silently never running (trigger said `master`, branch
is `main` — fixed, now green), per-site permission model, bundle-split CI guard
(`scripts/check-bundle-split.mjs`), E2E rebuilt to drive the real UI against a real site.

**Session 4 (2026-07-14 late) — tech-lead review + doc fixes:** found bokal.dev still PARKED (DNS
never added — see §1 warning; founder P0) and fixed the stale-doc landmines: `pro-monetization.md`
still said "swap the app id before launch" (would orphan licenses) + claimed the SW calls
`startBackground()`; business doc §6b still said PII=No / "exactly two" + pre-live prices;
`threat-model.md` §2.3b same startBackground drift. Test count now 125. Added
`docs/business/2026-07-14-launch-plan.md` (distribution was the missing artifact). Verified fresh:
tests/tsc/build/guard green locally, CI green on `main`, npm `bokal` still unclaimed. Market
analysis (session log): realistic year-1 gross $500–$6k; distribution, not product, is the
constraint; strongest validated Pro signal is automation/storageState interop, not profiles.

**2026-07-15: APPROVED + PUBLISHED** (day after submission). Verified live on the public listing:
v1.0.0, in-app purchases disclosed with the correct prices, github.io privacy URL (working),
"non-trader" label pending verification. Launch-day agent items executed same day — store URL
wired into `site/index.html` + README, `gh-pages` redeployed WITHOUT CNAME (bokal.dev still
parked), price-raise date fixed at ~2026-09-13.

## 4. LAUNCH DAY checklist (when CWS approves)

> **2026-07-15: APPROVED + PUBLISHED.** Agent-side items DONE the same day: item 2 (site CTA now
> links the live listing; `gh-pages` redeployed **without** CNAME — DNS still parked) and item 3
> (README status → live).
>
> **Item 1 CONFIRMED 2026-07-15: the founder made a REAL live payment (own card) on the store
> build and Pro unlocked** — live checkout + ExtPay + Stripe(live) + entitlement proven in
> production. Follow-ups: verify the charge sits in BOKAL's Stripe account, live mode (not another
> app — remember the wafer-test/Couples-Companion mixup) and that ExtPay's dashboard checklist
> ticked; if the plan bought was monthly/annual, cancel the self-subscription via "Manage
> subscription" (keeping a LIFETIME one as the founder's QA license is recommended; refunding
> returns no Stripe processing fees and flips the license off).
>
> STILL OPEN, founder-only: the REST of `docs/pre-launch-qa.md` against the STORE build — above
> all the per-site grant, QA #1, which has STILL never been human-verified and real users hit it
> now; item 4 (Edge — submit the
> REBUILT zip so the MPL notice ships there from day one); item 5 (lifetime $29.99 → ~$39 around
> **2026-09-13**, 60 days from publish); item 6 (announce only after §5.1 namespaces + USPTO).

1. Install from the store yourself → confirm live checkout (no "Test mode" badge) → ExtPay's
   dashboard checklist ticks after the first live payment.
2. Update `site/index.html`: replace the disabled "Coming soon to Chrome" button with the real store
   URL → republish `gh-pages`.
3. Update `README.md` status block (pre-launch → live + store link).
4. Submit the SAME zip to **Edge Add-ons** (partner.microsoft.com; free, no rebuild).
5. Start the ~60-day clock to raise lifetime $29.99 → $39 (ExtPay dashboard).
6. Announce ONLY after the namespaces are locked (see §5 item 1).

## 4b. ⚠ CWS policy update (researched 2026-07-14) — ARE WE COMPLIANT? Yes, with one watch-item

Google announced new CWS policies **2026-07-01, enforced from 2026-08-01**
(developer.chrome.com/blog/cws-policy-updates-2026). Bokal already aligns — **do NOT change the
submitted zip** (that can reset the review). The changes and our status:

- **Stricter Limited Use / data minimization** ("data must be strictly necessary for the disclosed
  single purpose") — ✅ cookies are core; theme/rules are local. **WATCH-ITEM:** the Pro-buyer email
  (handled by ExtPay/Stripe, not by Bokal) is for the *optional paid feature*, not the cookie-manager
  single purpose. Framing is already defensible (privacy policy + data-use scope it to "Pro buyers
  only, via the payment processor, to provide the feature they bought"). If a reviewer questions it,
  answer with that framing; do NOT claim the email is part of the core purpose.
- **Prominent disclosure of all data collection** — ✅ dedicated hosted privacy policy, linked from
  listing + homepage, Limited Use statement present.
- **Proactively disclose post-install data-handling changes** — ✅ privacy policy "Changes" clause.
- **Manifest ↔ dashboard data categories ↔ privacy policy must MATCH** (the #1 rejection cause) — ✅
  aligned this session: permissions justified 1:1; dashboard ticks = Auth info + Website content +
  PII(email); policy discloses exactly those. Keep them in lockstep on any future change.
- Bans on real-money-prediction + AI-guardrail-circumvention extensions — N/A.

## 5. Open items (owner: FOUNDER unless marked AGENT)

1. **Namespaces:** `bokal.dev` **PURCHASED** (Porkbun, 2026-07-14, exp 2027-07-14). Code/docs already
   point at `https://bokal.dev` (manifest homepage_url, site links, CWS privacy URL); `site/CNAME`
   staged. **REMAINING:** (a) FOUNDER adds DNS at Porkbun — apex `bokal.dev` → four A records
   185.199.108–111.153, and `www` CNAME → yuvibabbar-dev.github.io; (b) once DNS resolves, AGENT
   redeploys `gh-pages` (now includes CNAME) and FOUNDER sets Settings→Pages custom domain =
   bokal.dev + Enforce HTTPS — ⚠ **ORDER IS LOAD-BEARING: do NOT push the CNAME to `gh-pages` (or
   set the Pages custom domain) before `dig bokal.dev` returns the four GitHub A records.** A
   configured custom domain makes github.io/bokal/* 301-redirect to bokal.dev immediately — done
   too early, it breaks the currently-working privacy URL mid-review; (c) FOUNDER updates the CWS listing's Homepage + Privacy URL fields to
   bokal.dev (the old github.io 301-redirects, so not breaking); (d) still TODO: npm `bokal`
   (available), GitHub org `bokal-dev`/`bokalhq` (available), social handles; CWS "Official URL" via
   Search Console domain verification of bokal.dev. `.app`/`.io`/`.sh`/`.co`/`.tools` all still free.
2. **USPTO knockout search** for BOKAL/BOKALL/BOCAL, Classes 9+42 (tmsearch.uspto.gov or an attorney,
   $300–800). All prior screening was search-index-derived, NOT a register pull.
3. **Manual QA checklist** `docs/pre-launch-qa.md` — ⚠ item #1 (the per-site activeTab grant
   prompt) has NEVER been confirmed in a real browser by a human. If it falls back to asking for
   all-sites access, the "minimal permissions" store claim weakens — check it.
4. **EU-DSA trader verification** — pending at Google; no action unless they ask for more info.
   (If offered individual vs organization: individual avoids the ~30-day D-U-N-S detour.)
5. (AGENT, post-launch) **Reverse trial (M13):** 7-day full-Pro on 2nd-profile trigger. Deliberately
   deferred until there is traffic to A/B against. Real expected lift is Verna's anecdotal 10–40%,
   NOT the debunked "60%". ExtPay supports trials natively (`openTrialPage`/`trialStartedAt`).
6. (AGENT, post-launch) **Entitlement hardening:** fail closed unless the install has EVER seen a
   successful ExtPay verification (`everVerified` flag) — kills the copy-paste one-liner forge while
   costing legit buyers nothing. Accepted truth: any client-side paywall remains patchable; if Pro
   revenue matters long-term, Pro needs a server-side component (sync/hosted backup).
7. (AGENT, optional) Split public repo concerns: `docs/business/` (pricing strategy) and internal
   ledgers are public — audit flagged as competitive-intel exposure; founder has implicitly accepted
   by going public, but slimming is still possible.
8. (AGENT, deferred features): Firefox port (WXT emits it; sidebar_action differs), Netscape import,
   popup-surface option, named-automation Pro suites, UI accent blue→amber migration, jar-shaped
   logo evolution (name means "jar"), default-on profile encryption decision.
9. **GitHub old-SHA purge (optional):** pre-rewrite commits may still resolve by direct URL until
   GitHub GC; Support can purge on request.

## 6. Critical invariants (do not regress — enforced where noted)

- **No `tabs` permission; no install-time `host_permissions`** — runtime per-site grant via
  `activeTab` + `optional_host_permissions:['<all_urls>']`. The `BOKAL_E2E=1` build adds
  host_permissions FOR TESTS ONLY; the published zip must never contain it. **Always check the ZIP,
  not `.output/chrome-mv3`** (which may hold the E2E build after running E2E).
- **Free users make ZERO network calls and zero off-device writes** — all ExtPay contact is gated by
  `lib/pay/engagement.ts`; no ExtPay construction at SW top. Asserted in `e2e/crud.spec.ts`.
- **Pro UI stays a code-split lazy chunk** — enforced in CI by `check:bundle`
  (`scripts/check-bundle-split.mjs`). Phrase it as "never fetched/executed for free users", NOT
  "free build ships zero Pro code" (there is one build; the chunk ships).
- **Cookie values: never logged** (`lib/security/redaction.test.ts` in CI), **rendered as text nodes
  only** (XSS regression test).
- **Profile crypto:** AES-GCM + PBKDF2 600k; `apply()` decrypts BEFORE removing — a wrong passphrase
  can never destroy cookies (also asserted in `e2e/pro.spec.ts`).
- **Trust copy must stay literally true against the code** — including: prices in listing == live
  ExtPay plans; the PII (email) disclosure stays as long as ExtPay is bundled; never certify
  "nothing is transmitted" on the CWS privacy tab.
- **`EXTPAY_APP_ID` is permanent post-launch.** Theme pref stays `storage.local` (not sync).
  `refresh()` seq-guards stay in cookies/entitlement stores.

## 7. Repo map (current)

```
apps/cookie-manager/
  entrypoints/  background.ts · sidepanel/ (App.tsx) · devtools/ · devtools-panel/
  lib/          cookies/ io/ pay/ (billing, engagement, entitlement, sync, config) profiles/
                rules/ security/ audit.ts permissions.ts review.ts site.ts origin.ts ...
  stores/       cookies-store · entitlement-store (upgradeError/restore) · rules-store · profiles-store
  components/   CookieRow/List/Editor · IoBar · SearchBar · GrantAccess · BlockRules · CleanupRules
                UpgradeButton (+Restore) · ManageBilling · ThemeToggle · pro/ProfilesPanel (lazy)
  e2e/          fixtures · smoke · granted · crud (real-site CRUD) · pro (purchase + profiles)
  scripts/      gen-icons.mjs · gen-screenshots.mjs (tab-binding, real cookies) · gen-promo.mjs
                · check-bundle-split.mjs (CI guard)
  public/       icon/{16,32,48,128}.png · LICENSE.txt · THIRD-PARTY-NOTICES.txt   (ship in the zip)
packages/       ui-kit (theme.css, useTheme — storage.local) · tsconfig
site/           index.html · privacy.html · styles.css · icon-128.png  → published via gh-pages branch
docs/           HANDOFF (this) · build-log · threat-model · pro-monetization · licensing-notes
                · pre-launch-qa.md (manual QA) · MORNING-REVIEW (historical)
docs/store/     listing · permission-justifications · data-use-answers · privacy-policy
                · submission-guide (field-by-field, current) · trader-verification-checklist
                · screenshots/ (5 × 1280x800) · promo/ (440x280 + 1400x560)
docs/design/    specs/ (incl. brand) · plans/ (11 milestone plans)
docs/business/  strategy docs (internal; public in repo — see §5.7)
.github/workflows/ci.yml   (tsc+tests+build+guard+artifact; e2e both variants; on: main)
```

## 8. Commands

```bash
pnpm -r test                                               # unit (124)
pnpm --filter @bokal/cookie-manager exec tsc --noEmit
pnpm --filter @bokal/cookie-manager build                  # normal build (publishable)
pnpm --filter @bokal/cookie-manager check:bundle           # free/Pro split guard
pnpm --filter @bokal/cookie-manager zip                    # -> .output/bokalcookie-manager-*.zip
pnpm --filter @bokal/cookie-manager e2e                    # E2E vs normal build (some specs skip)
pnpm --filter @bokal/cookie-manager build:e2e && BOKAL_E2E=1 pnpm --filter @bokal/cookie-manager e2e
pnpm --filter @bokal/cookie-manager exec node scripts/gen-icons.mjs        # icons
pnpm --filter @bokal/cookie-manager exec node scripts/gen-screenshots.mjs  # store screenshots (needs build:e2e)
pnpm --filter @bokal/cookie-manager exec node scripts/gen-promo.mjs        # promo tiles
```

## 9. Hard-won gotchas (do not relearn these)

- CWS listing title/summary come from the **manifest**, not dashboard fields.
- CWS images must be **24-bit PNG, NO alpha** (RGBA screenshots get rejected; generators already
  emit opaque RGB).
- Stripe "**Sandbox**" ≠ "**Test mode**": ExtPay test payments appear in the MAIN account with the
  Test-mode toggle ON — never inside a Sandbox.
- ExtPay: `fetch_user()` short-circuits to `{paid:false}` (NO network) when no
  `extensionpay_api_key` in storage.sync — seeding entitlement cache alone gets overwritten.
  Constructing `ExtPay()` writes an install marker to storage.sync — never construct it for free
  users. `startBackground()` is only a content-script relay — deliberately not called.
- The side panel binds to a tab via `tabs.query({active,lastFocusedWindow})` + re-reads on
  `tabs.onActivated` — that's how E2E/screenshots drive a REAL site (open panel page, then
  `site.bringToFront()`).
- Playwright label selectors: the editor's checkbox labels have a leading space (`" Secure"`) — use
  `getByRole('checkbox',{name:'Secure'})`.
- Quoted font names inside an HTML `style="..."` attribute terminate the attribute (gen-promo).
- Vitest here has no RTL auto-cleanup (`globals` off) — component tests call `cleanup()` in
  `beforeEach`, and `stores/**` is explicitly in the vitest `include`.
```
