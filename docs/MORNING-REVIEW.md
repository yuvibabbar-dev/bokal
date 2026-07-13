# Wafer — Morning Review (built overnight 2026-07-13)

You said "build everything, I'll review in the morning; for things that need my input, research the best-selling option." Here's what happened.

## TL;DR
- **3 of 6 milestones fully built, reviewed, and merged to `master`** — a working, trust-first MV3 cookie manager: view/add/edit/delete cookies (incl. HttpOnly), search, JSON + Netscape export, JSON import, a CHIPS partition inspector, and light/dark mode. **41 unit tests green, `tsc` clean, build succeeds.**
- **The business decisions you'd normally make are researched and decided** (pricing, free/Pro split, positioning, store listing, privacy policy) → [`docs/business/2026-07-13-business-recommendations.md`](business/2026-07-13-business-recommendations.md).
- **Remaining: M4 (Pro/ExtPay/profiles), M5 (Playwright E2E + CI), M6 (store artifacts).** Every plan, decision, and carry-forward is recorded so it resumes with zero context loss.
- **Nothing outward-facing was done** — no store submission, no payments, no published content, no accounts. That's the checklist waiting for you (§ *Your turn* below).

## What's built and merged (verify it yourself)
```bash
cd /Users/yuvibabbar/Desktop/Projects/chrome_extensions/wafer
pnpm install
pnpm --filter @wafer/cookie-manager test        # 41 passing
pnpm --filter @wafer/cookie-manager exec tsc --noEmit   # clean
pnpm --filter @wafer/cookie-manager build        # -> apps/cookie-manager/.output/chrome-mv3
# then: chrome://extensions -> Developer mode -> Load unpacked -> select .output/chrome-mv3
# click the Wafer toolbar icon; on any site: Grant access -> view/edit/add/delete/search/export/import cookies
```

| Milestone | What it delivers | Tests | Merge |
|---|---|---|---|
| **M1** Foundation | pnpm monorepo, WXT+React+TS, minimal manifest (**no `tabs`**, runtime `<all_urls>` grant), XSS-safe searchable read-only viewer, background `onChanged` relay | 16 | `e743177` |
| **M2** CRUD | add/edit/delete with wired validation (`__Host-`/`__Secure-`/SameSite/size), edit **replaces** (no orphan duplicates), `chrome.cookies.set/remove` wrapper, refresh in-flight guard | 29 | `0694f45` |
| **M3** I/O · theme · CHIPS | JSON + Netscape export & JSON import via Blob+anchor (no `downloads` perm), `@wafer/ui-kit` light/dark theme, CHIPS partition inspector + badge | 41 | `654dec6` |

Each milestone got: TDD per task → a two-stage per-task review → an **opus whole-branch review** → fixes → merge. The reviews caught and fixed real issues (e.g. M2: editing a cookie's name/domain used to create a duplicate; M3: the CHIPS query needed a site helper). Full trail in `.superpowers/sdd/progress.md`.

Design + plans live in [`docs/superpowers/`](superpowers/): the research-validated design spec and one plan per milestone.

## Business decisions I made for you (research-backed — change any you dislike)
Full detail + paste-ready copy in [`docs/business/2026-07-13-business-recommendations.md`](business/2026-07-13-business-recommendations.md). Headlines:

- **Tagline:** "Every cookie, under your control. Nothing leaves your device."
- **Pricing:** **$4.99/mo · $19/yr · $39 lifetime** (launch the lifetime at **$29** for ~60 days), lifetime featured as the default. 7-day full-Pro reverse trial that triggers when a user saves/applies a 2nd profile. *(Raised the doc's $2.99 anchor — Stripe's flat $0.30 punishes low monthly prices, and Pro is zero-marginal-cost local software so lifetime is safe.)*
- **Free vs Pro:** **Free keeps everything already built** (all CRUD incl. HttpOnly, search, JSON/Netscape export, JSON import, CHIPS, dark mode) — that's what wins installs and the trust argument against Cookie-Editor. **Pro gates one thing, done well: named local cookie profiles + optional passphrase encryption** (the multi-account / QA-testing feature devs will actually pay for).
- **Store title (58/75):** `Wafer - Cookie Editor & Manager (Open Source, No Tracking)`
- **Store summary (126/132):** `Edit, add, view & delete cookies incl. HttpOnly. JSON/Netscape export, JSON import, CHIPS inspector. Open source, no tracking.`
- **Privacy:** a full paste-ready policy + the exact CWS data-use answers (two categories: Authentication information + Website content; nothing transmitted; all three Limited-Use certifications true) + per-permission justifications.

## What's left (resumes cleanly)
- **M4 — Pro layer:** `packages/pay` ExtPay wrapper (placeholder app ID, dev/mock mode), entitlement cache + 14-day offline grace + daily alarm re-check, dynamic-import feature gating, named local profiles (IndexedDB) + opt-in AES-GCM encryption.
- **M5 — Hardening + E2E + CI:** Playwright (`channel:'chromium'`, headless) driving the **real** grant flow + CRUD + paywall + SW-termination — this is where the interactive flows finally get exercised in a browser. Plus GitHub Actions CI and the threat-model doc. (Carry-forward test cases from M2/M3 reviews are queued here — e.g. "rename cookie → one remains", CHIPS partition matching, partitioned-cookie round-trip.)
- **M6 — Store artifacts:** generate the 5 screenshots from the running extension, finalize listing assets, EU-DSA trader checklist.

To continue: the ledger at `.superpowers/sdd/progress.md` lists every completed task + all carry-forward items; each milestone's plan is written just-in-time from the prior one's real code. Just say "continue with M4."

## Honest caveat
M1–M3 are verified **by construction** — 41 unit tests, `tsc`, build, an XSS regression test, manifest inspection, and adversarial code review. The **interactive flows** (clicking Grant in Chrome's real permission prompt, live cookie CRUD/export/import/CHIPS on a real site) are **not yet exercised in a browser** — that's M5's Playwright E2E, because loading an unpacked MV3 extension needs a persistent Chromium context. The code is built to be correct; it hasn't been clicked through yet. You can smoke-test it now with the Load-unpacked steps above, or wait for M5 to automate it.

## Your turn (account-bound — I can't and didn't do these)
1. Register the extension on **extensionpay.com** + connect **Stripe**; drop the real ExtPay app ID into `packages/pay` (M4 uses a placeholder until then).
2. Create **Chrome Web Store** + **Edge Partner Center** developer accounts.
3. Complete **EU-DSA trader verification** (legal name, business address, SMS-verified phone — shown publicly on the listing, so use a business/registered-agent address, not home).
4. **Host the privacy policy** (text is written for you) at a public URL and paste it into the CWS dashboard.
5. Review/adjust the **pricing and copy** decisions above before I wire them in.

Nothing here is urgent or irreversible — review at your pace and tell me what to change.
