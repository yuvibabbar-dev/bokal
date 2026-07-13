# Wafer — Build Log (committed copy of the .superpowers/sdd/progress.md scratch ledger)

> Per-task + per-review history for milestones M1–M7. The live ledger is git-ignored; this is the durable snapshot. Authoritative record = git history + docs/HANDOFF.md.

```
# Wafer M1 — Subagent-Driven Execution Ledger

Plan: docs/superpowers/plans/2026-07-13-wafer-m1-foundation-and-cookie-listing.md
Branch: feat/m1-foundation
BASE (pre-Task-1): d54687c7b17c2a5a69c2126915e538e1bae3c8e4

## Task status
(Task N: complete (commits <base7>..<head7>, review clean) — appended as each clears review)

## Minor findings roll-up (for final whole-branch review)
Task 1: complete (commits d54687c..ef201b1, review clean)
Task 2: complete (commits ef201b1..d6010ea, review clean)
Infra fix: tsconfig extends .wxt + @types/react (commit 0a367e5) — tsc --noEmit clean
Task 3: complete (commits d6010ea..942dacb, review clean; Minor: brief ValidationIssue.field union redundant — roll-up)
Task 4: complete (commits 35f88fc..ae0fbf4, review clean; Minor: cookieId no delimiter-escape — roll-up)
Task 5: complete (commits ae0fbf4..e72e39a, review clean)
Task 6: complete (commits e72e39a..19ea475, review clean after fix: documented+relocated chrome.d.ts shim; Minor roll-up: consider bumping @types/chrome to drop the shim)
Task 7: complete (commits 19ea475..621e8f5, review clean)
Task 8: complete (commits 621e8f5..c732067, review clean)
Task 9: complete (commits c732067..aaee288, review clean)
Task 10: complete (commits aaee288..007b948, review clean)
Task 11: complete (commits 007b948..993493c, review clean)
Task 12: complete (commits 993493c..2138c11, review clean)

## Final whole-branch review (opus): Ready to merge WITH FIXES — applied in 5b7cadd
- Fixed pre-merge: cookieId field escaping (was merge gate); removed redundant `|'name'` union; removed dead setGranted + unused get.
- No Critical/Important issues. Security (text-node render, no value logging), minimal manifest, MV3 top-level listeners, gesture-preserved permission flow all verified.

## M2 carry-forward (deferred items from M1 review — fold into the M2 plan)
- chrome.storage.onChanged sync: not implemented in M1 (panel is sole writer; functionally fine). Needed once M2/M4 add a second writer (SW/entitlement/profiles). Do NOT assume it exists.
- refresh() has no in-flight guard: overlapping calls race (last-write-wins). Add request-token/abort when writes land in M2.
- session cache key `wafer:lastCookies` is global, not per-window: two windows on different domains can flash each other's snapshot on remount. Key by windowId/tabId in M2.
- CookieList height uses magic `calc(100vh - 90px)`: prefer a flex layout when the panel chrome changes.
- types/chrome.d.ts shim: consider bumping @types/chrome past 0.0.287 to drop it (optional).

========================================================================
## AUTONOMOUS OVERNIGHT BUILD (directive 2026-07-13): build M2–M6.
For business decisions needing user input, research best-selling option, pick it,
document for morning review. No outward-facing/account-bound actions (no store
submit, no real payments, no publishing). Branch per milestone, merge to master
after review. Final deliverable: docs/MORNING-REVIEW.md.
========================================================================

## M2 (feat/m2-crud) — Cookie CRUD
M2-T1: complete (commits 4e442ab..3d05245, review clean)
M2-T2: complete (commits 3d05245..4ea6612, review clean)
M2-T3: complete (commits 4ea6612..ca49487, review clean; Minor: deleteCookie reject unhandled at call site -> T5 adds .catch)
M2-T4: complete (commits ca49487..228aec9, review clean)
M2-T5: complete (commits 228aec9..56e9427, review clean)
M2 final review (opus): Ready-with-fixes. Applied: A) edit removes orphaned original (setCookie then removeCookie if cookieId changed), B) validate write-origin cookieUrl(draft), C) setCookie throws on falsy result, D) empty-name blocks Save, E) hostOnly added to cookieId (re-review catch). tsc clean, 29/29 tests, build ok.
M5 E2E carry-forward: add cases "rename cookie -> exactly one remains", "toggle host-only -> original removed", "saveCookie set-then-remove orchestration", "setCookie throw-on-falsy". Also M5: toSetDetails(fromChrome(x)) round-trip test with __Host- + partitioned fixture.
M2: COMPLETE — merging to master.

## M3 (feat/m3-io-theme-chips) — Import/export + dark mode + CHIPS
M3 BASE = 0694f45
M3-T1: complete (commits 7ffd3d3..b74e1c4, review clean)
M3-T2: complete (commits b74e1c4..380ad8c, review clean)
M3-T3: complete (commits 380ad8c..f750e03, review clean)
M3-T4: complete (commits f750e03..363b156, review clean; Minor roll-up: dead .wafer-dark-tokens class in theme.css; react as dep not peerDep in ui-kit)
M3-T5: complete (commits 363b156..5b12e34, review clean)
M3 final review (opus): Ready-with-fixes (no Critical). Applied: 1) siteFromUrl for CHIPS (partial; full eTLD+1/getPartitionKey deferred to M5), 2) ui-kit react->peerDependency, 3) surface import failure reasons, 4) prune dead .wafer-dark-tokens + --wafer-row-hover, 5) preserve hasCrossSiteAncestor on import, 6) hasCrossSiteAncestor in cookieId. tsc clean, 41/41, build ok.
M5 carry-forward (from M3 review): correctly derive CHIPS topLevelSite (getPartitionKey feature-detect Chrome 130+ / PSL) and E2E-verify partition inspector shows partitioned cookies; add toJson->parseCookiesJson->toSetDetails partitioned round-trip integration test; confirm-before-bulk-overwrite on import; surface that imported cookies for non-active domains aren't shown; add storage.onChanged theme sync across panels; decide whether export should honor the active search filter.
M3: COMPLETE — merging to master.
Business decisions: researched + doc written docs/business/2026-07-13-business-recommendations.md (committed to master). Pricing $4.99/mo/$19yr/$39 lifetime; Pro=profiles+encryption.

## M4 (feat/m4-pro) — Pro layer (ExtPay/mock + entitlement + profiles + encryption)
M4 BASE = 6defe65
M4-T1: complete (entitlement logic, 46 tests)
M4-T1: review clean (commits 2ef3d11..ad88eeb)
M4-T2: review clean (commits ad88eeb..69ee682; Minor roll-up: SW void import() lacks .catch on chunk-load failure)
M4-T3: review clean (commits 69ee682..e8e70ea; BufferSource casts validated as necessary TS strict workaround)
M4-T4: review clean (commits e8e70ea..f9f27b5; Minor: IDB connections not closed, test-order coupling — both from brief)
M4-T5: review clean (commits f9f27b5..6302e2e)
M4-T6: review clean (commits 6302e2e..891077f; code-split verified - ProfilesPanel separate chunk, strings absent from main)
M4 final review (opus): Ready-to-merge (Yes, internal milestone; no Critical). Applied fixes: USE_MOCK_BILLING now load-bearing (getBilling throws if false/unwired), unencrypted-save warning, IDB conn memoize + onversionchange, decrypt blob.v guard, apply-alert fix, SW alarm .catch. tsc clean, 51/51, build ok, ProfilesPanel still separate chunk.
M5/M6 carry-forward (from M4 review): [PRE-LAUNCH] implement ExtPayBilling + flip USE_MOCK_BILLING (mock currently unlocks Pro locally by design); decide default-on encryption vs the current opt-in+warning; replace prompt()/alert() in ProfilesPanel with an in-panel passphrase field (also eases E2E); add UI copy that apply MERGES cookies (additive, not a full restore) and that snapshot omits partitioned cookies unless CHIPS toggle on; add E2E/unit coverage for profiles-store/entitlement-store/sync; add entitlement-store refresh seq-guard once ExtPay getEntitlement is async; try/catch in profiles load/remove.
M4: COMPLETE — merging to master.

## M5 (feat/m5-hardening) — integration tests + E2E harness + CI + threat model
M5 BASE = cac007c
M5-T1: complete (round-trip integration tests, 53 tests)
M5-T1: review clean (commits ecc3802..b8d742e)
M5-T2: complete + verified guard catches offenders (commits f91b1ba, 54 tests)
M5-T3: review clean (commits f91b1ba..c78bffd; E2E ran green - smoke pass; Minor: .gitignore test-results/ disclosed)
M5-T3 harness fix (commit 9e54904): build-agnostic E2E specs; ran green in real Chromium on BOTH builds (normal: smoke+grant-gate pass, granted skip; e2e: smoke+granted-UI pass, grant-gate skip). Full CRUD-through-UI E2E deferred (needs real side-panel<->tab binding).
M5-T4: complete + verified (CI ci.yml well-formed: build-test + e2e-both-builds jobs) (commit e5288ca)
M5-T5: complete (threat-model.md grounded in real controls) (commit 293931b)
M5 final review (opus): Ready-with-fixes (no Critical; merge-safe - no product regression, no manifest leak, honest threat model). Fixed: E2E determinism (env-gated skip; granted-UI PROVEN to run+pass on e2e build, not silent-skip); redaction guard hardened (strip-strings, whole-object ids, dir/table/trace, ui-kit scope); threat-model wording. tsc clean, 54 tests, published manifest no host_permissions.
M6 carry-forward (from M5 review): GrantAccess-then-refresh flash - App renders the grant gate before async refresh() resolves, so already-granted users see a brief grant-gate flash every open. Add a `loading`-gated initial render in M6 (product change).
M5: COMPLETE — merging to master.

## M6 (feat/m6-store) — store artifacts + icons + screenshots + flash fix + package
M6 BASE = 97c165f
M6-T1: complete + verified (ready flag guarded; flash fix; commit 2b8cca5; E2E 2 pass/1 skip)
M6-T2: complete (6 store artifacts, summary 126/132, perms match manifest; commit 462e3cf)
M6-T3: complete (4 real icon PNGs 16/32/48/128, manifest.icons wired, on-brand cookie; commit 2bdcd05)
M6-T4: complete (3 real screenshots from running ext: mgmt UI, editor, Pro profiles; listing.md captions; commit cb3862d)
M6-T5: complete (zip 83KB, manifest no host_permissions, tsc/54 tests/E2E green; commit f99d486)
M6 final review (opus): Ready-with-fixes (no Critical; flash fix sound, manifest clean). Applied: theme pref chrome.storage.sync->local (privacy claim "nothing leaves your device" now literally true — deliberate trust-over-convenience; theme no longer syncs cross-device), corrected doc storage mechanisms (profiles=IndexedDB not storage.local; unlimitedStorage rationale; filters not persisted), title 58/75, hydrate .catch. tsc 0, 54 tests, build ok, no host_permissions.
DEVIATION NOTE: design spec said theme in storage.sync (ok as small pref); overridden to storage.local so the trust/privacy claim holds. Cross-device theme sync dropped (trivial).
M6: COMPLETE — merging to master. ALL 6 MILESTONES DONE.

## M7 (feat/m7-parity) — pre-launch parity + bug fixes (user directive after market review)
M7 BASE = b9ad7a2
M7-T1: complete + review clean (alarm guard, onUpdated, entitlement seq-guard, profiles try/catch; commits f4a25b6..91238ce)
M7-T2: complete + review clean (header lib TDD + ATTR_VALUE_MAX wired; 60 tests; commits 91238ce..3acfd2a)
M7-T3: complete + review clean (copy/delete-all/header-import); FIX 1dab7e1: IoBar operates on filtered list not full (data-safety; also resolves M3 export-filter deferral). commits 3acfd2a..1dab7e1
M7-T4: complete + review clean (apply-as-replace, decrypt-before-remove verified, in-panel passphrase; commits 1dab7e1..4d8b62b; Minor roll-up: stale applyPass on row-switch, notice/error coexist)
M7-T5: complete + review clean (all-cookies view, SOFT_DOMAIN_COOKIE_WARN wired, seq-guard preserved; commits 4d8b62b..5a22a32; Minor roll-up: CHIPS checkbox inert in all-scope)
M7-T6: complete + review clean (getPartitionKey feature-detect no-any, theme storage.onChanged sync; commits 5a22a32..2ce137e)
M7 final review (opus): Ready-with-fixes (no Critical; destructive paths safe: apply-as-replace decrypts BEFORE removing so wrong passphrase never wipes; all destructive behind confirm; no value/passphrase leak; no new permissions; getPartitionKey cast sound). Applied: scope-honest delete-all confirm (across ALL sites wording), clear passphrase on encrypted row-switch, clear stale notice, disable inert CHIPS toggle in all-scope, honest replace label + comment. tsc 0, 60 tests, build, E2E both builds green, ProfilesPanel still chunked.
M7 DEFERRED (v1.1, not regressions): import (JSON+header) bypasses validateCookie — validate imports too; import error-reporting detail regressed (cosmetic).
M7: COMPLETE — merging to master. Pre-launch parity + all reviewed flaws fixed.

========================================================================
## v1.1 ROADMAP BUILD (directive 2026-07-13): fix the CHIPS bug + build M8/M9/M10.
Research: docs/business/2026-07-13-feature-roadmap-research.md (deep-research, 20 confirmed/5 refuted).
Program spec: docs/superpowers/specs/2026-07-13-wafer-v1.1-roadmap-design.md.
Founder decisions: export-all = persistent runtime <all_urls> opt-in (install manifest unchanged);
free/Pro = roadmap split; autonomous, report per milestone.
========================================================================

## M8 (feat/m8-quickwins) — Quick wins. Plan: docs/superpowers/plans/2026-07-13-wafer-m8-quickwins.md
M8-T1: complete — fix getAllCookies to include CHIPS partitioned cookies (getAll partitionKey:{} + 114-118 fallback); read.test.ts (commit 2ae1c03)
M8-T2: complete — validateForImport splits valid/invalid; importCookies pre-validates (commit d664650)
M8-T3: complete — detailed import error reporting in IoBar (commit 4d9300f)
M8-T4: complete — lib/io/automation.ts (Playwright storageState/Puppeteer/addCookies) + parseCookiesJson sniffing; 8 tests (commit a6919bb)
M8-T5: complete — all-sites export labeling + all-scope import confirm (app already holds <all_urls>, so ensureAllUrls was redundant/skipped) (commit 81bf453)
M8-T6: DROPPED — native per-site access chip (addHostAccessRequest) is inconsistent with the current all-or-nothing <all_urls> grant model (a per-site grant wouldn't satisfy hasAllUrlsPermission). Bundle with a future per-site-permissions milestone.
M8-T7: complete — lib/review.ts one-time post-task review prompt (3rd action); wired store + App; 3 tests (commit 4e7c635)
M8-T8: complete — threat-model notes export-all reuses the <all_urls> grant + FLAGS store-copy accuracy gap (commit ea35ce6)
M8 whole-branch review (general-purpose adversarial): CLEAN — no Critical/Important. All brief suspicions traced and confirmed correct. 2 Minor fixed (commit d012347): clearer "no cookies found" import message; documented CHIPS omission in automation formats (inherent — Playwright/Puppeteer have no partitionKey field).
M8 FINDING FOR FOUNDER (pre-submission): store copy (permission-justifications.md:36, listing.md:66) says host access "for the specific site you choose", but code requests <all_urls>. Decide: (a) build per-site permission model (spec §3 intent; restores claim + unblocks T6), or (b) correct copy to the runtime all-sites grant.
M8: COMPLETE — merged to master (cb28a6a). 75 tests, tsc clean, build+zip, E2E both builds green, no host_permissions, Pro code still chunked.

## M9 (feat/m9-parity) — Parity + differentiation. Plan: docs/superpowers/plans/2026-07-13-wafer-m9-parity.md
M9-T1: complete — lib/rules/rules.ts (protect/pin/block predicates + storage); 8 tests (commit a02ee49)
M9-T2: complete — protect + pin UI (CookieRow lock/pin, CookieList sort, deleteAllForSite skips protected → {removed,failed,skipped}); rules-store (commit 411139c)
M9-T3: complete — per-domain block rules (SW reactive auto-remove, loop-guarded; BlockRules UI with honest "reactive, not network-level" copy) (commit e318654)
M9-T4: complete — DevTools panel (devtools + devtools-panel entrypoints reuse App; setInspectedTab binds to inspectedWindow.tabId); read.test +1 (commit 876ad9e)
M9-T5: complete — listing names new free features + adds alarms/unlimitedStorage to permissions; host-access line left for founder (commit ac82413)
M9-T6 (popup): DEFERRED + FLAGGED — a popup requires action.default_popup which overrides openPanelOnActionClick, regressing the side-panel-first flagship UX. Founder product decision (popup-primary like Cookie-Editor vs keep side-panel-primary).
M9 whole-branch review (general-purpose adversarial): 1 Critical + 2 Important + 3 Minor, ALL FIXED (commit after review). C1: profile apply-as-replace wiped protected cookies (default-on, silent) → now skips protected. I2: SW block-remove ignored protection → protect now beats block. I3: single deleteCookie was UI-deep only → now guarded at the data layer. M1: block matching case-insensitive. M2: guard rules-store onChanged listener. M3: SW rules cache. Loop-safety, permissions, no-value-logging, Pro-isolation all verified clean by review.
M9: COMPLETE — merged to master (2d2945c). 84 tests, tsc clean, build+zip, E2E both builds green, manifest adds devtools_page with no host_permissions, ProfilesPanel still chunked.
```
