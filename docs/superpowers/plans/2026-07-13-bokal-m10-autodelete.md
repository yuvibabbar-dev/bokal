# Bokal M10 — Auto-delete + Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]` syntax.

**Goal:** Ship whitelist-based cookie cleanup (manual "Clean now" + optional daily sweep) to capture Cookie AutoDelete's orphaned base, plus lightweight cookie-audit flags for the dev segment.

**Architecture:** Extend the `lib/rules` model with a keep-list + an auto-sweep flag; a pure `computeCleanup` used by both a store `cleanupNow()` and the SW daily alarm; a pure `lib/audit.ts` surfaced as a per-row ⚠ badge. All Free.

**Tech Stack:** WXT + React 19 + TS, Zustand, Vitest, `chrome.alarms` (already granted).

## Global Constraints

- **No `tabs` permission** → no on-tab-close cleanup (that's why CAD needed `tabs`). Bokal's cleanup is on-demand + an optional daily `chrome.alarms` sweep. Every piece of UI copy must state this honestly.
- Protected cookies are never removed by cleanup (reuse the data-layer `isProtected` guard).
- All M10 features are Free (the CAD-capture play). Scheduled/advanced sweeps are a documented candidate Pro lever to revisit with launch data — do NOT gate anything Pro in M10.
- No new permissions (reuse `alarms`, `cookies`, `storage`, `<all_urls>`). No value logging; text-node rendering preserved. Free build ships no Pro code.
- The CWS single-purpose statement ("cookie manager") must still literally cover cleanup.
- Commit per task; keep `pnpm -r test` + `tsc` green.

---

### Task 1: Cleanup model (keep-list + computeCleanup) — pure lib

**Files:**
- Modify: `apps/cookie-manager/lib/rules/rules.ts` (extend `Rules`; add `matchesKeep`, `computeCleanup`)
- Modify: `apps/cookie-manager/lib/rules/rules.test.ts` (new cases + update the round-trip object)

**Interfaces:**
- `Rules` gains `keepDomains: string[]` and `autoSweep: boolean`.
- `matchesKeep(rules, c): boolean` (suffix match like `matchesBlock`).
- `computeCleanup(cookies: CookieAttrs[], rules: Rules): CookieAttrs[]` — returns cookies to remove: NOT on the keep-list AND NOT protected.
- `loadRules` fills the two new fields with defaults (migration-safe for old stored data).

- [ ] **Step 1: Update the round-trip test** to include `keepDomains: []`/`autoSweep: false`, and add:

```ts
it('computeCleanup removes non-kept, non-protected cookies', () => {
  const keep = c({ name: 'k', domain: 'mysite.com' });
  const gone = c({ name: 'g', domain: 'tracker.com' });
  const prot = c({ name: 'p', domain: 'tracker.com' });
  const r: Rules = { protectedIds: [cookieId(prot)], pinnedIds: [], blockedDomains: [], keepDomains: ['mysite.com'], autoSweep: false };
  const out = computeCleanup([keep, gone, prot], r);
  expect(out.map((x) => x.name)).toEqual(['g']); // keep kept, protected kept, tracker removed
});
it('loadRules fills new fields as defaults for old data', async () => {
  await chrome.storage.local.set({ 'bokal:rules': { protectedIds: ['x'] } });
  const r = await loadRules();
  expect(r).toEqual({ protectedIds: ['x'], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false });
});
```

- [ ] **Step 2:** Run `pnpm --filter @bokal/cookie-manager exec vitest run lib/rules/rules.test.ts` → FAIL.
- [ ] **Step 3: Implement** — add fields to `Rules` + `EMPTY`; `loadRules` returns all five with `?? []`/`?? false`; `matchesKeep` mirrors `matchesBlock`; `computeCleanup = cookies.filter((c) => !matchesKeep(rules, c) && !isProtected(rules, c))`.
- [ ] **Step 4:** Run → PASS; `pnpm -r test` green.
- [ ] **Step 5: Commit** `feat(m10): cleanup model — keep-list + computeCleanup`

---

### Task 2: "Clean now" + keep-list UI + optional daily sweep

**Files:**
- Modify: `apps/cookie-manager/stores/cookies-store.ts` (add `cleanupNow(): Promise<{ removed: number; failed: number }>`)
- Modify: `apps/cookie-manager/stores/rules-store.ts` (add `addKeep`/`removeKeep`/`setAutoSweep`)
- Create: `apps/cookie-manager/components/CleanupRules.tsx` (keep-list editor, Clean-now button, auto-sweep toggle, honest copy)
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx` (render `<CleanupRules />`)
- Modify: `apps/cookie-manager/entrypoints/background.ts` (daily `bokal:cleanup` alarm when `autoSweep`, running `computeCleanup`)

**Interfaces:**
- `cleanupNow()` — `getAllCookies()` → `computeCleanup` → `removeCookie` each → refresh; returns counts.
- SW: on `autoSweep` true, ensure a daily `bokal:cleanup` alarm; on false, clear it. Alarm handler runs the same cleanup. React to the `bokal:rules` change to add/clear the alarm.

- [ ] **Step 1:** `cookies-store.cleanupNow` — `const rules = await loadRules(); const removable = computeCleanup(await getAllCookies(), rules);` loop `removeCookie`; count; `recordAction` if removed; refresh. (Needs `<all_urls>` — same as the all view.)
- [ ] **Step 2:** `rules-store` — `addKeep(domain)` (lowercase/trim), `removeKeep(domain)`, `setAutoSweep(bool)` (persist to rules).
- [ ] **Step 3:** `CleanupRules.tsx` — a `<details>` section: keep-list input+list; "Clean now" button (`cookiesStore.getState().cleanupNow()` → status "Removed N, kept M"); an auto-sweep checkbox. Copy: "Clean now deletes all cookies except your keep-list (protected cookies are always kept). Auto-sweep runs once a day while your browser is open — Bokal has no ‘tabs’ permission, so it can't clear cookies the moment you close a tab." No values shown.
- [ ] **Step 4:** `background.ts` — a helper `syncCleanupAlarm()`: `const { autoSweep } = await loadRules(); if (autoSweep) chrome.alarms.create('bokal:cleanup', { periodInMinutes: 60*24 }); else chrome.alarms.clear('bokal:cleanup');`. Call it on startup and on `storage.onChanged` for `bokal:rules`. In `onAlarm`, on `'bokal:cleanup'` run `computeCleanup(await getAllCookies(), await loadRules())` and remove each (reuse cached rules; never log values).
- [ ] **Step 5:** `App.tsx` — render `<CleanupRules />` near `<BlockRules />`.
- [ ] **Step 6:** `tsc` clean; `pnpm -r test` green; `build` ok; redaction green.
- [ ] **Step 7: Commit** `feat(m10): whitelist cookie cleanup — Clean now + optional daily sweep`

---

### Task 3: Cookie audit flags — pure lib

**Files:**
- Create: `apps/cookie-manager/lib/audit.ts`
- Create: `apps/cookie-manager/lib/audit.test.ts`

**Interfaces:**
- `interface AuditFlag { level: 'info' | 'warn'; message: string }`
- `auditCookie(c: CookieAttrs): AuditFlag[]` — client-side derivation from attributes.

Flags (attribute-only, no network knowledge):
- `sameSite === 'unspecified'` → warn "No SameSite attribute (Chrome treats it as Lax)".
- `sameSite === 'no_restriction' && !c.partitionKey` → warn "Cross-site (SameSite=None) but not partitioned (CHIPS)".
- `!c.secure` → info "Not marked Secure (sent over HTTP)".
- name+value bytes near `NAME_VALUE_MAX` (≥ 3277, i.e. 80%) → info "Large cookie (near the 4096-byte limit)".

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { auditCookie } from './audit';
const c = (o = {}) => ({ name: 'a', value: '1', domain: 'ex.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: true, ...o });
describe('auditCookie', () => {
  it('flags no SameSite', () => { expect(auditCookie(c({ sameSite: 'unspecified' })).some((f) => /SameSite/.test(f.message))).toBe(true); });
  it('flags SameSite=None without partition', () => { expect(auditCookie(c({ sameSite: 'no_restriction' })).some((f) => /partitioned/i.test(f.message))).toBe(true); });
  it('does not flag SameSite=None WITH a partition', () => { expect(auditCookie(c({ sameSite: 'no_restriction', partitionKey: { topLevelSite: 'https://a.com' } })).some((f) => /partitioned/i.test(f.message))).toBe(false); });
  it('flags insecure', () => { expect(auditCookie(c({ secure: false })).some((f) => /Secure/.test(f.message))).toBe(true); });
  it('is clean for a well-formed cookie', () => { expect(auditCookie(c({ sameSite: 'lax', secure: true }))).toEqual([]); });
});
```

- [ ] **Step 2:** Run → FAIL → implement `audit.ts` (import `NAME_VALUE_MAX` from `./cookies/validation`; `byteLen` via `TextEncoder`) → PASS.
- [ ] **Step 3: Commit** `feat(m10): cookie audit flags (attribute risk hints)`

---

### Task 4: Audit badge in the row

**Files:**
- Modify: `apps/cookie-manager/components/CookieRow.tsx` (⚠ badge when `auditCookie(cookie).length`, title lists messages)

- [ ] **Step 1:** In `CookieRow`, `const flags = auditCookie(cookie);` render, next to the CHIPS badge, `{flags.length > 0 && <span title={flags.map((f) => f.message).join('\n')} style={{ fontSize: 10, color: 'var(--bokal-muted)', marginLeft: 4 }}>⚠</span>}`. No value in the title. Keep value a text node.
- [ ] **Step 2:** `tsc` clean; `pnpm -r test` green (CookieRow XSS test still passes); `build` ok.
- [ ] **Step 3: Commit** `feat(m10): per-row audit badge`

---

### Task 5: Docs + full verification gate

**Files:**
- Modify: `docs/store/listing.md` (add auto-delete/cleanup + audit to FEATURES)
- Modify: `docs/threat-model.md` (note the daily cleanup alarm + that cleanup honors protection and is on-demand/scheduled, not on-tab-close)

- [ ] **Step 1:** Add to `listing.md` FEATURES: "Automatic cleanup: keep-list plus one-click or daily removal of everything else (protected cookies always kept)." and "Cookie audit hints: flags missing SameSite, unpartitioned cross-site cookies, and more." Update `threat-model.md` §2 with the `bokal:cleanup` alarm behavior.
- [ ] **Step 2: Full gate:**
  ```bash
  pnpm -r test && pnpm --filter @bokal/cookie-manager exec tsc --noEmit
  pnpm --filter @bokal/cookie-manager build && pnpm --filter @bokal/cookie-manager zip
  pnpm --filter @bokal/cookie-manager exec playwright test
  pnpm --filter @bokal/cookie-manager build:e2e && BOKAL_E2E=1 pnpm --filter @bokal/cookie-manager exec playwright test
  ```
  Confirm: tests green; manifest `permissions` still exactly `["cookies","storage","sidePanel","unlimitedStorage","alarms"]`, no `host_permissions`; ProfilesPanel still a separate chunk; E2E green both builds.
- [ ] **Step 3: Commit** `docs(m10): listing + threat-model for cleanup and audit`

---

## Self-Review

- **Spec coverage:** M10 spec table → T1/T2 (auto-delete cleanup), T3/T4 (audit aids). ✓
- **Placeholder scan:** all steps have real code/commands. ✓
- **Type consistency:** `Rules` extended once; `matchesKeep`/`computeCleanup`/`cleanupNow`/`addKeep`/`removeKeep`/`setAutoSweep`/`auditCookie`/`AuditFlag` consistent lib→store→components. ✓
- **Invariant check:** no `tabs`; honesty copy on cleanup timing; protection honored in cleanup; no Pro code; no value logging; single-purpose still covered. ✓
