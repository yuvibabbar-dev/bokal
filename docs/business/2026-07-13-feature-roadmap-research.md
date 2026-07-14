# Bokal — Post-M7 Feature Roadmap (evidence-based, payments excluded)

**Date:** 2026-07-13 · **Method:** deep-research harness — 5 search angles, 23 sources fetched, 113 claims extracted, top 25 adversarially verified (3 independent votes each): **20 confirmed, 5 refuted**. Effort sizes (S/M/L) are grounded in the actual Bokal codebase (post-M7, `master`), not generic guesses.

**Scope:** what to build next to move installs, retention, review velocity, and free→Pro conversion. Excludes payment/monetization mechanics (ExtPay wiring tracked in `docs/pro-monetization.md`).

---

## Bug found during this research (fix before v1.1 ships)

`getAllCookies()` in `apps/cookie-manager/lib/cookies/read.ts` calls `chrome.cookies.getAll({})`, and the API **defaults to unpartitioned cookies only** — so the M7 "all cookies" view (and anything built on it) silently omits CHIPS partitioned cookies. This is the exact bug class open against Cookie-Editor ([#249](https://github.com/Moustachauve/cookie-editor/issues/249), ~11 months unfixed, 0 `partitionKey` occurrences in their codebase). Fix: merge `getAll({})` with `getAll({ partitionKey: {} })` (any-partition query, Chrome 119+; dedupe by cookieId). Effort: **S**. The rest of Bokal's CHIPS handling (site view via `getPartitionKey`, write/import/keys) is already correct and ahead of every competitor checked.

---

## Tier 1 — Quick wins (proposed M8 / v1.1)

| # | Feature | Free/Pro | Effort | Moves | Evidence (verified 3-0 unless noted) |
|---|---|---|---|---|---|
| 1 | **Export + import ALL cookies across ALL domains** (real file download, per-cookie failure report) | Free | **S** | installs, reviews | The most persistent unmet ask at the ~2M-user incumbent: Cookie-Editor [#117](https://github.com/Moustachauve/cookie-editor/issues/117) (open since May 2023, their only enhancement-labeled open issue), [#305](https://github.com/Moustachauve/cookie-editor/issues/305) (Jan 2026, top-reacted open issue), and their partial export-all is broken/opaque ([#239](https://github.com/Moustachauve/cookie-editor/issues/239): silent clipboard copy, no file, no feedback). Bokal already has the all-cookies view, JSON/Netscape exporters, Blob download, and per-cookie import reporting — this is mostly wiring + the CHIPS fix above. |
| 2 | **Automation-framework interop:** export/import Playwright `storageState` JSON; export Puppeteer `setCookie` JSON + Playwright `addCookies` JSON | one-off exports **Free**; named automation profiles / storageState round-trip suites **Pro** | **S–M** | dev installs, **Pro conversion** | `storageState` is Playwright's officially recommended auth pattern (authenticate once → `.auth/user.json` → every test starts signed in). A single-purpose extension doing only this has 10k users / 4.6★; competitor CookieJar Pro-gates exactly this export. Caveat to scope honestly: `chrome.cookies` can't capture localStorage, so token-in-localStorage apps (Firebase/MSAL) round-trip partially; Playwright accepts `origins: []`. |
| 3 | **`chrome.permissions.addHostAccessRequest()` per-site grant chip** (Chrome 133+, feature-detected; keep current gesture flow as fallback) | Free | **S** | retention, first-run conversion | The platform affordance built precisely for runtime-only-host-permission extensions (announced Jan 2 2025, live as of Jul 2026). Converts Bokal's trust posture from a UX tax into a one-click grant. `lib/permissions.ts` is the touch point. |
| 4 | **Finish + market CHIPS completeness** (all-view fix above; partitioned cookies in search/export-all; a listing bullet + screenshot frame) | Free | **S** | installs via durable-ish differentiation | Google retained CHIPS in the Oct 2025 Privacy Sandbox wind-down; docs (2025-12-11) recommend `Partitioned` as the migration path. Cookie-Editor has zero support. Honest caveat: patchable by a competitor in a small diff — market it while it's true. |
| 5 | **Post-task review prompt** (after 3rd successful cookie action — already decided in business doc §5, never built) | Free | **S** | review velocity → ranking → installs | CWS ranking weighs rating count + average and downloads-vs-uninstalls (Google docs, verified; language dates to 2022 — treat as directional). Non-incentivized post-task prompts are policy-safe; incentivized ones are bannable. |

## Tier 2 — Parity + differentiation (proposed M9)

| # | Feature | Free/Pro | Effort | Moves | Evidence |
|---|---|---|---|---|---|
| 6 | **Protect / pin / block cookies** (protect from deletion, pin to top, per-site block rules) | core **Free** (trust story); advanced rule-sets can be Pro | **M** | differentiation, reviews | Cookie-Editor's maintainer **declined blocking three times** (2022×2, 2023: "not in the scope of this extension") and users are still re-asking in 2026 ([#338](https://github.com/Moustachauve/cookie-editor/issues/338) open, cites the refusal; [#182](https://github.com/Moustachauve/cookie-editor/issues/182) pin-to-top). Also the top EditThisCookie-orphan ask per our own M7 market review. Honest weight: 2-3 requesters over 3 years — a positioning wedge, not a proven volume driver. Implementation: extend the existing SW `cookies.onChanged` listener with a rules store; guard against re-set loops (cause-filter the events). |
| 7 | **DevTools panel** (`chrome.devtools.panels`, reuse the existing React app) | Free | **M** | dev retention, parity | Cookie-Editor ships popup + side panel + DevTools; that's the surface devs live in while debugging. API is current MV3 (panel.show() Chrome 140+), needs only the `devtools_page` manifest key — no new host/tabs permissions, so the trust posture is untouched. |
| 8 | **Popup surface** (quick-access mini view) | Free | **S–M** | parity, retention | Already listed in the design spec as the optional post-MVP secondary surface; WXT makes it a new entrypoint reusing existing components/stores. |

## Tier 3 — Strategic bets (M10+, decide after launch data)

| # | Feature | Free/Pro | Effort | Moves | Evidence |
|---|---|---|---|---|---|
| 9 | **Auto-delete / cleanup rules** (whitelist-based auto-cleanup) | core Free; scheduled/advanced rule-sets Pro | **L** | installs + retention (compounds into the uninstall ranking signal) | Cookie AutoDelete is stalled: last release Dec 2022, MV3 rewrite issue open since Aug 2024 with comments through Jul 2026, delisted from CWS and force-disabled by Chrome 136 (May 2025); maintainer confirmed "definitely not archived" but minimal time (Mar 2025). **Do not overstate:** the claim that CAD users have no alternative was REFUTED (0-3) — MV3 forks exist on CWS; this is an unmet-by-CAD opening, not a vacuum. Keep scoped so the CWS single-purpose statement ("cookie manager") still literally covers it. |
| 10 | **Cookie audit / breakage-testing aids** (flag missing SameSite/Secure/Partitioned; guided third-party-cookies-blocked test mode) | Free | **S–M** | dev-segment installs (modest) | Medium confidence. Google's docs still instruct devs to audit cookies and simulate the 3PC-blocked state, but urgency dropped after the Apr 2025 deprecation cancellation; remaining drivers are Incognito, Safari/Firefox defaults, opted-out users. |
| 11 | **Maintenance-as-a-feature** (in-product changelog, visible release cadence, published security posture) | Free | **S**, ongoing | installs, reviews | Cookie-Editor has shipped nothing since Feb 2024 (~29 months); a Jun 2026 issue literally asks if the project is abandoned ([#356](https://github.com/Moustachauve/cookie-editor/issues/356)); their tracker carries a maintainer-flagged cookie-theft-abuse warning issue. Bokal's whole wedge — make the contrast visible in-product. |

---

## Store-mechanics constraints on the roadmap (verified)

- **Featured badge:** manual Google evaluation; criteria include latest platform APIs (MV3 required — necessary but no longer differentiating post-Aug-2026) and respecting user privacy. **Core features must not be paywalled** to qualify → CRUD, search, bulk delete, export-all, protection basics, and standard format exports stay Free; Pro gates workflow depth (named profiles, automation suites, encrypted sharing). Nominate via One Stop Support once the listing is live and polished.
- **Ranking loop:** ratings (count + average) and downloads-vs-uninstalls feed ranking → retention features (protection, standing rules, profiles users depend on) compound into discovery. Algorithm is opaque; treat as directional.
- **Keywords:** "cookie editor" / "cookie manager" in name+description matter; competitor-name stuffing ("EditThisCookie alternative") risks keyword-spam rejection — keep the takedown story in the description prose where it's genuinely contextual (already the case in the locked copy).

## Refuted claims — do NOT repeat in marketing or planning

1. "EditThisCookie had 3M users / 11k ratings at removal" — **failed verification (1-2)**; don't cite the 3M displaced-user figure anywhere without independent verification.
2. "CAD users have no working alternative" — refuted (0-3); MV3 forks exist.
3. "EditThisCookie was removed for missing MV3, not misconduct" — refuted (0-3).
4. "Privacy Sandbox eliminated entirely (all 10 technologies removed)" — refuted (0-3); **CHIPS and FedCM were explicitly retained** (that retention is what validates the CHIPS investment).

## Not validated this pass (open questions before investing)

- **Multi-account session switching** (SessionBox class — the feature nearest Bokal's Pro profiles): no claims about SessionBox/J2TEAM or session-switching demand survived verification. Research CWS review text specifically before building toward it.
- **Firefox port:** no demand evidence surfaced; the existing deferral stands on engineering grounds only.
- Where did EditThisCookie's users actually migrate, and what share still searches for a successor?
- Free→Pro conversion benchmarks for automation/team features (CookieJar proves the pattern, no rates found).
- Whether an explicit, revocable all-sites grant for export-all affects Featured-badge/privacy-review outcomes (it stays within the already-declared `optional_host_permissions`, so likely fine — verify at submission).

## Suggested milestone packaging

- **M8 (v1.1, ~all S/S-M):** CHIPS all-view fix · export/import-all · storageState/Puppeteer/addCookies formats · `addHostAccessRequest` chip · review prompt · plus the two standing M7 deferrals (route imports through `validateCookie`; restore detailed import error reporting).
- **M9 (v1.2):** protect/pin/block (free core) · DevTools panel · popup surface · listing-copy refresh to name the new capabilities.
- **M10 (bet, revisit with launch data):** auto-delete rules (decide Free/Pro split then) · audit aids.

**Sources:** 23 fetched 2026-07-13; primaries include the Cookie-Editor and Cookie-AutoDelete GitHub trackers (via API), Chrome extensions API references (cookies, devtools.panels, permissions), Playwright auth docs, Google Privacy Sandbox announcements (Apr + Oct 2025), CWS discovery docs + Featured-badge announcement. Full verification transcript: session workflow `wf_2bcfb2b0-8fb`.
