# Wafer — Session Handoff / Resume Point

**This is the single self-contained entry point for the next session.** Everything below is committed to git (unlike the `.superpowers/sdd/progress.md` scratch ledger, which is git-ignored and may be gone). Last updated: 2026-07-13 (post v1.1 roadmap: M8–M10).

---

## 1. Snapshot (verified, ground truth)
- **Repo:** `/Users/yuvibabbar/Desktop/Projects/chrome_extensions/wafer` (own git repo; pnpm monorepo).
- **Branch/HEAD:** `master` @ `ac8a22c` — clean working tree, **116 commits, 11 milestone merges** (M1–M11).
- **State:** `tsc` clean · **104 unit tests pass** · build + zip succeed · Playwright E2E passes in real Chromium (both build variants) · published manifest has **no `host_permissions`**, **no `tabs`** (adds `activeTab`, `devtools_page`).
- **v1.1 (M8–M11) added:** CHIPS all-view fix; validated imports + detailed errors; Playwright/Puppeteer automation-format I/O; all-sites export; one-time review prompt; protect/pin/block cookies; DevTools panel; whitelist auto-cleanup (Clean now + optional daily sweep); cookie audit badges; **per-site permission model** (requests just the active site; `<all_urls>` opt-in only for all-sites features). All Free. Research + program spec: `docs/business/2026-07-13-feature-roadmap-research.md`, `docs/superpowers/specs/2026-07-13-wafer-v1.1-roadmap-design.md`.
- **What it is:** a complete, monetization-ready MV3 Chrome/Edge **cookie manager** ("Wafer"), positioned as the trustworthy, open-source successor to the delisted EditThisCookie. Business 4 for this solo founder.
- **One-command verify:**
  ```bash
  cd /Users/yuvibabbar/Desktop/Projects/chrome_extensions/wafer && pnpm install \
    && pnpm -r test && pnpm --filter @wafer/cookie-manager exec tsc --noEmit \
    && pnpm --filter @wafer/cookie-manager build
  ```

## 2. How to resume (do this first)
1. Read this file, then `docs/MORNING-REVIEW.md` (narrative status) and `docs/build-log.md` (per-task/review history).
2. The persistent memory already carries the project summary (`project_wafer.md`); trust git history + these docs over any stale recollection.
3. If `.superpowers/sdd/progress.md` is missing, that's fine — it's git-ignored scratch; `docs/build-log.md` is the committed copy, and `git log` is authoritative.
4. Confirm state with the verify command above before changing anything.

**Likely next requests and where to start:**
- **"Wire real ExtPay / I made the accounts"** → follow `docs/pro-monetization.md` exactly (steps in §5 below). This is the #1 pre-launch item.
- **"Submit to the store"** → `docs/store/submission-guide.md` + the paste-ready copy in `docs/store/`. (User does the actual upload/verification.)
- **"Build the v1.1 features / fix X"** → use the same dev workflow (§6) — write a plan under `docs/superpowers/plans/`, branch `feat/mN-*`, subagent-driven tasks with review, opus whole-branch review, merge. Deferred list in §4.
- **"Does it work / show me"** → `pnpm --filter @wafer/cookie-manager build`, then load `apps/cookie-manager/.output/chrome-mv3` unpacked at `chrome://extensions`. Or run `pnpm --filter @wafer/cookie-manager exec playwright test`.

## 3. What's DONE (M1–M7, all merged to master)
| Milestone | Delivers | Merge |
|---|---|---|
| **M1** Foundation | monorepo, minimal manifest (no `tabs`, runtime `<all_urls>` grant), XSS-safe searchable cookie viewer, SW `onChanged` relay | `e743177` |
| **M2** CRUD | add/edit/delete + wired validation, edit **replaces** (no orphan dup), write wrapper, refresh seq-guard | `0694f45` |
| **M3** I/O · theme · CHIPS | JSON+Netscape export, JSON import (Blob+anchor, no `downloads` perm), `@wafer/ui-kit` light/dark, CHIPS inspector | `654dec6` |
| **M4** Pro layer | mock Billing + entitlement (14-day grace, daily alarm), AES-GCM+PBKDF2 profile encryption, IndexedDB profiles, dynamic-import gating (free build ships no Pro code) | `cac007c` |
| **M5** Hardening | integration round-trips, redaction guard, Playwright E2E, GitHub Actions CI, threat model | `97c165f` |
| **M6** Store-prep | privacy policy + listing + justifications + data-use + trader checklist + submission guide, generated icons + real screenshots, grant-gate flash fix, publishable zip | `40847ca` |
| **M7** Parity + fixes | bulk delete-all (scope-honest), copy-value/copy-as-header/clipboard, header-string import, profile apply-as-**replace** + in-panel passphrase, all-cookies view, attr-length validation + domain-count warning; bugs: alarm-reset, same-tab-nav, entitlement seq-guard, profiles try/catch, accurate CHIPS via `getPartitionKey`, cross-panel theme sync | `45ba0df` |

Each milestone: TDD per task → two-stage per-task review → an **opus whole-branch review** → fixes → merge. (M8–M10 whole-branch reviews were run via an adversarial general-purpose subagent; each found real issues that were fixed pre-merge — notably M9's Critical where the Pro profile "apply-replace" wiped protected cookies, now enforced at the data layer.)

## 4. What's NEXT
**Both pre-submission decisions from the v1.1 build are now RESOLVED (M11, deep-research-backed):**
1. ~~Store-copy permission accuracy~~ → **built the real per-site permission model.** Wafer now requests host access for just the active site (exact host + parent-domain patterns, never a `*.wildcard`, so it can't over-grant to a public suffix), via `activeTab` to read the URL (not `tabs`, no install warning). `<all_urls>` is an explicit opt-in for the all-cookies view / all-sites export / cleanup. Store copy + threat-model now match the code. **⚠ ONE RESIDUAL — real-browser QA before submission:** `activeTab` timing on side-panel open isn't exercisable in the E2E harness; the flow degrades safely to the all-sites fallback if it doesn't surface the URL. Verify the per-site prompt works in a real browser before store submission.
2. ~~Popup surface direction~~ → **kept side-panel-primary** (no `action.default_popup` — it would kill side-panel-on-click; evidence to switch was thin, n=1). Added first-run onboarding to ease Cookie-Editor-migrant friction. Popup-primary remains a deliberate future option if user testing shows severe friction.

**Account-bound (only the USER can do — see `docs/MORNING-REVIEW.md` §Your turn):**
1. ~~Wire real ExtPay~~ → **WIRED (M12), sandbox test RUN 2026-07-13 — one wiring issue found, awaiting the founder's new app id.**
   **State:** `ExtPayBilling` live (`USE_MOCK_BILLING=false`, app id `wafer-test`), free users make zero ExtPay contact (engagement gate + no SW ExtPay construction), no new permissions. 115 tests incl. a paid-flow integration test (`lib/pay/paid-flow.test.ts`).
   **Sandbox result:** the founder paid with 4242… successfully (ExtPay billing portal shows an active "Wafer-test" $4.00/mo subscription, invoice Paid) — BUT the portal is branded **"Couples Companion"**: the id `wafer-test` resolves to the founder's *Couples Companion* ExtPay app, so the payment landed in THAT app's connected Stripe, not the Wafer Stripe (why his Wafer Stripe dashboard shows nothing). Not a code bug.
   **NEXT SESSION:** (a) founder registers a dedicated Wafer app on extensionpay.com (own id, connected to the Wafer Stripe, plans $4.99/$19/$39 lifetime-default) and provides the id; (b) set `EXTPAY_APP_ID` in `lib/pay/config.ts` (one line); (c) re-run the sandbox purchase from the loaded extension and confirm the Pro panel unlocks + the charge appears in the right Stripe (test mode toggle!); (d) also still unverified in a real browser: whether the Pro panel unlocked after this payment, and the free-user no-network check. Guide: `docs/pro-monetization.md`. At launch: prod app id + Stripe test→live.
2. Decide default-on profile encryption (currently opt-in + warning; plaintext-at-rest otherwise).
3. Chrome Web Store + Edge Partner Center accounts; upload the zip; host the privacy policy at a URL.
4. EU-DSA trader verification (legal name + business address + SMS phone — public; use a business address). Checklist: `docs/store/trader-verification-checklist.md`.
5. Publish the open-source repo (no git remote / README / LICENSE yet) — the store copy claims "open source, every line published", so this is a launch blocker; also the GitHub Actions CI has never actually run.

**v1.1 DONE in M8–M10 (previously deferred):** validate imports; detailed import errors; protect/block cookies; DevTools panel; auto-delete/cleanup; audit hints. **Still deferred (an AGENT can build; not regressions):**
- Popup surface (see decision #2 above).
- Firefox port (WXT emits it; `sidebar_action` differs from `chrome.sidePanel`).
- Netscape *import* (export exists; import is JSON/header/automation only).
- Named-automation-profile *suites* (Pro storageState round-trip) — the one-off automation exports shipped Free in M8; the Pro suite lever is unbuilt.
- Extract `lib/pay` → `packages/pay` when/if the second JSON-viewer app is built.
- A hero "populated cookie list on a real site" marketing screenshot (manual capture; the standalone-panel harness can't bind an active tab, so full CRUD-through-UI E2E is also not automated).

## 5. Wiring real ExtPay (the launch gate) — exact steps
Currently `lib/pay/billing.ts` `getBilling()` returns `MockBilling` (entitlement via the `wafer:mockPaid` local flag; `openUpgrade()` sets it). `USE_MOCK_BILLING` in `lib/pay/config.ts` is a **live guard**: flip it to `false` and `getBilling()` throws until a real adapter exists. To go live (full detail in `docs/pro-monetization.md`):
1. Register at extensionpay.com → set `EXTPAY_APP_ID` in `lib/pay/config.ts`.
2. `pnpm --filter @wafer/cookie-manager add extpay`.
3. Add `ExtPayBilling implements Billing` in `billing.ts` (`getEntitlement` → `extpay.getUser().paid`; `openUpgrade` → `extpay.openPaymentPage()`; catch network errors + popup-blockers).
4. Call `extpay.startBackground()` at the top of `entrypoints/background.ts`.
5. Set `USE_MOCK_BILLING=false` and return `ExtPayBilling` from `getBilling()`.
6. Real test purchase end-to-end before publishing. Pricing decided: **$4.99/mo · $19/yr · $39 lifetime** ($29 launch) — see `docs/business/2026-07-13-business-recommendations.md`.

## 6. Dev workflow to CONTINUE (how every milestone was built)
- **Branch per milestone:** `git checkout -b feat/mN-<topic>` off `master`.
- **Plan first:** write `docs/superpowers/plans/YYYY-MM-DD-wafer-mN-<topic>.md` with complete code per task (see the 7 existing plans as templates).
- **Subagent-driven execution** (skill: `superpowers:subagent-driven-development`): per task → `scripts/task-brief` → dispatch an implementer subagent (haiku for transcription, sonnet for integration) → `scripts/review-package BASE HEAD` → dispatch a task reviewer (sonnet) → fix loop → mark complete in the ledger.
- **Whole-branch review** on **opus** at the end of each milestone (template: `superpowers/skills/requesting-code-review/code-reviewer.md`) → fix Important/Critical → merge `--no-ff` → delete branch.
- Helper scripts live at `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.1.1/skills/subagent-driven-development/scripts/` (`task-brief`, `review-package`).
- Ledger: `.superpowers/sdd/progress.md` (git-ignored; the committed copy is `docs/build-log.md`).

## 7. Critical invariants the next session MUST preserve (do not regress)
- **Trust posture is the whole product.** Every privacy/permission claim in `docs/store/` and `docs/threat-model.md` must stay literally true against the code.
- **No `tabs` permission; no install-time `host_permissions`.** Host access is `optional_host_permissions: ['<all_urls>']` requested at runtime. The `WAFER_E2E=1` build adds `host_permissions` for E2E ONLY — the **published build must never ship it** (a redaction/manifest check + the `wxt.config.ts` env gate enforce this).
- **Free build ships zero Pro code** — `ProfilesPanel` loads via dynamic `import()` behind the entitlement gate; verified as a separate chunk. Don't add a static import of it.
- **Never log cookie values / passphrases** — enforced by `lib/security/redaction.test.ts` (runs in CI; scans the app + `@wafer/ui-kit`).
- **Cookie values render as text nodes only** (never `dangerouslySetInnerHTML`); an XSS regression test locks this.
- **Profile encryption:** AES-GCM + PBKDF2 600k; `apply()` decrypts BEFORE removing, so a wrong passphrase can never wipe cookies. `chrome.storage` (local/session) is the source of truth; theme pref is **`storage.local`** (deliberately NOT `sync`, so "nothing leaves your device" holds).
- **`refresh()` seq-guards** in `cookies-store` and `entitlement-store` — keep them; compute state before the `if (seq !== …) return;` check.
- **Deviation on record:** the Pro layer lives in `apps/cookie-manager/lib/pay` + `lib/profiles`, NOT a separate `packages/pay` (YAGNI until the JSON-viewer app exists).

## 8. Repo map
```
apps/cookie-manager/      # the WXT + React + TS extension
  entrypoints/            #   background.ts (SW), sidepanel/ (App.tsx = main UI)
  lib/                    #   cookies/ (validation,keys,read,write), io/ (export,import,header,download), pay/, profiles/, security/, clipboard, permissions, site, debounce
  stores/                 #   cookies-store, entitlement-store, profiles-store (zustand)
  components/             #   CookieRow/List/Editor, IoBar, SearchBar, ThemeToggle, UpgradeButton, GrantAccess, pro/ProfilesPanel (lazy)
  e2e/                    #   Playwright fixtures + smoke/granted specs
  scripts/                #   gen-icons.mjs, gen-screenshots.mjs
  public/icon/            #   generated 16/32/48/128 png (placeholder — designer can replace)
packages/tsconfig, packages/ui-kit   # shared TS config; theme.css + useTheme
docs/                     # HANDOFF.md (this), MORNING-REVIEW.md, build-log.md, threat-model.md, pro-monetization.md
docs/business/            # business-recommendations (pricing/positioning/copy)
docs/store/               # paste-ready: privacy-policy, listing, permission-justifications, data-use-answers, trader-verification-checklist, submission-guide, screenshots/
docs/superpowers/specs/   # design spec ; docs/superpowers/plans/ = the 7 milestone plans
.github/workflows/ci.yml  # tsc + vitest + build + Playwright E2E (both builds under xvfb)
```

## 9. Commands
```bash
pnpm install
pnpm -r test                                              # 60 unit tests
pnpm --filter @wafer/cookie-manager exec tsc --noEmit     # type-check
pnpm --filter @wafer/cookie-manager build                 # -> .output/chrome-mv3
pnpm --filter @wafer/cookie-manager zip                   # -> .output/*.zip (CWS/Edge upload)
pnpm --filter @wafer/cookie-manager exec playwright test  # E2E smoke (normal build)
pnpm --filter @wafer/cookie-manager build:e2e && WAFER_E2E=1 pnpm --filter @wafer/cookie-manager exec playwright test  # granted-UI E2E
pnpm --filter @wafer/cookie-manager exec node scripts/gen-icons.mjs        # regen icons
pnpm --filter @wafer/cookie-manager exec node scripts/gen-screenshots.mjs  # regen screenshots (run against build:e2e)
```

## 10. Market verdict (for context on priorities)
Engineering is ship-ready and now at feature parity with the free incumbent (Cookie-Editor) plus a trust + one-time-pricing edge over SessionBox (subscription). The remaining blocker to revenue is **distribution/launch motion + wiring payments**, not features — see `docs/MORNING-REVIEW.md` and `project_wafer.md` memory.
