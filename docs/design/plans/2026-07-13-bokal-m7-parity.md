# Bokal — Milestone 7: Pre-launch Parity + Bug Fixes — Plan


**Goal:** Close the below-parity feature gaps and fix the verified correctness bugs found in the post-build market/code review, so Bokal meets (and, on trust, beats) Cookie-Editor at launch.

**Scope (all directed by the user):** bulk delete-all, copy-value + copy-as-header + clipboard export, header-string import, profile apply-as-**replace** (not merge) + in-panel passphrase, all-cookies view, attribute-length validation (wire the dead constant) + a domain-count soft warning, and the bugs: daily-alarm reset, stale panel on same-tab navigation, entitlement-store missing seq-guard, profiles-store missing try/catch, and the CHIPS site-derivation + cross-panel theme sync deferrals.

**Not in scope (explicitly):** payment wiring (user is doing accounts), Firefox port, block/protect cookies (v1.1), popup/devtools surfaces (v1.1). The per-window session-cache flash is **already resolved** by the M6 `ready` gate (the stale snapshot is never rendered — "Loading…" shows until the fresh refresh) and needs no change; noted here so it isn't re-opened.

**Tech Stack:** unchanged.

## Global Constraints
_Inherits all prior constraints (minimal manifest, text-node rendering, no `any`, strict TS, values never logged, chrome.storage source of truth)._ Additions:
- "Delete all" and "apply-as-replace" are destructive → always behind an explicit `confirm()` naming the count/scope.
- Clipboard writes go through `navigator.clipboard.writeText`; copying a value is a user action, never logged.
- No new install-time permissions (clipboard write needs none in an extension page; `windows`/`tabs.onUpdated` need none beyond what we have).

---

## File Structure (added/modified)
```
apps/cookie-manager/
  lib/io/header.ts / header.test.ts     # NEW toHeaderString + parseHeaderString (pure, TDD)
  lib/cookies/validation.ts / .test.ts   # MODIFY wire ATTR_VALUE_MAX (attr-length checks)
  lib/clipboard.ts                        # NEW copyText helper
  lib/cookies/read.ts                     # MODIFY getAllCookies + accurate CHIPS site (getPartitionKey)
  stores/cookies-store.ts                 # MODIFY scope(site|all) + deleteAllForSite + all-cookies refresh
  stores/entitlement-store.ts             # MODIFY seq-guard
  stores/profiles-store.ts                # MODIFY apply-as-replace + try/catch in load/remove
  components/CookieRow.tsx                # MODIFY copy-value button
  components/IoBar.tsx                    # MODIFY copy-as-header, delete-all, header-string import
  components/pro/ProfilesPanel.tsx         # MODIFY in-panel passphrase + replace/merge toggle
  entrypoints/background.ts               # MODIFY alarm-reset guard
  entrypoints/sidepanel/App.tsx            # MODIFY tabs.onUpdated, all-cookies toggle, domain-count warning
  packages/ui-kit/useTheme.ts             # MODIFY storage.onChanged live-sync
```

---

## Task 1: Reliability bug fixes (background + stores)

**Files:** Modify `entrypoints/background.ts`, `entrypoints/sidepanel/App.tsx`, `stores/entitlement-store.ts`, `stores/profiles-store.ts`

- [ ] **Step 1: Alarm-reset guard.** In `entrypoints/background.ts`, `chrome.alarms.create(...)` runs on every SW wake, which resets the 24h timer so the daily re-check never fires for active users. Replace the bare create (line 17) with a guarded create:
```ts
  void chrome.alarms.get('bokal:entitlement').then((existing) => {
    if (!existing) chrome.alarms.create('bokal:entitlement', { periodInMinutes: 60 * 24 });
  });
```
(Keep the `onAlarm` listener registration synchronous at top level, exactly as-is on lines 18-20.)
- [ ] **Step 2: Refresh on same-tab navigation.** In `entrypoints/sidepanel/App.tsx`, the panel doesn't update when a tab navigates in place (no `tabs.onUpdated`). In the mount `useEffect`, after the `chrome.tabs.onActivated.addListener(onActivated)` line, add:
```ts
    const onUpdated = (_tabId: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void => {
      if (info.status === 'complete' && tab.active) void cookiesStore.getState().refresh();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
```
and in the cleanup `return () => { ... }`, add `chrome.tabs.onUpdated.removeListener(onUpdated);`.
- [ ] **Step 3: Entitlement-store seq-guard.** In `stores/entitlement-store.ts`, overlapping `refresh()` calls can let a stale result win. Add a module-level `let entSeq = 0;` above `createStore`, and in `refresh` capture `const seq = ++entSeq;` first, then guard each `set(...)` with `if (seq === entSeq)`:
```ts
  refresh: async () => {
    const seq = ++entSeq;
    if (seq === entSeq) set({ loading: true });
    const cached = await readCache();
    if (seq === entSeq) set({ entitled: isEntitled(cached, Date.now(), GRACE_MS) });
    const fresh = await syncEntitlementCache();
    if (seq !== entSeq) return;
    if (fresh) set({ entitled: isEntitled(fresh, Date.now(), GRACE_MS) });
    set({ loading: false });
  },
```
- [ ] **Step 4: profiles-store try/catch.** In `stores/profiles-store.ts`, `load` and `remove` have no error handling (an IndexedDB failure becomes an unhandled rejection). Wrap each body:
```ts
  load: async () => {
    try {
      const profiles = await getAllProfiles();
      profiles.sort((a, b) => b.createdAt - a.createdAt);
      set({ profiles });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  remove: async (id) => {
    try {
      await deleteProfileDb(id);
      await get().load();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
```
- [ ] **Step 5: Verify** `tsc --noEmit` exit 0; `test` green (54); `build` ok; E2E smoke green (`playwright test` → 2 passed / 1 skipped). **Commit** `git add -A apps/cookie-manager && git commit -m "fix: alarm-reset guard, same-tab-nav refresh, entitlement seq-guard, profiles store try/catch"`

---

## Task 2: Header-string format lib + attribute-length validation (pure, TDD)

**Files:** Create `lib/io/header.ts`, `lib/io/header.test.ts`; Modify `lib/cookies/validation.ts`, `lib/cookies/validation.test.ts`

**Interfaces:** `function toHeaderString(cookies: Pick<CookieAttrs,'name'|'value'>[]): string`; `function parseHeaderString(text: string, domain: string): CookieAttrs[]`.

- [ ] **Step 1: Failing tests** — `lib/io/header.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { toHeaderString, parseHeaderString } from './header';

describe('toHeaderString', () => {
  it('joins name=value pairs with "; "', () => {
    expect(toHeaderString([{ name: 'a', value: '1' }, { name: 'b', value: '2' }])).toBe('a=1; b=2');
  });
});

describe('parseHeaderString', () => {
  it('parses a raw a=b; c=d string, scoping to the domain', () => {
    const out = parseHeaderString('sid=abc; theme=dark', 'example.com');
    expect(out.map((c) => [c.name, c.value])).toEqual([['sid', 'abc'], ['theme', 'dark']]);
    expect(out[0]!.domain).toBe('example.com');
    expect(out[0]!.path).toBe('/');
  });
  it('strips a leading "Cookie:" prefix', () => {
    expect(parseHeaderString('Cookie: a=1', 'e.com').map((c) => c.name)).toEqual(['a']);
  });
  it('keeps "=" inside a value (base64)', () => {
    expect(parseHeaderString('t=YWJj==', 'e.com')[0]!.value).toBe('YWJj==');
  });
  it('ignores empty and malformed segments', () => {
    expect(parseHeaderString('; a=1 ;; broken ; =nope', 'e.com').map((c) => c.name)).toEqual(['a']);
  });
});
```
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement** — `lib/io/header.ts`
```ts
import type { CookieAttrs } from '../cookie-types';

// "name=value; name2=value2" — no attributes, order preserved.
export function toHeaderString(cookies: Pick<CookieAttrs, 'name' | 'value'>[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

// Parse a Cookie header (or a raw "a=b; c=d" string) into cookies scoped to `domain`.
export function parseHeaderString(text: string, domain: string): CookieAttrs[] {
  const body = text.replace(/^\s*cookie\s*:/i, '').trim();
  const out: CookieAttrs[] = [];
  for (const part of body.split(';')) {
    const seg = part.trim();
    if (!seg) continue;
    const eq = seg.indexOf('=');
    if (eq <= 0) continue;
    const name = seg.slice(0, eq).trim();
    const value = seg.slice(eq + 1).trim();
    if (!name) continue;
    out.push({ name, value, domain, path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false });
  }
  return out;
}
```
- [ ] **Step 4: Wire the dead `ATTR_VALUE_MAX` constant (attribute-length checks).** In `lib/cookies/validation.ts`, inside `validateCookie` (after the name/value size check), add:
```ts
  if (byteLen(c.domain) > ATTR_VALUE_MAX) issues.push({ field: 'domain', message: `domain exceeds ${ATTR_VALUE_MAX} bytes` });
  if (byteLen(c.path) > ATTR_VALUE_MAX) issues.push({ field: 'path', message: `path exceeds ${ATTR_VALUE_MAX} bytes` });
```
And add to `lib/cookies/validation.test.ts` (inside the existing describe):
```ts
  it('rejects an over-long path', () => {
    const issues = validateCookie(base({ path: '/' + 'x'.repeat(1024) }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'path')).toBe(true);
  });
```
- [ ] **Step 5: Run → PASS** (now 60: +5 header, +1 validation), `tsc --noEmit` exit 0. **Commit** `git add -A apps/cookie-manager && git commit -m "feat: header-string cookie format (TDD) + wire attribute-length validation"`

---

## Task 3: Copy actions, clipboard export, bulk delete-all, header import

**Files:** Create `lib/clipboard.ts`; Modify `stores/cookies-store.ts`, `components/CookieRow.tsx`, `components/IoBar.tsx`

- [ ] **Step 1: clipboard helper** — `lib/clipboard.ts`
```ts
// Copy text to the clipboard. Returns true on success. Never logs the text.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```
- [ ] **Step 2: store `deleteAllForSite`.** In `stores/cookies-store.ts`, add to the interface `deleteAllForSite: (cookies: CookieAttrs[]) => Promise<{ removed: number; failed: number }>;` and implement (after `deleteCookie`):
```ts
  deleteAllForSite: async (list) => {
    let removed = 0;
    let failed = 0;
    for (const c of list) {
      try { await removeCookie(c); removed += 1; } catch { failed += 1; }
    }
    await get().refresh();
    return { removed, failed };
  },
```
- [ ] **Step 3: CookieRow copy-value.** In `components/CookieRow.tsx`, add a copy button before the delete button. Import `copyText`:
```tsx
import { copyText } from '../lib/clipboard';
```
and add (between the value `<button>` and the delete `<button>`):
```tsx
      <button type="button" aria-label={`Copy value of ${cookie.name}`} title="Copy value" onClick={() => void copyText(cookie.value)} style={{ flexShrink: 0 }}>⧉</button>
```
- [ ] **Step 4: IoBar — copy-as-header, delete-all, header-string import.** In `components/IoBar.tsx`:
  - Imports: add `import { toHeaderString } from '../lib/io/header';`, `import { parseHeaderString } from '../lib/io/header';`, `import { copyText } from '../lib/clipboard';`.
  - Read cookies (already does). Add a `Copy header` button:
```tsx
      <button type="button" onClick={() => void copyText(toHeaderString(cookies)).then((ok) => setStatus(ok ? `Copied ${cookies.length} cookies as a header` : 'Copy failed'))}>Copy header</button>
```
  - Add a `Delete all` button (confirm, uses the store action):
```tsx
      <button type="button" onClick={() => { if (cookies.length && confirm(`Delete all ${cookies.length} cookies shown?`)) void cookiesStore.getState().deleteAllForSite(cookies).then((r) => setStatus(`Deleted ${r.removed}${r.failed ? `, ${r.failed} failed` : ''}`)); }}>Delete all</button>
```
  - Make import auto-detect header vs JSON. In `onImportFile`, replace the parse block so that if `parseCookiesJson` yields no cookies AND the text isn't JSON-shaped, it falls back to header parsing scoped to the active domain:
```ts
    let cookies = parseCookiesJson(text).cookies;
    let note = '';
    if (cookies.length === 0) {
      let domain = 'example.com';
      try { if (activeUrl) domain = new URL(activeUrl).hostname; } catch { /* keep default */ }
      cookies = parseHeaderString(text, domain);
      note = cookies.length ? ' (as header string)' : '';
    }
    if (cookies.length === 0) { setStatus('Import failed: not valid JSON or a cookie header'); return; }
    const res = await cookiesStore.getState().importCookies(cookies);
    setStatus(`Imported ${res.imported}, failed ${res.failed}${note}`);
```
  (Update the file input `accept` to also allow `.txt`: `accept="application/json,.json,.txt,text/plain"`. Relabel the button `Import` since it now takes JSON or header.)
- [ ] **Step 5: Verify** `tsc --noEmit` exit 0; `test` green (60); `build` ok. **Commit** `git add -A apps/cookie-manager && git commit -m "feat: copy value, copy-as-header, bulk delete-all, header-string import"`

---

## Task 4: Profile apply-as-replace + in-panel passphrase

**Files:** Modify `stores/profiles-store.ts`, `components/pro/ProfilesPanel.tsx`

- [ ] **Step 1: apply-as-replace in the store.** In `stores/profiles-store.ts`:
  - Import `removeCookie` and `getCookiesForUrl` and `cookieUrl`:
```ts
import { setCookie, removeCookie } from '../lib/cookies/write';
import { cookieUrl } from '../lib/cookies/keys';
import { getCookiesForUrl } from '../lib/cookies/read';
```
  - Change the `apply` signature to `apply: (id: string, opts?: { passphrase?: string; replace?: boolean }) => Promise<{ applied: number; failed: number; removed: number }>;` and reimplement so that when `replace` is true it first removes existing cookies for each URL the profile targets, then applies:
```ts
  apply: async (id, opts) => {
    set({ busy: true, error: null });
    try {
      const profile = get().profiles.find((p) => p.id === id);
      if (!profile) throw new Error('Profile not found');
      const cookies = await cookiesOf(profile, opts?.passphrase);
      let removed = 0;
      if (opts?.replace) {
        // Clear existing cookies for every URL this profile touches, then apply — a true restore.
        const urls = [...new Set(cookies.map((c) => cookieUrl(c)))];
        for (const url of urls) {
          for (const existing of await getCookiesForUrl(url)) {
            try { await removeCookie(existing); removed += 1; } catch { /* best effort */ }
          }
        }
      }
      let applied = 0;
      let failed = 0;
      for (const c of cookies) {
        try { await setCookie(c); applied += 1; } catch { failed += 1; }
      }
      await cookiesStore.getState().refresh();
      return { applied, failed, removed };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return { applied: 0, failed: 0, removed: 0 };
    } finally {
      set({ busy: false });
    }
  },
```
- [ ] **Step 2: ProfilesPanel — in-panel passphrase + replace toggle.** In `components/pro/ProfilesPanel.tsx`:
  - Add state: `const [applyReplace, setApplyReplace] = useState(true);` and `const [applyPass, setApplyPass] = useState('');` and `const [applyingId, setApplyingId] = useState<string | null>(null);`
  - Replace `onApply` so it no longer uses `prompt`/`alert`. When a profile is encrypted, reveal an inline passphrase field for that row (via `applyingId`); apply calls the new signature:
```tsx
  async function doApply(id: string, encrypted: boolean) {
    const res = await profilesStore.getState().apply(id, { passphrase: encrypted ? applyPass : undefined, replace: applyReplace });
    setApplyingId(null);
    setApplyPass('');
    if (res.applied || res.failed || res.removed) {
      setNotice(`Applied ${res.applied}${res.replace ? '' : ''}${res.removed ? `, replaced ${res.removed}` : ''}${res.failed ? `, ${res.failed} failed` : ''}.`);
    }
  }
```
  (Add a `const [notice, setNotice] = useState<string | null>(null);` and render it near `error`. Note the `res.replace` reference above is illustrative — do NOT reference a non-existent field; the actual message should read: `Applied ${res.applied}${res.removed ? `, replaced ${res.removed}` : ''}${res.failed ? `, ${res.failed} failed` : ''}.`)
  - Add a global "Replace (clear site cookies first)" checkbox near the top: `<label style={{ fontSize: 11, color: 'var(--bokal-muted)' }}><input type="checkbox" checked={applyReplace} onChange={(e) => setApplyReplace(e.target.checked)} /> Apply replaces (clears the site's current cookies first)</label>`
  - In each list `<li>`, replace the single Apply button so encrypted profiles first expand an inline `<input type="password">`: when `applyingId === p.id`, show the password input + a confirm "Apply" that calls `doApply(p.id, true)`; otherwise the Apply button either calls `doApply(p.id, false)` (unencrypted) or `setApplyingId(p.id)` (encrypted, to reveal the field).
- [ ] **Step 3: Verify** `tsc --noEmit` exit 0; `test` green (60); `build` ok — confirm ProfilesPanel is still a SEPARATE chunk (dynamic import intact). No `prompt`/`alert` remain in ProfilesPanel. **Commit** `git add -A apps/cookie-manager && git commit -m "feat: profile apply-as-replace (true restore) + in-panel passphrase"`

---

## Task 5: All-cookies view + domain-count soft warning

**Files:** Modify `lib/cookies/read.ts`, `stores/cookies-store.ts`, `entrypoints/sidepanel/App.tsx`

- [ ] **Step 1: read all cookies.** In `lib/cookies/read.ts`, add:
```ts
export async function getAllCookies(): Promise<CookieAttrs[]> {
  const cookies = await chrome.cookies.getAll({});
  return cookies.map(fromChrome);
}
```
- [ ] **Step 2: store scope.** In `stores/cookies-store.ts`:
  - Import `getAllCookies` from read.
  - Interface: add `scope: 'site' | 'all';` and `setScope: (s: 'site' | 'all') => void;`
  - Initial state: `scope: 'site',`; action `setScope: (s) => { set({ scope: s }); void get().refresh(); },`
  - In `refresh`, after the `granted` check, branch on scope. Replace the `const activeUrl = ...; let cookies = ...` block with:
```ts
      const scope = get().scope;
      const activeUrl = await getActiveTabUrl();
      let cookies: CookieAttrs[];
      if (scope === 'all') {
        cookies = await getAllCookies();
      } else {
        cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
        if (activeUrl && get().showPartitioned) {
          cookies = cookies.concat(await getPartitionedCookiesForUrl(activeUrl));
        }
      }
```
  (Keep the seq-guard and the storage.session write unchanged below it.)
- [ ] **Step 3: App — scope toggle + domain-count warning.** In `entrypoints/sidepanel/App.tsx`:
  - Read `const scope = useCookiesStore((s) => s.scope);`
  - In the count/header row, add a scope selector next to the count:
```tsx
        <select aria-label="Scope" value={scope} onChange={(e) => cookiesStore.getState().setScope(e.target.value as 'site' | 'all')} style={{ fontSize: 11 }}>
          <option value="site">This site</option>
          <option value="all">All cookies</option>
        </select>
```
  - Import `SOFT_DOMAIN_COOKIE_WARN` from `../../lib/cookies/validation` and, when `scope === 'site' && cookies.length >= SOFT_DOMAIN_COOKIE_WARN`, render a soft warning line above the list:
```tsx
      {scope === 'site' && cookies.length >= SOFT_DOMAIN_COOKIE_WARN && (
        <div style={{ fontSize: 11, color: 'var(--bokal-muted)', marginBottom: 6 }}>⚠ {cookies.length} cookies — near Chrome's ~180-per-domain limit.</div>
      )}
```
- [ ] **Step 4: Verify** `tsc --noEmit` exit 0; `test` green (60); `build` ok. E2E smoke still green. **Commit** `git add -A apps/cookie-manager && git commit -m "feat: all-cookies view toggle + domain-count soft warning"`

---

## Task 6: Accurate CHIPS site (getPartitionKey) + cross-panel theme sync

**Files:** Modify `lib/cookies/read.ts`, `apps/cookie-manager/types/chrome.d.ts` (if needed), `packages/ui-kit/useTheme.ts`

- [ ] **Step 1: Accurate partition site via `getPartitionKey` (feature-detected).** In `lib/cookies/read.ts`, prefer the browser's real partition key (Chrome 130+/`getPartitionKey`) over the `siteFromUrl` heuristic. Add a resolver and use it in `getPartitionedCookiesForUrl`:
```ts
async function activePartitionSite(fallbackUrl: string): Promise<string | null> {
  const api = chrome.cookies as { getPartitionKey?: (d: { tabId: number; frameId: number }) => Promise<{ partitionKey: { topLevelSite?: string } }> };
  if (typeof api.getPartitionKey === 'function') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id !== undefined) {
        const { partitionKey } = await api.getPartitionKey({ tabId: tab.id, frameId: 0 });
        if (partitionKey?.topLevelSite) return partitionKey.topLevelSite;
      }
    } catch { /* fall through to heuristic */ }
  }
  return siteFromUrl(fallbackUrl);
}
```
and change `getPartitionedCookiesForUrl` to use it:
```ts
export async function getPartitionedCookiesForUrl(url: string): Promise<CookieAttrs[]> {
  const site = await activePartitionSite(url);
  if (!site) return [];
  try {
    const cookies = await chrome.cookies.getAll({ url, partitionKey: { topLevelSite: site } });
    return cookies.map(fromChrome);
  } catch {
    return [];
  }
}
```
  If `tsc` complains that `getPartitionKey` isn't on the `@types/chrome` `cookies` type, the inline structural cast above avoids it (no `any`). If any other type gap appears, add a minimal documented augmentation to `apps/cookie-manager/types/chrome.d.ts` following the existing pattern there. Update the stale comment in `lib/site.ts` to note the resolver now prefers `getPartitionKey`.
- [ ] **Step 2: Cross-panel theme live-sync.** In `packages/ui-kit/useTheme.ts`, a theme change in one open panel doesn't update another. Add a `chrome.storage.onChanged` listener in the effect so all panels stay in sync:
```ts
  useEffect(() => {
    void chrome.storage.local.get(KEY).then((r) => {
      const m = (r[KEY] as ThemeMode | undefined) ?? 'system';
      setMode(m);
      applyTheme(m);
    });
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'local' && changes[KEY]) {
        const m = (changes[KEY].newValue as ThemeMode | undefined) ?? 'system';
        setMode(m);
        applyTheme(m);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);
```
- [ ] **Step 3: Verify** `tsc --noEmit` exit 0; `test` green (60); `build` ok. **Commit** `git add -A && git commit -m "feat: accurate CHIPS site via getPartitionKey + cross-panel theme live-sync"`

---

## Self-Review (spec coverage)
- Bulk delete-all (confirm) → Task 3. ✅
- Copy value + copy-as-header + clipboard export → Tasks 1(lib),3. ✅
- Header-string import → Tasks 2,3. ✅
- Profile apply-as-**replace** (true restore) + in-panel passphrase → Task 4. ✅
- All-cookies view → Task 5. ✅
- Attribute-length validation (dead constant wired) + domain-count warning → Tasks 2,5. ✅
- Bugs: alarm reset, same-tab-nav, entitlement seq-guard, profiles try/catch, CHIPS site, theme sync → Tasks 1,6. ✅
- Per-window cache flash: resolved by the M6 `ready` gate (no change). ✅ (documented)

**Deferred (unchanged):** payment wiring (user), Firefox port, block/protect cookies, popup/devtools surfaces, Netscape *import*.
