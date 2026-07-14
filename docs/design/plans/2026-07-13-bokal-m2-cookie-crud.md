# Bokal — Milestone 2: Cookie CRUD — Implementation Plan


**Goal:** Turn the read-only viewer into full create/edit/delete of cookies, with the M1 validation rules wired into the form and safe writes through the `chrome.cookies` API.

**Architecture:** A pure `toSetDetails` mapper (CookieAttrs → `chrome.cookies.SetDetails`) plus thin `setCookie`/`removeCookie` wrappers; new store actions `saveCookie`/`deleteCookie` that write then refresh; a `CookieEditor` form that surfaces `validateCookie` issues and blocks invalid saves; row-level edit/delete affordances. `refresh()` gains an in-flight guard (M1 review carry-forward) now that writes can trigger overlapping refreshes.

**Tech Stack:** unchanged from M1 (WXT/React 19/TS/Zustand/Vitest).

## Global Constraints
_Inherits all M1 Global Constraints (minimal manifest, text-node rendering, no `any`, strict TS, chrome.storage source of truth, values never logged)._ Additions:
- Writes go only through `chrome.cookies.set`/`remove` (never `document.cookie`). HttpOnly cookies are editable this way — that is intended.
- A cookie edit that fails validation (`validateCookie` returns issues) must NOT call `set()`; show the issues instead.
- Cookie expiry is stored in **seconds** since epoch (chrome.cookies convention), not milliseconds.
- Host-only cookies (`hostOnly:true`, incl. all `__Host-`) are written by **omitting `domain`** from SetDetails.

---

## File Structure (added/modified this milestone)
```
apps/cookie-manager/
  lib/origin.ts                 # NEW isSecureOrigin(url) (pure, TDD)
  lib/origin.test.ts            # NEW
  lib/cookies/write.ts          # NEW toSetDetails (pure) + setCookie/removeCookie (integration)
  lib/cookies/write.test.ts     # NEW (TDD for toSetDetails)
  stores/cookies-store.ts       # MODIFY add saveCookie/deleteCookie + refresh in-flight guard
  components/CookieEditor.tsx    # NEW add/edit form
  components/CookieRow.tsx      # MODIFY edit-on-click + delete button
  entrypoints/sidepanel/App.tsx  # MODIFY view state (list|editor), Add button
```

---

## Task 1: `isSecureOrigin` (pure, TDD)

**Files:** Create `apps/cookie-manager/lib/origin.ts`, `apps/cookie-manager/lib/origin.test.ts`

**Interfaces:** Produces `function isSecureOrigin(url: string): boolean` — true for https and localhost/loopback http (secure contexts).

- [ ] **Step 1: Failing test** — `apps/cookie-manager/lib/origin.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { isSecureOrigin } from './origin';

describe('isSecureOrigin', () => {
  it('is true for https', () => expect(isSecureOrigin('https://example.com/x')).toBe(true));
  it('is false for plain http', () => expect(isSecureOrigin('http://example.com/x')).toBe(false));
  it('is true for http localhost', () => expect(isSecureOrigin('http://localhost:3000/')).toBe(true));
  it('is true for http 127.0.0.1', () => expect(isSecureOrigin('http://127.0.0.1/')).toBe(true));
  it('is false for a non-url', () => expect(isSecureOrigin('not a url')).toBe(false));
});
```
- [ ] **Step 2: Run → FAIL** `pnpm --filter @bokal/cookie-manager test` (origin not found)
- [ ] **Step 3: Implement** — `apps/cookie-manager/lib/origin.ts`
```ts
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isSecureOrigin(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'http:' && LOOPBACK.has(u.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}
```
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `git add apps/cookie-manager/lib/origin.ts apps/cookie-manager/lib/origin.test.ts && git commit -m "feat: isSecureOrigin helper (TDD)"`

---

## Task 2: Write wrapper — `toSetDetails` (pure, TDD) + `setCookie`/`removeCookie`

**Files:** Create `apps/cookie-manager/lib/cookies/write.ts`, `apps/cookie-manager/lib/cookies/write.test.ts`

**Interfaces:**
- Consumes `CookieAttrs` from `../cookie-types`; `cookieUrl` from `./keys`.
- Produces:
  - `function toSetDetails(c: CookieAttrs): chrome.cookies.SetDetails`
  - `function setCookie(c: CookieAttrs): Promise<void>`
  - `function removeCookie(c: CookieAttrs): Promise<void>`

- [ ] **Step 1: Failing test** — `apps/cookie-manager/lib/cookies/write.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { toSetDetails } from './write';
import type { CookieAttrs } from '../cookie-types';

function base(overrides: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...overrides };
}

describe('toSetDetails', () => {
  it('builds url from the cookie and copies core fields', () => {
    const d = toSetDetails(base());
    expect(d.url).toBe('https://example.com/');
    expect(d.name).toBe('sid');
    expect(d.value).toBe('abc');
    expect(d.path).toBe('/');
    expect(d.secure).toBe(true);
    expect(d.sameSite).toBe('lax');
  });
  it('sets domain when not host-only', () => {
    expect(toSetDetails(base({ hostOnly: false, domain: 'example.com' })).domain).toBe('example.com');
  });
  it('omits domain when host-only', () => {
    expect('domain' in toSetDetails(base({ hostOnly: true }))).toBe(false);
  });
  it('omits expirationDate for a session cookie', () => {
    expect('expirationDate' in toSetDetails(base())).toBe(false);
  });
  it('includes expirationDate for a persistent cookie', () => {
    expect(toSetDetails(base({ expirationDate: 1893456000 })).expirationDate).toBe(1893456000);
  });
  it('passes through partitionKey', () => {
    const d = toSetDetails(base({ partitionKey: { topLevelSite: 'https://top.example', hasCrossSiteAncestor: true } }));
    expect(d.partitionKey).toEqual({ topLevelSite: 'https://top.example', hasCrossSiteAncestor: true });
  });
});
```
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement** — `apps/cookie-manager/lib/cookies/write.ts`
```ts
import type { CookieAttrs } from '../cookie-types';
import { cookieUrl } from './keys';

export function toSetDetails(c: CookieAttrs): chrome.cookies.SetDetails {
  const details: chrome.cookies.SetDetails = {
    url: cookieUrl(c),
    name: c.name,
    value: c.value,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
  };
  if (!c.hostOnly) details.domain = c.domain;
  if (c.expirationDate !== undefined) details.expirationDate = c.expirationDate;
  if (c.storeId !== undefined) details.storeId = c.storeId;
  if (c.partitionKey !== undefined) details.partitionKey = c.partitionKey;
  return details;
}

export async function setCookie(c: CookieAttrs): Promise<void> {
  await chrome.cookies.set(toSetDetails(c));
}

export async function removeCookie(c: CookieAttrs): Promise<void> {
  await chrome.cookies.remove({
    url: cookieUrl(c),
    name: c.name,
    storeId: c.storeId,
    partitionKey: c.partitionKey,
  });
}
```
- [ ] **Step 4: Run → PASS** (6 new tests)
- [ ] **Step 5: `tsc --noEmit` exit 0**, then commit `git add apps/cookie-manager/lib/cookies/write.ts apps/cookie-manager/lib/cookies/write.test.ts && git commit -m "feat: cookie write wrapper (toSetDetails TDD + set/remove)"`

---

## Task 3: Store `saveCookie`/`deleteCookie` + refresh in-flight guard

**Files:** Modify `apps/cookie-manager/stores/cookies-store.ts`

**Interfaces:**
- Consumes `setCookie`/`removeCookie` from `../lib/cookies/write`.
- Adds to the store: `saveCookie(c: CookieAttrs): Promise<{ ok: boolean; error?: string }>` and `deleteCookie(c: CookieAttrs): Promise<void>`.

- [ ] **Step 1: Add the guard + actions.** In `stores/cookies-store.ts`:
  1. Add import: `import { setCookie, removeCookie } from '../lib/cookies/write';`
  2. Add a module-level sequence counter above `createStore`: `let refreshSeq = 0;`
  3. Re-add the `get` param to the factory: change `createStore<CookiesState>((set) => ({` to `createStore<CookiesState>((set, get) => ({`.
  4. Extend the `CookiesState` interface with:
```ts
  saveCookie: (c: CookieAttrs) => Promise<{ ok: boolean; error?: string }>;
  deleteCookie: (c: CookieAttrs) => Promise<void>;
```
  5. Replace the `refresh` implementation with a sequence-guarded version:
```ts
  refresh: async () => {
    const seq = ++refreshSeq;
    set({ loading: true });
    try {
      const granted = await hasAllUrlsPermission();
      if (!granted) {
        if (seq === refreshSeq) set({ granted: false, activeUrl: null, cookies: [], loading: false });
        return;
      }
      const activeUrl = await getActiveTabUrl();
      const cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
      if (seq !== refreshSeq) return; // a newer refresh superseded this one
      set({ granted: true, activeUrl, cookies, loading: false });
      await chrome.storage.session.set({ [SESSION_KEY]: { activeUrl, cookies } });
    } catch (err) {
      console.error('[bokal] refresh failed', err);
      if (seq === refreshSeq) set({ loading: false });
    }
  },
```
  6. Add the two new actions (after `refresh`):
```ts
  saveCookie: async (c) => {
    try {
      await setCookie(c);
      await get().refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
  deleteCookie: async (c) => {
    await removeCookie(c);
    await get().refresh();
  },
```
  7. Add the `CookieAttrs` import if not already imported (it is, via the existing `import type { CookieAttrs } from '../lib/cookie-types';`).
- [ ] **Step 2: `tsc --noEmit` exit 0** and `pnpm --filter @bokal/cookie-manager test` (existing tests still green).
- [ ] **Step 3: Commit** `git add apps/cookie-manager/stores/cookies-store.ts && git commit -m "feat: store saveCookie/deleteCookie + refresh in-flight guard"`

---

## Task 4: `CookieEditor` form (add/edit with validation)

**Files:** Create `apps/cookie-manager/components/CookieEditor.tsx`

**Interfaces:**
- Consumes `CookieAttrs`/`SameSite` types, `validateCookie` from `../lib/cookies/validation`, `isSecureOrigin` from `../lib/origin`, `cookiesStore` from `../stores/cookies-store`.
- Produces `<CookieEditor initial={CookieAttrs} activeUrl={string|null} onDone={() => void} />`.

- [ ] **Step 1: Create the component** — `apps/cookie-manager/components/CookieEditor.tsx`
```tsx
import { useState } from 'react';
import type { CookieAttrs, SameSite } from '../lib/cookie-types';
import { validateCookie } from '../lib/cookies/validation';
import { isSecureOrigin } from '../lib/origin';
import { cookiesStore } from '../stores/cookies-store';

const SAME_SITE: SameSite[] = ['unspecified', 'lax', 'strict', 'no_restriction'];

// datetime-local <-> epoch seconds
function toLocalInput(epochSeconds?: number): string {
  if (epochSeconds === undefined) return '';
  const d = new Date(epochSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): number | undefined {
  if (!v) return undefined;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
}

const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 };
const labelStyle: React.CSSProperties = { fontSize: 11, color: '#666' };

export function CookieEditor({ initial, activeUrl, onDone }: { initial: CookieAttrs; activeUrl: string | null; onDone: () => void }) {
  const [draft, setDraft] = useState<CookieAttrs>(initial);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const secureOrigin = activeUrl ? isSecureOrigin(activeUrl) : false;
  const issues = validateCookie(draft, { isSecureOrigin: secureOrigin });
  const isSession = draft.expirationDate === undefined;

  function update<K extends keyof CookieAttrs>(k: K, v: CookieAttrs[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function onSave() {
    setSaveError(null);
    setBusy(true);
    const res = await cookiesStore.getState().saveCookie(draft);
    setBusy(false);
    if (res.ok) onDone();
    else setSaveError(res.error ?? 'Failed to save');
  }

  return (
    <div style={{ padding: 12, font: '13px system-ui' }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Name</label>
        <input value={draft.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Value</label>
        <textarea rows={3} value={draft.value} onChange={(e) => update('value', e.target.value)} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Domain</label>
        <input value={draft.domain} disabled={draft.hostOnly} onChange={(e) => update('domain', e.target.value)} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Path</label>
        <input value={draft.path} onChange={(e) => update('path', e.target.value)} />
      </div>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input type="checkbox" checked={draft.hostOnly} onChange={(e) => update('hostOnly', e.target.checked)} /> Host-only (no Domain attribute)
      </label>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input type="checkbox" checked={draft.secure} onChange={(e) => update('secure', e.target.checked)} /> Secure
      </label>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input type="checkbox" checked={draft.httpOnly} onChange={(e) => update('httpOnly', e.target.checked)} /> HttpOnly
      </label>
      <div style={rowStyle}>
        <label style={labelStyle}>SameSite</label>
        <select value={draft.sameSite} onChange={(e) => update('sameSite', e.target.value as SameSite)}>
          {SAME_SITE.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input
          type="checkbox"
          checked={isSession}
          onChange={(e) => update('expirationDate', e.target.checked ? undefined : Math.floor(Date.now() / 1000) + 86400)}
        /> Session cookie (expires when browser closes)
      </label>
      {!isSession && (
        <div style={rowStyle}>
          <label style={labelStyle}>Expires</label>
          <input type="datetime-local" value={toLocalInput(draft.expirationDate)} onChange={(e) => update('expirationDate', fromLocalInput(e.target.value))} />
        </div>
      )}

      {issues.length > 0 && (
        <ul style={{ color: '#b00', fontSize: 12, margin: '8px 0', paddingLeft: 18 }}>
          {issues.map((i) => (<li key={`${i.field}:${i.message}`}>{i.message}</li>))}
        </ul>
      )}
      {saveError && <div style={{ color: '#b00', fontSize: 12, margin: '4px 0' }}>{saveError}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" disabled={issues.length > 0 || busy} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
```
> Note on `Date.now()`: used only to seed a default expiry (24h out) when the user unchecks "session" — a UI default, not test logic. Acceptable.
- [ ] **Step 2: `tsc --noEmit` exit 0** and `pnpm --filter @bokal/cookie-manager build` succeeds.
- [ ] **Step 3: Commit** `git add apps/cookie-manager/components/CookieEditor.tsx && git commit -m "feat: CookieEditor add/edit form with wired validation"`

---

## Task 5: Wire CRUD into App + row edit/delete

**Files:** Modify `apps/cookie-manager/components/CookieRow.tsx`, `apps/cookie-manager/entrypoints/sidepanel/App.tsx`

**Interfaces:** CookieRow gains `onEdit`/`onDelete` callbacks; App tracks an editing view.

- [ ] **Step 1: CookieRow — add edit-on-click + delete.** Replace `apps/cookie-manager/components/CookieRow.tsx`:
```tsx
import type { CookieAttrs } from '../lib/cookie-types';

export function CookieRow({ cookie, onEdit, onDelete }: { cookie: CookieAttrs; onEdit: (c: CookieAttrs) => void; onDelete: (c: CookieAttrs) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderBottom: '1px solid #eee' }}>
      <button
        type="button"
        onClick={() => onEdit(cookie)}
        style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
      >
        <div style={{ fontWeight: 600 }}>{cookie.name}</div>
        {/* value is attacker-controlled → text node only, never HTML */}
        <div style={{ color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cookie.value}</div>
      </button>
      <button type="button" aria-label={`Delete ${cookie.name}`} title="Delete" onClick={() => onDelete(cookie)} style={{ flexShrink: 0 }}>✕</button>
    </div>
  );
}
```
- [ ] **Step 2: CookieList — thread the callbacks.** In `apps/cookie-manager/components/CookieList.tsx`, change the signature and the `<CookieRow>` usage:
  - Signature: `export function CookieList({ cookies, onEdit, onDelete }: { cookies: CookieAttrs[]; onEdit: (c: CookieAttrs) => void; onDelete: (c: CookieAttrs) => void }) {`
  - Render: `<CookieRow cookie={cookie} onEdit={onEdit} onDelete={onDelete} />`
- [ ] **Step 3: App — view state + Add button + delete confirm.** In `apps/cookie-manager/entrypoints/sidepanel/App.tsx`:
  1. Add imports: `import { useState } from 'react';` (merge with existing `useEffect` import → `import { useEffect, useState } from 'react';`) and `import { CookieEditor } from '../../components/CookieEditor';` and `import type { CookieAttrs } from '../../lib/cookie-types';`.
  2. Add editing state inside `App`: `const [editing, setEditing] = useState<CookieAttrs | null>(null);`
  3. Add a helper to build a new-cookie draft from the active url:
```tsx
  function newDraft(): CookieAttrs {
    let domain = 'example.com';
    try { if (activeUrl) domain = new URL(activeUrl).hostname; } catch { /* keep default */ }
    return { name: '', value: '', domain, path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false };
  }
```
  4. When `editing` is non-null (and granted), render the editor instead of the list:
```tsx
  if (granted && editing) {
    return <CookieEditor initial={editing} activeUrl={activeUrl} onDone={() => setEditing(null)} />;
  }
```
     Place this right after the existing `if (!granted) return <GrantAccess .../>;` line.
  5. In the granted list view, add an "Add cookie" button above `<SearchBar />` and pass the callbacks to `<CookieList>`:
```tsx
      <button type="button" onClick={() => setEditing(newDraft())} style={{ marginBottom: 8 }}>＋ Add cookie</button>
      <SearchBar />
```
     and:
```tsx
      <CookieList
        cookies={filtered}
        onEdit={(c) => setEditing(c)}
        onDelete={(c) => { if (confirm(`Delete cookie "${c.name}"?`)) void cookiesStore.getState().deleteCookie(c); }}
      />
```
- [ ] **Step 4: Verify** `tsc --noEmit` exit 0; `pnpm --filter @bokal/cookie-manager test` green; `pnpm --filter @bokal/cookie-manager build` succeeds.
- [ ] **Step 5: Commit** `git add apps/cookie-manager/components/CookieRow.tsx apps/cookie-manager/components/CookieList.tsx apps/cookie-manager/entrypoints/sidepanel/App.tsx && git commit -m "feat: wire cookie add/edit/delete into the panel"`

---

## Self-Review (spec coverage)
- Add/edit/delete → Tasks 2,3,4,5. ✅
- Validation wired into the editor (blocks invalid saves) → Task 4. ✅
- SameSite/secure/expiry/host-only controls → Task 4. ✅
- `set()`/`remove()` write wrapper, host-only via omitted domain, seconds-epoch expiry → Task 2. ✅
- refresh in-flight guard (M1 carry-forward) → Task 3. ✅
- Values still text-node only (CookieRow value unchanged; editor uses controlled inputs, not HTML injection) → Tasks 4,5. ✅

**Deferred:** live-browser CRUD verification → M5 Playwright E2E (this milestone verifies via unit tests + tsc + build).
