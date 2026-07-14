# Bokal — Build Review (all 6 milestones complete)

> **Update (2026-07-13):** a 7th milestone (**M7 — pre-launch parity + bug fixes**) also landed after a market/code review — bulk delete-all, copy/clipboard + header-string I/O, profile apply-as-replace, all-cookies view, and 6 verified bug fixes. **For the authoritative current state and resume instructions, read [`HANDOFF.md`](HANDOFF.md).**

You said "build everything, I'll review; for things that need my input, research the best-selling option." Here's the final state.

## TL;DR
- **All 6 milestones built, reviewed, and merged to `master`** — a complete, monetization-ready MV3 cookie manager. **65 commits, 6 milestone merges, 54 unit tests green, `tsc` clean, build + zip succeed, E2E passes in real Chromium.**
- **Every business decision you'd normally make is researched and decided** → [`docs/business/2026-07-13-business-recommendations.md`](business/2026-07-13-business-recommendations.md), with paste-ready store artifacts in [`docs/store/`](store/).
- **Nothing outward-facing was done** — no store submission, no payments, no published content, no accounts. Those are your account-bound steps (§ *Your turn*).
- **Every milestone got: TDD → per-task review → a whole-branch review → fixes → merge.** The reviews caught and fixed real issues (edit-duplicates-cookie, CHIPS site bug, mock-billing guard, an E2E false-green race, and a privacy-claim inaccuracy — details below).

## What's built (verify it yourself)
```bash
cd /Users/yuvibabbar/Desktop/Projects/chrome_extensions/bokal
pnpm install
pnpm -r test                                         # 54 passing
pnpm --filter @bokal/cookie-manager exec tsc --noEmit # clean
pnpm --filter @bokal/cookie-manager build && pnpm --filter @bokal/cookie-manager zip
#   -> apps/cookie-manager/.output/bokalcookie-manager-1.0.0-chrome.zip  (the CWS upload)
# Load unpacked: chrome://extensions -> Developer mode -> Load unpacked -> apps/cookie-manager/.output/chrome-mv3
```

| Milestone | Delivers | Tests | Merge |
|---|---|---|---|
| **M1** Foundation | monorepo, minimal manifest (**no `tabs`**, runtime `<all_urls>` grant), XSS-safe searchable cookie viewer, background `onChanged` relay | 16 | `e743177` |
| **M2** CRUD | add/edit/delete + wired validation (`__Host-`/`__Secure-`/SameSite/size), edit **replaces** (no orphan duplicates), write wrapper, refresh guard | 29 | `0694f45` |
| **M3** I/O · theme · CHIPS | JSON + Netscape export, JSON import (Blob+anchor, no `downloads` perm), `@bokal/ui-kit` light/dark theme, CHIPS partition inspector | 41 | `654dec6` |
| **M4** Pro layer | mock-mode Billing + entitlement (14-day grace, daily alarm re-check), **AES-GCM+PBKDF2 profile encryption**, IndexedDB profiles, snapshot/apply/delete, **dynamic-import gating (free build ships no Pro code)** | 51 | `cac007c` |
| **M5** Hardening | integration round-trips, a **redaction guard** (fails CI on value/passphrase logging), **Playwright E2E** (verified in real Chromium), GitHub Actions CI, threat model | 54 | `97c165f` |
| **M6** Store-prep | privacy policy + listing + permission justifications + data-use answers + trader checklist + submission guide, **generated icons + real screenshots**, flash fix, publishable zip | 54 | `40847ca` |

~1,220 lines of source. Design spec + all six milestone plans + the durable execution ledger are in [`docs/design/`](design/).

## Business decisions I made for you (research-backed — change any you dislike)
Full detail + paste-ready copy: [`docs/business/2026-07-13-business-recommendations.md`](business/2026-07-13-business-recommendations.md) and [`docs/store/`](store/). Headlines:
- **Tagline:** "Every cookie, under your control. Nothing leaves your device." *(now literally true — see the M6 fix below)*
- **Pricing (live):** **$4.99/mo · $19.99/yr · $29.99 lifetime** (launch price; raise to ~$39 after ~60 days), lifetime featured; 7-day reverse trial on the 2nd profile is deferred (see HANDOFF §5).
- **Free vs Pro:** free keeps everything already built (CRUD incl. HttpOnly, search, JSON/Netscape export + import, CHIPS, dark mode); **Pro = local cookie profiles + optional encryption**.
- **Store title (58/75):** `Bokal - Cookie Editor & Manager (Open Source, No Tracking)`; **summary (126/132)** and full description, permission justifications, data-use answers, and a hostable **privacy policy** are all paste-ready in `docs/store/`.

## What the reviews caught (and fixed)
A flavor of the adversarial passes doing real work: **M2** — editing a cookie's name used to create a *duplicate* (fixed to remove the original, incl. the host-only edge). **M3** — CHIPS queried the wrong site form; ui-kit React made a peer dep. **M4** — the `USE_MOCK_BILLING` flag was dead (made it a real launch guard so mock-Pro can't ship by accident). **M5** — the E2E's flagship granted test could silently *self-skip* (false green) under CI timing → made deterministic and **proven to run** in real Chromium. **M6** — the privacy policy claimed "nothing leaves your device," but the theme setting synced via `chrome.storage.sync` → **moved theme to `storage.local`** so the claim is true.

## Honest caveat
The extension is **verified in a real browser** — Playwright loads the unpacked MV3 build in Chromium and confirms the side panel mounts with **zero console errors** in both permission states (grant gate + management UI), and the screenshots/icons are captured from the actual running extension. **Full CRUD-through-the-UI is now automated too** (`e2e/crud.spec.ts`): against a real page on a real origin, it adds, edits, protects and deletes a cookie through the extension's own UI and verifies every result against `chrome.cookies` (ground truth, not just the DOM) — plus it asserts a free user makes **zero requests to extensionpay.com**. `e2e/pro.spec.ts` drives the real ExtPay purchase flow (against a mocked billing backend) through to Pro unlock, and proves a wrong passphrase cannot destroy cookies.

## Your turn (account-bound + pre-launch — I can't/shouldn't do these)
1. **Wire real billing before selling:** register on extensionpay.com + Stripe, implement `ExtPayBilling` and flip `USE_MOCK_BILLING=false` (guide: [`docs/pro-monetization.md`](pro-monetization.md)). Until then, mock mode unlocks Pro locally — fine for dev, **must not ship as the paid build**.
2. **Decide the default-encryption UX:** unencrypted profiles store cookie values in plaintext in IndexedDB (by design, with a warning). Consider defaulting Encrypt on before launch (a small call, documented in the threat model).
3. **Store submission:** CWS + Edge dev accounts; upload the zip; paste the `docs/store/` copy; host the privacy policy at a URL.
4. **EU-DSA trader verification:** legal name + business address + SMS phone (shown publicly — use a business/registered-agent address). Checklist in `docs/store/trader-verification-checklist.md`.
5. **Optional polish:** capture a "populated cookie list on a real site" hero screenshot manually; a designed icon can replace the generated placeholder in `apps/cookie-manager/public/icon/`.

Everything is reversible and nothing is urgent — review at your pace and tell me what to change. Full submission steps: [`docs/store/submission-guide.md`](store/submission-guide.md).
