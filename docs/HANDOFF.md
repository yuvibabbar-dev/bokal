# Bokal — Session Handoff / Resume Point

**The single self-contained entry point for the next session.** Last updated: **2026-10-01 — see
§0 first: 106 users, $0; v1.1.0 LIVE since 09-07; the "launch never fired" narrative was WRONG (three
dead posts on 2026-07-16); store-search ranks and market sizes measured.** (Body sections below still read as of 2026-07-15 unless
§0 supersedes them.) (Note: git history was rewritten on 2026-07-14 — any commit SHA you remember or
find in older notes from before that date is INVALID. `git log` is authoritative.)

---

## 0. ⚠ STATE AS OF 2026-10-01 — READ THIS FIRST

### 2026-10-01 — measured state. Supersedes every "never posted" statement further down.

**Live:** v1.1.0 (since 2026-09-07) · **106 users** · 5.0★ / 2 ratings · $0 revenue · GitHub 0 stars,
1 fork, 0 issues · repo traffic last 14 days: 9 views / 6 uniques, referrers `bokal.dev` (2) and
DuckDuckGo (1) — **nothing from Reddit or HN.** The `bokal-v1-1-0-approval-watch` scheduled task did
its job on 09-07 and no longer exists.

**⚠ CORRECTION — Bokal IS LIVE on Microsoft Edge Add-ons.** https://microsoftedge.microsoft.com/addons/detail/bokal-cookie-editor-m/hoopoalcgejkjdpmgjlblilojhdfchhj
(id `hoopoalcgejkjdpmgjlblilojhdfchhj`). Every "not in the Edge store / status unknown" line below is
wrong, and was never properly verified: that store is JavaScript-rendered, and the 08-23 and 09-04
"checks" were a search-index query. Verified 2026-10-01 in a real browser and via
`microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/<id>`. State: **v1.0.2** (package dated
2026-07-15; approval date unknown), **2 active installs**, 0 ratings. It is STALE and needs the
founder in Partner Center (same 1.1.0 zip — no rebuild):
- still the original July description, including **"alarms … nothing is transmitted"** — the sentence
  the post-submission review found false (the Pro licence re-check contacts ExtPay) and fixed on
  Chrome; and "(launch price)" on the $29.99 line;
- old summary; no Netscape import (correct for 1.0.2, wrong once 1.1.0 lands);
- its privacy panel says "doesn't collect personal data", whereas the Chrome listing discloses the
  Pro buyer's email (ExtPay) — reconcile the Edge declaration with `docs/store/data-use-answers.md`.
Unlike the Chrome dashboard, Partner Center is an ordinary site, so the agent CAN drive it through
the founder's Chrome session if asked (upload + paste), with explicit permission.

**⚠ CORRECTION — the launch WAS fired, once, on 2026-07-16.** Everything below that says "nothing has
ever been posted" / "launch never fired" / "still nothing posted" was an inference from zero GitHub
stars that nobody checked. Found 2026-10-01 via `hn.algolia.com` and the pullpush Reddit archive:

| When (ET) | Where | Outcome |
|---|---|---|
| Thu 07-16 13:05 | HN item 48937187 (account created that day) | bare link to bokal.dev, **no "Show HN:"**, no comment → 1 point, 0 comments |
| Thu 07-16 13:17 | r/webdev | **removed by moderator** (Saturday-only sub) |
| Thu 07-16 13:19 | r/webdev, same account | duplicate → **removed by moderator** |

(Account handles and Reddit post ids are deliberately NOT recorded here — this repo is public. They
are in the agent's private project memory.) Attribution is inferred (titles are word-for-word from
the 07-16 kit) — not yet confirmed by the founder. Nothing found after 07-16. All three failed on mechanics, so they
are not evidence about the pitch. Consequences: Show HN is a legitimate **re**-submission (HN allows
it for stories with no attention) — use the prefix, link the repo, comment immediately
(`posts/04`); r/webdev is a second attempt on an account with two removals — Saturday, once
(`posts/03`). Posts 02/15/16 were rewritten: they had claimed "told nobody".

**Where the installs come from — CWS search rank, measured 2026-10-01** (en-US, first
server-rendered batch ≈ top 7–10 results; re-measure with the script pattern in this session's
history: curl `chromewebstore.google.com/search/<q>` and take `/detail/<slug>/<id>` order):

| Bokal ranks | Query |
|---|---|
| #2 | playwright cookies |
| #3 | playwright storagestate · partitioned cookies |
| #4 | open source cookie editor |
| #5 | edit httponly cookies |
| #6 | chips cookies |
| #7 | puppeteer cookies · cookie editor devtools |
| #8 | editthiscookie |
| **absent** | **cookie editor · cookie manager · edit cookies** · cookies.txt · export cookies · import cookies · netscape cookies · httponly cookie · samesite cookie · cookie inspector |
| **absent** | **cookie profiles · cookie profile switcher · switch accounts · account switcher · session switcher · multi login** |

Reading: Bokal exists only in the developer long tail, and every query it ranks for is a FREE
feature. The 56 → 106 climb began after 1.1.0 put "Playwright & Puppeteer" in the summary (timing
fits; causation unproven — the CWS dashboard's analytics would settle it). "editthiscookie" #8 comes
from the description alone, so description text does rank on low-competition terms.

**Market sizes (same day, by the store's own numbers):**

| Cluster | Who is there |
|---|---|
| "cookie editor" page 1 | Cookie-Editor 2,000,000 (410 ratings) · Cookie Editor 200,000 · CookieManager 60,000 · Easy Cookie Editor 10,000 (16 ratings) · two more at 7,000 / 5,000 with **9 and 3 ratings** |
| cookies.txt | Get cookies.txt LOCALLY 900,000 · Clean 30,000 · Cookie Exporter 10,000 |
| puppeteer cookies | Copy Cookies 50,000 · Export cookie JSON for Puppeteer 20,000 · StorageAce 20,000 |
| playwright cookies | cookie-use 129 · **Bokal 106** · Cookie Brother 1,000 · Playwriter 20,000 |
| profiles / account switching (what Pro sells) | SessionBox One 10,000 · SessionHub 4,000 (paid) · CookieSwapper 2,000 · Cookie Profile Switcher 398 — all but one free |

Three conclusions. (1) **Page one for "cookie editor" is reachable on installs, not ratings** — two
listings sit there with 3 and 9 ratings; the bar is a few thousand users. (2) **The category is
free.** Of ~45 listings across these searches, the store's in-app-purchase flag appears on four — Bokal
itself and three others, the largest at 4,000 users. (3) **The niche Pro sells into is small and served free.** The July notes'
"CookieJar Pro-gates automation export at 10k users" could NOT be reproduced — the closest match
today has 89 users. Do not lean on it.

**Money, plainly.** ~50 installs in 24 days ≈ 2/day ≈ 60/month. One lifetime sale nets ≈ $27 after
ExtPay (5%) and Stripe. At 1% conversion that is ≈ $16/month. P(zero sales | 106 installs) is 59% at
0.5%, 35% at 1%, 12% at 2%, 1% at 4% — so $0 now rules out the optimistic end and is still what the
realistic range predicts. **Nothing is malfunctioning; the funnel is ~30× too small and is
acquiring for the free product.** One-time pricing means revenue tracks NEW installs: even page one
for "cookie editor" (say 1,000 installs/month) is ≈ $270/month at 1%.

**The paywall as a free user meets it** (read from `components/UpgradeButton.tsx` + `App.tsx`): a
header chip "★ Unlock Pro" and a bottom button "★ Unlock Pro — cookie profiles". No explanation, no
preview, no trial, no price. A click goes straight to ExtPay's external page. `ProfilesPanel` never
loads for a free user, so nobody can try a profile. **ExtPay mints a user key on that first click,
before payment — so the ExtPay dashboard's user count ≈ "people who tried to buy". That number is the
missing diagnostic: ~0 means nobody wants/notices Pro (pitch problem), several-with-0-paid means
price/checkout.** Asked the founder for it 2026-10-01.

**Demand evidence for the paid feature (added later on 2026-10-01, after the founder confirmed zero
paid customers).** (a) The checkout is alive: `extensionpay.com/extension/bokal-test/api/v2/current-plans`
returns $4.99/month, $19.99/year, $29.99 once — so the payment path is not the reason. (b) In
Cookie-Editor's public tracker — 184 issues over eight years, 2M users — **not one issue asks for
saved cookie profiles or account switching.** The largest theme by far is import/export (≈45 issues;
the most-upvoted open one is "Import all cookies of all sites at once"), which Bokal already gives
away. (c) Cookie-Editor itself earns from **in-extension ads** (`interface/lib/ads/`), not sales.
Read together with the store data above: there is no public evidence that people pay for cookie
profiles, and reasonable evidence that they do not look for them.

**Proposed to the founder (awaiting a yes — extension change):** stop guessing and run one experiment
that settles it. (1) v1.2 makes the paywall legible: a Profiles card every user sees, worded for the
audience that actually installs (test accounts / Playwright), the price shown before any click, one
profile free, the second + encryption Pro; optionally "export a saved profile as storageState" to tie
Pro to the reason people install. Costs one promise: the Pro chunk would load for a free user who
opens Profiles (still zero network calls), so "never loaded for free users" must be reworded in
README/site/posts and `check:bundle` kept as a split guard. (2) One post that stays up. (3) Decision
rule agreed in advance: **if the next 300 installs after 1.2 produce no sale, profiles are not worth
charging for** (0 of 300 rejects a 1% conversion at 95%) — then make Bokal fully free, drop ExtPay
(which also removes the PII disclosure and makes "zero network calls" unconditional), and stop
spending time on monetization.

**⚠ PARKED, UNCOMMITTED EXTENSION WORK IN THE TREE (since 2026-09-07 21:21–21:32):**
`lib/io/export.ts` + `netscape.ts` + three test files — `toNetscape` emits `#HttpOnly_`. `lib/io`
suite passes (49). Deliberately not committed: the note under POST-PUBLISH CHECKLIST below records
that **wget, aria2 and Python < 3.10 silently DROP a marked cookie**, a regression for the wget
workflow the site documents. **Do not build a release from this tree without deciding that** —
`pnpm build && zip` would ship it. Needs a founder decision (ship with copy changes, make it an
option, or discard).

**Open, in order of expected value (all FOUNDER unless noted):**
1. ExtPay dashboard → users vs paid (2 min). Decides whether a paywall-pitch change is worth building.
2. Edge: upload the 1.1.0 zip + paste `DESCRIPTION-paste-v1.1.md` in Partner Center (listing is live
   but on 1.0.2 with a false privacy sentence — see the correction above). Then add an "Add to Edge"
   link to the site and README, and lift the Edge caveat in `posts/README.md`.
3. Featured-badge nomination — One Stop Support is trialing developer nominations; Bokal meets the
   listed eligibility (extension, owned, English, public, no violations, core features free).
4. Re-post properly: r/chrome_extensions (`posts/01`), then the real Show HN (`posts/04`).
5. (AGENT, needs approval — extension change) v1.2: put a real pitch in the panel — what a profile
   is, a locked preview or one free profile, and the price — so a traffic spike meets a paywall that
   can convert. Gate on the ExtPay number.

---

### 2026-09-04 block (history) — v1.1.0 release record

### v1.1.0 — UPLOADED TO CWS AND SUBMITTED FOR REVIEW (founder, 2026-09-04 ~22:45)

**Status: ✅ LIVE on the Chrome Web Store as of 2026-09-07 — post-publish checklist DONE by the scheduled task.**
(Historical: zip AND description both submitted by the founder, 2026-09-04 ~22:45 and ~23:05.)
The description went in as a second submission a few minutes after the zip (it was initially
forgotten); `DESCRIPTION-paste-v1.1.md` is what was pasted.
**⏰ A LOCAL SCHEDULED TASK NOW OWNS THE FOLLOW-UP:** `bokal-v1-1-0-approval-watch`
(`~/.claude/scheduled-tasks/bokal-v1-1-0-approval-watch/SKILL.md`), every 2 hours while the Claude
desktop app is open (catches up on next launch if it was closed). Each run: curl the public listing →
if not 1.1.0, stop; if 1.1.0 and bokal.dev still says "Export only", run the whole POST-PUBLISH
CHECKLIST (flip caveats, README, HANDOFF, memory, push main, redeploy gh-pages, verify), then disable
itself. **Do not run the checklist by hand without first checking whether the task already did it**
(`curl -s https://bokal.dev/export-cookies-txt-chrome.html | grep -c "Export only"` → 0 = done).
The in-session Monitor that previously watched the listing was stopped in favour of this. Public listing still serves 1.0.2 until
Google approves (typically 1–3 days; the live version stays up throughout). The public listing page
is the approval signal — when it shows `1.1.0`, run the POST-PUBLISH CHECKLIST below immediately,
because 18 files go false that moment. **Gotcha learned:** Chrome forbids extensions from scripting
any Web Store page ("The extensions gallery cannot be scripted"), so the agent cannot drive the CWS
dashboard via Claude-in-Chrome; the working pattern is `pbcopy` the text → founder pastes.


**MERGED to `main` as `909855f` (2026-09-04)** — branch `release/v1.1.0` deleted. Commits `59ff441`
feat, `a869c03` release, `6832a3f` docs. `main` now == the 1.1.0 build; the store is still on 1.0.2
until the founder uploads. Scope, as approved: **Netscape
`cookies.txt` import** (incl. curl's `#HttpOnly_` marker) + **store summary now names Playwright &
Puppeteer** and says "Import/export JSON & Netscape". Nothing else. No paywall, trial or entitlement
changes. Written test-first.

**Verification record (all on this branch, 2026-09-04):**

| Layer | Result |
|---|---|
| `tsc --noEmit` | clean |
| Unit (`pnpm -r test`) | **28 files / 146 tests passed** (was 27 / 128) |
| `build` (publishable) | clean, 342 kB |
| `check:bundle` | Pro isolated in `ProfilesPanel-*.js`; App chunk clean |
| Zip manifest | v1.1.0 · summary 130/132 · **no `host_permissions`** · no `tabs` · CSP intact · LICENSE + THIRD-PARTY-NOTICES inside · Netscape parser present in App chunk |
| E2E vs normal build | 2 passed, 4 skipped (by design) |
| E2E vs E2E build | **5 passed** — full CRUD on a real site, real ExtPay purchase unlocks Pro + lazy chunk, encrypted profile restore, wrong-passphrase-destroys-nothing |

**The upload artifact:** `apps/cookie-manager/.output/bokalcookie-manager-1.1.0-chrome.zip` (113.9 kB).
⚠ `.output/chrome-mv3/` currently holds the **E2E build** (host_permissions granted) — never load or
zip from that directory; the zip above was built from the normal build BEFORE the E2E stage and
re-verified afterwards.

**To ship (FOUNDER, one dashboard session):** upload the zip AND paste
`docs/store/DESCRIPTION-paste-v1.1.md` as the description in the same session — that text claims
Netscape import, which is only true once 1.1.0 is live. (Already merged to `main`.)

**POST-PUBLISH CHECKLIST — ✅ COMPLETED 2026-09-07 by `bokal-v1-1-0-approval-watch` (task now disabled).**
All the caveats listed below were flipped, `README.md` + `docs/store/*` updated, `main` pushed and
`gh-pages` redeployed. Kept here as the record of what was touched. Original text: every "Netscape is export-only"
caveat becomes false. Flip all of them — 18 files: `site/editthiscookie-alternative.html`,
`site/export-cookies-playwright.html`, `site/export-cookies-txt-chrome.html` (2 places, incl. the
FAQ), `docs/business/posts/01,02,03,04,05,06,07,08,09,10,11,12,13` + `posts/README.md`,
`docs/store/listing.md`, `docs/store/DESCRIPTION-paste.md` (retire it in favour of the v1.1 file).
Also update the README's io bullets and redeploy `gh-pages`. **STILL OPEN — follow-up feature (extension change, founder's call):** `toNetscape` still
does not emit `#HttpOnly_`, so HttpOnly is the one field that does not survive an export→import
round trip; emitting the marker is the fix. **Reader set, verified 2026-09-07 against source and
by running the tools:** curl (>= 7.24), yt-dlp/youtube-dl, Python `MozillaCookieJar` **>= 3.10
only**, Go `cookiestxt`. **wget does NOT read it** — its `src/cookies.c` has no occurrence of
"httponly" and skips every `#` line — and neither do aria2 or Python < 3.10 (macOS system
`/usr/bin/python3` is 3.9.6). Those readers silently DROP a marked cookie rather than mis-parse it,
which is a real regression for the wget workflow the site documents at
`site/export-cookies-txt-chrome.html` (wget is in its title, standfirst and a worked example, and
on the index.html card). Shipping the marker needs a release-note sentence and a copy revision.

### Distribution — the actual problem, restated with today's numbers

**Store count: 56 users on 2026-08-26 → 56 users on 2026-09-04. Flat for nine days.** The organic
store-search curve that carried 13→56 in four days has stopped. It was never going to compound
forever — store search only surfaces you to people already looking for a cookie editor. Only
promotion moves the number from here.

**Still 0 GitHub stars → still nothing posted.** (1 fork appeared — someone found the repo.)
**[CORRECTED 2026-10-01 — wrong. Three posts went out on 2026-07-16; see the top of §0.]**
Every dated slot on the posting calendar has now passed: r/chrome_extensions (Aug 26), r/SideProject
(Aug 27), r/webdev Showoff Saturday (Aug 29), r/opensource (Aug 30), r/coolgithubprojects (Aug 31),
r/software (Sep 2), **Show HN (Sep 3)**. Product Hunt (Sep 8) is the only one still ahead.
The calendar in the reddit map has been rewritten as **relative days** — it is no longer re-dated,
because a calendar nobody executes is not made truer by moving it.

**Price clock:** the old docs pointed at ~2026-09-13 for $29.99→$39. **Deferred** (see below); with
56 installs and $0 there is no data behind a raise. Nine days out — do nothing.

**Edge:** submitted 2026-07-15, still not in the Edge store as of 2026-09-04, still unverified.
**[CORRECTED 2026-10-01 — wrong; it is live at v1.0.2. See the top of §0.]**

---

### (Previous §0, 2026-08-23 — retained for history)


**[CORRECTED 2026-10-01 — the next paragraph is wrong: one HN link and two r/webdev posts went out on
2026-07-16 and died within minutes. See the top of §0.]**

**The launch was never fired.** The kit was written 2026-07-16 and sat untracked on disk for five
weeks. Verified 2026-08-23: GitHub shows **0 stars / 0 forks / 0 issues**, and there were no commits
between 2026-07-15 and today. Nothing has ever been posted to HN, Reddit, Product Hunt, or anywhere
else.

**Live numbers (public, verified 2026-08-25):** **51 CWS users**, **5.0★ from 2 ratings**, v1.0.2,
listing last updated 2026-07-16. Every install is organic Chrome Web Store search — the listing
converts on impressions, it just has almost none. Trajectory: **13 → 26 (Aug 23) → 51 (Aug 25)**,
still with 0 GitHub stars, i.e. still zero promotion. Organic store-search demand alone is roughly
doubling it; this is the strongest signal in the project and it argues the product/listing is fine
and only distribution is missing.

**Revenue: $0.** Still *barely* not a signal, but it is getting closer to being one. 51 installs ×
a realistic 1–4% freemium conversion predicts 0.5–2 sales, so zero is at the edge of expected rather
than squarely inside it. Watch it: **if installs pass ~150–200 and revenue is still exactly $0, that
stops being noise** and the paywall/pricing genuinely needs looking at. The question "will anyone pay for Pro?" does not become
answerable until roughly **500–2,000 installs**. Do not re-cut pricing, the free/Pro line, or
features in response to the current zero.

**Resolved since the last handoff:** v1.0.2 IS uploaded and live (§5.3 said "upload 1.0.2" — done),
and the CWS listing's privacy URL already points at `bokal.dev/privacy.html` (§5.1c — done).

**Done 2026-08-23 (AGENT):**
- Committed the launch kit (`docs/business/2026-07-16-launch-copy.md`, `-reddit-map.md`) after
  revising it for August: removed 9 stale "Edge is in review" claims, removed 10 "$29.99 rising to
  ~$39" urgency claims, reframed the Dec-2024 delisting as history.
- **Source audit of every factual claim in the copy.** Manifest, CSP, crypto params (AES-GCM 256 /
  PBKDF2 600k), and all five cited source paths verified correct. **Found and fixed one real
  overclaim in 9 places: the kit advertised "Import/export: JSON, Netscape, …". Bokal EXPORTS
  Netscape but does NOT import it** (`lib/io/export.ts` has `toNetscape`; `lib/io/import.ts` has no
  Netscape parser; §5.8 lists Netscape import as deferred). The manifest description was always
  correct ("JSON/Netscape export, JSON import") — only the launch copy was wrong. Copy now states
  export and import sets separately everywhere.
- Built `docs/business/posts/` — six paste-ready, per-venue files. **Pricing stripped from the
  r/webdev post** (Rule 3: commercial promotion = ban there).
- Wrote the missing **r/SideProject** post (the kit had none, though the map lists it GREEN).
- Recalculated the posting calendar to live dates, Reddit-before-HN.

**Open, blocking the announce — FOUNDER:**
1. **Post.** Day 1 = r/chrome_extensions. Originally Tue 2026-08-25 — **that day passed unposted
   (0 GitHub stars at 21:07)**; slipped to **Wed 2026-08-26**. Copy is in `docs/business/posts/`.
   Nothing else on this list matters until this happens.
2. **Edge:** submitted 2026-07-15 "under review ~7 business days"; five weeks on, Bokal does not
   appear in the Edge store. Check Partner Center — rejected, stalled, or unindexed. Until then no
   post may claim Edge availability (all such claims have been stripped from the copy).
3. **Price clock: DEFER.** Docs had $29.99 → ~$39 around 2026-09-13 on autopilot. Raising a price
   with 26 installs and 0 conversions is tuning against noise. Revisit after real traffic.

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
  on the public listing page) — the parked bokal.dev never threatened the review. bokal.dev is now
  fully live (§1 site block); swap the listing URLs to it in the same dashboard visit as the
  1.0.2 upload.
- **Quality bar:** 27 unit test files / 128 test declarations (docs previously said 124–125; recounted
  2026-08-23) · tsc clean · build + `check:bundle` guard · zip
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
  - ✅ **bokal.dev CUSTOM DOMAIN LIVE 2026-07-15:** founder added the four GitHub A records + www
    CNAME at Porkbun; agent redeployed `gh-pages` WITH the `CNAME` file (order honored: DNS first).
    Verified: `http://bokal.dev/` → 200 from GitHub.com, and `yuvibabbar-dev.github.io/bokal/*` now
    301-redirects to bokal.dev — so the github.io privacy URL in the CWS listing keeps working.
    HTTPS serves once GitHub's Let's Encrypt cert provisions (~minutes after CNAME deploy).
  - `https://bokal.dev/` (landing; Limited Use statement on the page)
  - `https://bokal.dev/privacy.html` (canonical privacy URL)
  - REMAINING for FOUNDER: Settings→Pages → confirm custom domain shows `bokal.dev` (auto-set by
    the CNAME file) and tick **Enforce HTTPS** once available; swap the CWS listing Homepage +
    Privacy URL fields to bokal.dev at the next dashboard visit (no rush — the 301 covers it).
  - To republish: copy `site/*` (INCLUDING `CNAME` from now on) + `.nojekyll` into a fresh checkout
    of `gh-pages` and push (source of truth for content is `site/` on `main`).

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
> **Full manual QA PASSED 2026-07-15 (founder, store build) — including QA #1: the per-site grant
> prompts for the specific site.** Every listing claim is now human-verified in production.
>
> STILL OPEN, founder-only: item 4 (Edge — submit the **1.0.2 zip** so both stores carry the
> identical, MPL-complete artifact); upload 1.0.2 to CWS (normal update; current version stays
> live during review); item 5 (lifetime $29.99 → ~$39 around **2026-09-13**, 60 days from
> publish); item 6 (announce only after §5.1 namespaces + USPTO).

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
   185.199.108–111.153, and `www` CNAME → yuvibabbar-dev.github.io — **✅ DONE 2026-07-15
   (founder)**; (b) AGENT redeployed `gh-pages` WITH the CNAME after DNS resolved (the do-DNS-first
   order was honored) — **✅ DONE 2026-07-15**, full chain verified: apex + www → 200 over HTTPS
   with the store link on the page, github.io/bokal/* → 301 → bokal.dev (listing's privacy link
   unbroken). **LAST CLICK for FOUNDER:** Settings→Pages → tick **Enforce HTTPS** (cert is
   provisioned, the box should be available); (c) FOUNDER updates the CWS listing's Homepage + Privacy URL fields to
   bokal.dev (the old github.io 301-redirects, so not breaking); (d) still TODO: npm `bokal`
   (available), GitHub org `bokal-dev`/`bokalhq` (available), social handles; CWS "Official URL" via
   Search Console domain verification of bokal.dev. `.app`/`.io`/`.sh`/`.co`/`.tools` all still free.
2. **USPTO knockout search** for BOKAL/BOKALL/BOCAL, Classes 9+42 (tmsearch.uspto.gov or an attorney,
   $300–800). All prior screening was search-index-derived, NOT a register pull.
3. **Manual QA checklist** — ✅ **DONE 2026-07-15.** The founder ran the FULL
   `docs/pre-launch-qa.md` against the STORE build and everything passed — **including item #1:
   the per-site activeTab grant prompts for the specific site (verified in a real browser).** The
   minimal-permissions store claim is now human-verified end to end; the live-payment test the
   same day proved checkout/entitlement. No findings. (v1.0.1 = MPL-notice zip, built but never
   uploaded — SUPERSEDED by v1.0.2. **v1.0.2 IS UPLOADED AND LIVE** since 2026-07-16; verified on the
   public listing 2026-08-25. Nothing is pending at the Chrome Web Store.)
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
pnpm -r test                                               # unit (27 files / 128 cases)
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

- **⚠ THE REPO LIVES ON iCLOUD-SYNCED DESKTOP — this fakes test failures.** `FXICloudDriveDesktop`
  is `1`, so `~/Desktop/Projects/...` (including `node_modules`) is synced. Measured 2026-08-23:
  `pnpm install` **11m32s**; `pnpm -r test` **375s of which 254s is vitest "prepare" and only 475ms
  is actual test execution**; `brctl status` hangs. Worst part: iCloud stalls a `readFileSync` of a
  `.json` during CJS module load and vitest reports `ETIMEDOUT: connection timed out, read` — **2
  test files silently fail to LOAD** (25 of 27 files ran, 121 of 128 cases), the run exits 1, and it
  looks exactly like a real regression. It is not. **GitHub Actions CI runs the identical suite
  green in 1m15s.** Before debugging any local test failure, check whether it is this. Real fix:
  move the repo off `~/Desktop` to a non-synced path.

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
