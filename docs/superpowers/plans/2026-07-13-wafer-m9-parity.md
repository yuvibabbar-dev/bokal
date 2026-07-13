# Wafer M9 — Parity + Differentiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the research-backed differentiation feature (protect / pin / block cookies) and a DevTools panel surface, without regressing any trust invariant.

**Architecture:** A pure `lib/rules/` module (predicates + storage.local persistence) tested under `lib/`; a thin `stores/rules-store.ts` for reactivity; guards in the cookies-store delete paths; a service-worker auto-remove listener for block rules (reactive delete, honestly framed); a new WXT `devtools` + `devtools-panel` entrypoint pair that reuses the existing `App` bound to the inspected tab.

**Tech Stack:** WXT + React 19 + TS, Zustand, Vitest. WXT entrypoint conventions: `entrypoints/{name}/index.html` → auto-manifest (`devtools_page` for `devtools/`).

## Global Constraints

- No `tabs` permission; no install-time `host_permissions`. DevTools uses `chrome.devtools.*` (no new host/tabs perms) + the already-granted `<all_urls>` for cookie reads.
- Never log cookie values/passphrases; values render as text nodes only.
- Free build ships zero Pro code (M9 features are all Free; add none behind a static Pro import).
- **Blocking is reactive**: a blocked cookie is set by the site, then removed by Wafer — not prevented at the network layer. Every piece of UI copy must say so (honesty invariant).
- Protected cookies must never be deleted by any Wafer action (single delete, delete-all, or a future profile apply).
- Commit after each task; keep `pnpm -r test` + `tsc` green.

## Product decision flagged (not built in M9): popup surface

A popup requires `action.default_popup`, which **overrides** `openPanelOnActionClick` — the toolbar-icon click would open the popup instead of the side panel. For a deliberately side-panel-first product that is a regression to the flagship interaction, and the design spec labels the popup "optional post-MVP." **Deferred pending founder decision** (popup-primary like Cookie-Editor, vs. keep side-panel-primary). Not skipped for effort — flagged because it changes the primary UX. See the M9 report.

---

### Task 1: Rules model (protect / pin / block) — pure lib + storage

**Files:**
- Create: `apps/cookie-manager/lib/rules/rules.ts`
- Create: `apps/cookie-manager/lib/rules/rules.test.ts`

**Interfaces:**
- Produces:
  - `interface Rules { protectedIds: string[]; pinnedIds: string[]; blockedDomains: string[] }`
  - `loadRules(): Promise<Rules>` (storage.local key `wafer:rules`, defaults to empty arrays)
  - `saveRules(r: Rules): Promise<void>`
  - `toggleId(list: string[], id: string): string[]` (add if absent, remove if present)
  - `isProtected(rules: Rules, c: CookieAttrs): boolean` / `isPinned(rules, c)` (by `cookieId`)
  - `matchesBlock(rules: Rules, c: CookieAttrs): boolean` (c.domain equals or is a subdomain-suffix of a blocked domain, leading dot ignored)
  - `sortPinned(cookies: CookieAttrs[], rules: Rules): CookieAttrs[]` (pinned first, otherwise stable order)

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadRules, saveRules, toggleId, isProtected, matchesBlock, sortPinned, type Rules } from './rules';
import { cookieId } from '../cookies/keys';
import type { CookieAttrs } from '../cookie-types';

const c = (o: Partial<CookieAttrs> = {}): CookieAttrs => ({ name: 'a', value: '1', domain: 'ex.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: true, ...o });

function fakeLocal() { const m = new Map<string, unknown>(); return { get: async (k: string) => (m.has(k) ? { [k]: m.get(k) } : {}), set: async (o: Record<string, unknown>) => { for (const [k, v] of Object.entries(o)) m.set(k, v); } }; }
beforeEach(() => { (globalThis as unknown as { chrome: unknown }).chrome = { storage: { local: fakeLocal() } }; });

describe('rules', () => {
  it('toggleId adds then removes', () => { expect(toggleId([], 'x')).toEqual(['x']); expect(toggleId(['x'], 'x')).toEqual([]); });
  it('round-trips through storage', async () => { const r: Rules = { protectedIds: ['p'], pinnedIds: [], blockedDomains: ['ads.com'] }; await saveRules(r); expect(await loadRules()).toEqual(r); });
  it('loadRules defaults to empty', async () => { expect(await loadRules()).toEqual({ protectedIds: [], pinnedIds: [], blockedDomains: [] }); });
  it('isProtected matches by cookieId', () => { const ck = c(); const r: Rules = { protectedIds: [cookieId(ck)], pinnedIds: [], blockedDomains: [] }; expect(isProtected(r, ck)).toBe(true); expect(isProtected(r, c({ name: 'b' }))).toBe(false); });
  it('matchesBlock does suffix match ignoring leading dot', () => { const r: Rules = { protectedIds: [], pinnedIds: [], blockedDomains: ['doubleclick.net'] }; expect(matchesBlock(r, c({ domain: 'ad.doubleclick.net' }))).toBe(true); expect(matchesBlock(r, c({ domain: '.doubleclick.net' }))).toBe(true); expect(matchesBlock(r, c({ domain: 'example.com' }))).toBe(false); });
  it('sortPinned puts pinned first, stable otherwise', () => { const a = c({ name: 'a' }), b = c({ name: 'b' }), d = c({ name: 'd' }); const r: Rules = { protectedIds: [], pinnedIds: [cookieId(d)], blockedDomains: [] }; expect(sortPinned([a, b, d], r).map((x) => x.name)).toEqual(['d', 'a', 'b']); });
});
```

- [ ] **Step 2:** Run `pnpm --filter @wafer/cookie-manager exec vitest run lib/rules/rules.test.ts` → FAIL.
- [ ] **Step 3: Implement `rules.ts`** — `RULES_KEY = 'wafer:rules'`; `loadRules` reads + fills defaults; `matchesBlock` strips a leading dot from both sides and checks `domain === b || domain.endsWith('.' + b)`; `sortPinned` returns `[...pinned in original order, ...rest in original order]`.
- [ ] **Step 4:** Run → PASS; `pnpm -r test` green.
- [ ] **Step 5: Commit** `feat(m9): rules model — protect/pin/block predicates + storage`

---

### Task 2: Protect + Pin in the list (guard deletes, pin-to-top)

**Files:**
- Create: `apps/cookie-manager/stores/rules-store.ts` (zustand wrapper: `{ rules, refresh, toggleProtect(c), togglePin(c), addBlock(domain), removeBlock(domain) }`)
- Modify: `apps/cookie-manager/components/CookieRow.tsx` (lock + pin buttons; hide delete when protected)
- Modify: `apps/cookie-manager/components/CookieList.tsx` (accept `rules`; sort pinned to top; pass protect/pin state + handlers)
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx` (subscribe to rules; sort; wire handlers)
- Modify: `apps/cookie-manager/stores/cookies-store.ts` (`deleteAllForSite` skips protected → returns `{ removed, failed, skipped }`)
- Test: extend `lib/rules/rules.test.ts` only (store/UI are thin; covered by the lib + E2E)

**Interfaces:**
- Consumes: `Rules`, `isProtected`, `isPinned`, `sortPinned`, `toggleId`, `saveRules`.
- Produces: `useRules(selector)`, `rulesStore` with `toggleProtect/togglePin/addBlock/removeBlock`. `deleteAllForSite` now returns `{ removed: number; failed: number; skipped: number }`.

- [ ] **Step 1:** Add a `skipped` count test to the rules/store boundary — extend the store's `deleteAllForSite` contract. Since the store isn't in the vitest include, cover the skip logic with a pure helper `partitionDeletable(cookies, rules): { deletable, protectedSkipped }` in `rules.ts` + a test:

```ts
it('partitionDeletable separates protected cookies', () => {
  const a = c({ name: 'a' }), b = c({ name: 'b' });
  const r: Rules = { protectedIds: [cookieId(b)], pinnedIds: [], blockedDomains: [] };
  const { deletable, protectedSkipped } = partitionDeletable([a, b], r);
  expect(deletable.map((x) => x.name)).toEqual(['a']);
  expect(protectedSkipped).toBe(1);
});
```

- [ ] **Step 2:** Run → FAIL. Implement `partitionDeletable` in `rules.ts`. Run → PASS.
- [ ] **Step 3:** `rules-store.ts` — vanilla zustand store loading rules on init + `chrome.storage.onChanged` sync (key `wafer:rules`); actions mutate via `toggleId`/array ops + `saveRules` + local set. Mirror `entitlement-store` structure.
- [ ] **Step 4:** `CookieRow` — add `protected?: boolean`, `pinned?: boolean`, `onToggleProtect?`, `onTogglePin?`. Render a 🔒 toggle (title "Protect from deletion") and a 📌 toggle (title "Pin to top"); when `protected`, render the delete button as disabled with title "Protected — unprotect to delete". Keep value as text node.
- [ ] **Step 5:** `CookieList` — accept `rules`; compute `sortPinned(cookies, rules)`; pass `protected`/`pinned`/handlers per row. `App` — `const rules = useRules(s => s.rules)`; pass to `CookieList`; wire `onToggleProtect`/`onTogglePin` to `rulesStore`. Update `deleteAllForSite` in cookies-store to use `partitionDeletable` and return `skipped`; `IoBar` shows `Deleted N, skipped M protected`.
- [ ] **Step 6:** `tsc` clean; `pnpm -r test` green; `build` ok.
- [ ] **Step 7: Commit** `feat(m9): protect cookies from deletion + pin to top`

---

### Task 3: Block rules (service-worker reactive auto-remove)

**Files:**
- Modify: `apps/cookie-manager/entrypoints/background.ts` (on `cookies.onChanged` added + matchesBlock → remove)
- Create: `apps/cookie-manager/components/BlockRules.tsx` (manage blocked-domain list; honest copy)
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx` (render `BlockRules` in a collapsible section)
- Test: `matchesBlock` already tested (Task 1). SW wiring verified via build + manual/E2E.

**Interfaces:**
- Consumes: `loadRules`, `matchesBlock`, `fromChrome` (to map the changed cookie), `removeCookie`.

- [ ] **Step 1:** In `background.ts`, extend the existing `cookies.onChanged` listener: on `changeInfo` where `removed === false`, load rules and if `matchesBlock(rules, fromChrome(changeInfo.cookie))`, call `removeCookie(...)`. Loop-safe: we only act on `removed === false`; our own removal fires `removed === true`, which we ignore. Wrap in try/catch; never log the value.

```ts
chrome.cookies.onChanged.addListener((info) => {
  notify.trigger();
  if (info.removed) return; // only react to additions; ignore our own removals (loop guard)
  void loadRules().then((rules) => {
    const c = fromChrome(info.cookie);
    if (matchesBlock(rules, c)) return removeCookie(c).catch(() => {});
  }).catch(() => {});
});
```

- [ ] **Step 2:** `BlockRules.tsx` — input + "Block domain" button (adds via `rulesStore.addBlock`), list of blocked domains each with a remove ✕. Header copy: "Blocked domains — Wafer deletes matching cookies as soon as they're set (reactive, not network-level)." No cookie values shown.
- [ ] **Step 3:** `App.tsx` — render `<BlockRules />` in a `<details>` section below the list (Free feature).
- [ ] **Step 4:** `tsc` clean; `pnpm -r test` green; `build` ok; redaction guard green (verify `background.ts` logs no value).
- [ ] **Step 5: Commit** `feat(m9): per-domain cookie block rules (reactive SW auto-remove)`

---

### Task 4: DevTools panel surface

**Files:**
- Create: `apps/cookie-manager/entrypoints/devtools/index.html` + `apps/cookie-manager/entrypoints/devtools/main.ts` (registers the panel)
- Create: `apps/cookie-manager/entrypoints/devtools-panel/index.html` + `apps/cookie-manager/entrypoints/devtools-panel/main.tsx` (mounts `App`)
- Modify: `apps/cookie-manager/lib/cookies/read.ts` (optional inspected-tab override)

**Interfaces:**
- Produces: `setInspectedTab(tabId: number | null): void` in `read.ts`; `getActiveTabUrl`/`activePartitionSite` honor it when set.

- [ ] **Step 1:** `read.ts` — add `let inspectedTabId: number | null = null; export function setInspectedTab(id: number | null) { inspectedTabId = id; }`. In `getActiveTabUrl`, if `inspectedTabId !== null`, `const t = await chrome.tabs.get(inspectedTabId); return t.url ?? null;` else the existing query. Same override for the tab used in `activePartitionSite`. Add a unit test: with `inspectedTabId` set (via `setInspectedTab`) and a mocked `chrome.tabs.get`, `getActiveTabUrl()` returns that tab's url.
- [ ] **Step 2:** Run the new read test → FAIL → implement → PASS.
- [ ] **Step 3:** `devtools/main.ts` — `chrome.devtools.panels.create('Wafer', '', 'devtools-panel.html', () => {});`. `devtools/index.html` loads it.
- [ ] **Step 4:** `devtools-panel/main.tsx` — `import '@wafer/ui-kit/theme.css'`; call `setInspectedTab(chrome.devtools.inspectedWindow.tabId)` before `createRoot(...).render(<App />)`. `devtools-panel/index.html` mirrors the sidepanel html.
- [ ] **Step 5:** `build` → confirm generated `manifest.json` has `devtools_page: "devtools.html"` and still **no** `host_permissions`; permissions unchanged. `tsc` clean; `pnpm -r test` green.
- [ ] **Step 6: Commit** `feat(m9): DevTools panel surface (reuses the panel UI, bound to the inspected tab)`

---

### Task 5: Store-copy refresh for new features + full verification gate

**Files:**
- Modify: `docs/store/listing.md` + `docs/store/permission-justifications.md` (add `alarms`/`unlimitedStorage` to the in-description permissions list; add protect/block, DevTools, header import, delete-all, all-cookies view to the feature list; DO NOT touch the flagged host-access line — that's the founder's open decision)

- [ ] **Step 1:** Update the FEATURES list + permissions bullets in `listing.md` to name: protect/pin/block, DevTools panel, header-string import, copy-as-header, bulk delete-all, all-cookies view, automation-format export. Keep within CWS length norms; no keyword stuffing.
- [ ] **Step 2: Full gate:**
  ```bash
  pnpm -r test && pnpm --filter @wafer/cookie-manager exec tsc --noEmit
  pnpm --filter @wafer/cookie-manager build && pnpm --filter @wafer/cookie-manager zip
  pnpm --filter @wafer/cookie-manager exec playwright test
  pnpm --filter @wafer/cookie-manager build:e2e && WAFER_E2E=1 pnpm --filter @wafer/cookie-manager exec playwright test
  ```
  Confirm: tests green; manifest has `devtools_page`, **no** `host_permissions`, permissions exactly `["cookies","storage","sidePanel","unlimitedStorage","alarms"]`; ProfilesPanel still a separate chunk; E2E green both builds.
- [ ] **Step 3: Commit** `docs(m9): listing names the new free features (protect/block, DevTools, header/automation I/O)`

---

## Self-Review

- **Spec coverage:** M9 spec table → T1/T2 (protect/pin), T3 (block), T4 (DevTools). Popup explicitly deferred + flagged (documented above). ✓
- **Placeholder scan:** all steps carry real code/commands. ✓
- **Type consistency:** `Rules`, `loadRules`/`saveRules`/`toggleId`/`isProtected`/`isPinned`/`matchesBlock`/`sortPinned`/`partitionDeletable` consistent lib→store→components; `setInspectedTab` consistent read.ts→devtools-panel; `deleteAllForSite` return type updated at all call sites (`IoBar`). ✓
- **Invariant check:** blocking framed as reactive everywhere; protected cookies skipped in all delete paths; DevTools adds no host/tabs permission; no Pro code added; text-node rendering preserved. ✓
