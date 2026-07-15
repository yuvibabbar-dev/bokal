# Bokal — Launch & Distribution Plan

**Date:** 2026-07-14 · **Status:** DRAFT, pre-approval. Distribution — not product — is the
binding constraint on Bokal's outcome (category leader has ~2M users and charges $0; a new listing
starts with zero ranking signal). This plan is the counterweight. Nothing here runs until the
gates pass.

---

## 0. Hard gates — announce NOTHING before all of these

1. **CWS approval** + founder installs from the store and confirms live checkout (HANDOFF §4.1).
2. **bokal.dev resolves + HTTPS enforced** (HANDOFF §5.1 — DNS → gh-pages CNAME → Pages custom
   domain, in that order).
3. **Namespaces locked:** npm `bokal` published, GitHub org, social handles (HANDOFF §5.1d).
4. **USPTO knockout search done** (HANDOFF §5.2) — do not make the name loud before clearing it.
5. **Manual QA #1 passed** (per-site grant prompt confirmed in a real browser) — every headline
   below leans on the "minimal permissions" claim; verify it before amplifying it.

## 1. The one story

**"The cookie manager you can actually verify."** EditThisCookie (reported ~3M users) was delisted
in Dec 2024 and a credential-stealing copycat took its name — the category's trust problem is
documented news, not marketing spin. Bokal is the open-source answer: no `tabs` permission,
per-site grants, zero network calls for free users, every line published. Each channel below gets
this story in its own dialect; nobody gets a press release.

Supporting proof points (all literally true, keep them that way): 125-test suite + E2E in CI,
GPL-3.0, no telemetry, prices identical to checkout, HttpOnly + CHIPS support the incumbent lacks.

## 2. Channel sequence

**Day 0 (approval day)** — HANDOFF §4 launch-day checklist verbatim: store self-install test, swap
the site CTA to the store URL, README status, submit the same zip to Edge Add-ons, start the
60-day price clock (lifetime $29.99 → ~$39 around 2026-09-14).

**Days 0–3 — quiet soak.** Watch the first organic installs, store reviews, and GitHub issues;
fix anything fast (version bump → new zip → normal update review). Ask a handful of real users to
try it and leave an **honest** review if they find it useful — never incentivized, never scripted
(incentivized reviews are a CWS ban trigger).

**Week 1 — Show HN** (the highest-leverage single post for this audience):
- Title shape: `Show HN: Bokal – open-source cookie manager with per-site permissions`
- First comment = founder story: the EditThisCookie takedown + copycat, why trust requires
  published source and minimal permissions, what free vs Pro is (be upfront about pricing — HN
  respects candor and punishes discovery-of-a-paywall).
- Weekday morning ET; clear the day to answer every comment. Link the site (it links store + repo).

**Weeks 1–2 — Reddit**, one native post per community, author disclosed, no cross-paste:
- r/webdev, r/QualityAssurance (the actual Pro buyers: test-account switching, storageState),
  r/chrome_extensions. r/privacy only with the open-source/local-first angle led honestly —
  mention Pro exists; that community torches stealth monetization.

**Week 2 — Product Hunt.** Modest expectations for dev tools; the assets already exist (store
screenshots, promo tiles, tagline). Maker comment = the same founder story.

**Week 2+ — standing surfaces (compounding, do once):**
- **AlternativeTo**: create/claim the Bokal entry, add it as an alternative to EditThisCookie and
  Cookie-Editor — permanent high-intent traffic from people literally searching for a replacement.
- **Site SEO pages**: "EditThisCookie alternative", "Cookie-Editor alternative", and (post-M8)
  "export cookies for Playwright/Puppeteer" — the three highest-intent queries we can own.
- **Launch essay** on the site + dev.to: "What the EditThisCookie takedown taught us about browser
  trust" — the narrative artifact everything else links to.
- **GitHub**: repo topics (chrome-extension, cookies, manifest-v3, devtools, privacy), pinned
  repo, CI + store badges in README.
- **Targeted outreach (polite, no payment):** the security YouTubers/writers who covered the
  EditThisCookie copycat story (e.g., Eric Parker, gHacks) — "an open-source successor now exists"
  is a legitimate follow-up to their own coverage.

## 3. Post-launch cadence (maintenance-as-a-feature)

Ship **M8/v1.1 within ~2–4 weeks of approval** (export/import-all, storageState interop, CHIPS
all-view fix, native per-site grant chip) and announce it in release notes — the incumbent's
visible stagnation is our wedge, so our shipping rhythm must be visible: changelog page on the
site, release notes on GitHub, a line in the store description's "What's new".

Respond to **every** store review and issue. Review velocity (count × average × recency) is a
ranking input; responsiveness is also the cheapest trust proof we have.

## 4. Measurement (no telemetry, by design — measure at the edges)

Weekly snapshot in a private note (not this repo): CWS stats (impressions, installs, uninstall
rate), ExtPay dashboard (upgrades by plan, later trial starts), GitHub stars/traffic/issues.
No analytics on the extension ever; keep the site script-free too — the "no tracking" claim is
load-bearing everywhere. Decision checkpoints: at +30 days pick the M9 scope from real data; at
+60 days raise lifetime to $39 (update checkout AND listing AND site the same day — prices must
match everywhere, HANDOFF §6).

## 5. Do-nots (each one is a policy or trust tripwire)

- No competitor names in the store **title/summary** (impersonation trigger; description prose is
  fine and already handled). No keyword stuffing.
- No incentivized or exchanged reviews, ever.
- Never phrase the privacy claim as "nothing is transmitted" (Pro licence checks exist) — the
  correct line is "free users make zero network calls; cookie data never leaves your device."
- No uninstall-survey URL (`setUninstallURL` is itself a network call — it would falsify the
  zero-calls claim).
- Don't announce before the §0 gates — a launch spike onto a parked domain or an unverified
  permission flow burns the one first impression the trust story gets.
