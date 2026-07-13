# Wafer — Milestone 3: Import/Export · Dark Mode · CHIPS — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Add JSON + Netscape export and JSON import (no `downloads` permission), a shared `@wafer/ui-kit` theme with light/dark, and a CHIPS partition inspector.

**Architecture:** Pure formatter/parser modules (`lib/io/*`, TDD) + a `downloadText` Blob+anchor helper; a `store.importCookies` bulk action; a new workspace package `packages/ui-kit` exporting `theme.css` + a `useTheme` hook (theme pref in `chrome.storage.sync`); a store `showPartitioned` toggle that also fetches partitioned cookies for the active top-level site.

**Tech Stack:** unchanged.

## Global Constraints
_Inherits all prior constraints (minimal manifest, text-node rendering, no `any`, strict TS, values never logged, chrome.storage source of truth)._ Additions:
- Export MUST use Blob + `<a download>` (no `downloads` permission). Generation stays in the panel context.
- Import validates each entry; malformed entries are reported, not silently dropped.
- Theme pref (`wafer:theme`) is small → `chrome.storage.sync` is acceptable (only for this preference; profiles/cookies never go in sync).
- Colors come from CSS variables (`--wafer-*`); no new hardcoded hex in component styles.

---

## File Structure (added/modified)
```
packages/ui-kit/
  package.json                 # NEW @wafer/ui-kit
  theme.css                    # NEW CSS variables (light default + dark)
  index.ts                     # NEW re-exports useTheme
  useTheme.ts                  # NEW theme hook (storage.sync pref)
apps/cookie-manager/
  package.json                 # MODIFY add @wafer/ui-kit dep
  lib/io/export.ts             # NEW toJson + toNetscape (pure, TDD)
  lib/io/export.test.ts        # NEW
  lib/io/import.ts             # NEW parseCookiesJson (pure, TDD)
  lib/io/import.test.ts        # NEW
  lib/io/download.ts           # NEW downloadText (Blob+anchor)
  lib/cookies/read.ts          # MODIFY add getPartitionedCookiesForUrl
  stores/cookies-store.ts      # MODIFY importCookies + showPartitioned toggle
  components/IoBar.tsx          # NEW export/import toolbar
  components/ThemeToggle.tsx    # NEW
  components/CookieRow.tsx     # MODIFY partition badge + token colors
  components/CookieList.tsx    # MODIFY token colors
  components/CookieEditor.tsx  # MODIFY token colors
  components/GrantAccess.tsx   # MODIFY token colors
  components/SearchBar.tsx     # MODIFY token colors
  entrypoints/sidepanel/main.tsx  # MODIFY import theme.css
  entrypoints/sidepanel/App.tsx    # MODIFY header (IoBar+ThemeToggle+CHIPS toggle), token colors
```

---

## Task 1: Export formatters — `toJson` + `toNetscape` (pure, TDD)

**Files:** Create `apps/cookie-manager/lib/io/export.ts`, `apps/cookie-manager/lib/io/export.test.ts`

**Interfaces:** `interface WaferExport { format: 'wafer-cookies'; version: 1; exportedFrom?: string; cookies: CookieAttrs[] }`; `function toJson(cookies: CookieAttrs[], exportedFrom?: string): string`; `function toNetscape(cookies: CookieAttrs[]): string`.

- [ ] **Step 1: Failing test** — `apps/cookie-manager/lib/io/export.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { toJson, toNetscape } from './export';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...o };
}

describe('toJson', () => {
  it('wraps cookies with format+version and round-trips via JSON.parse', () => {
    const parsed = JSON.parse(toJson([base()], 'https://example.com'));
    expect(parsed.format).toBe('wafer-cookies');
    expect(parsed.version).toBe(1);
    expect(parsed.exportedFrom).toBe('https://example.com');
    expect(parsed.cookies).toHaveLength(1);
    expect(parsed.cookies[0].name).toBe('sid');
  });
});

describe('toNetscape', () => {
  it('emits a header and one 7-field tab-separated line per cookie', () => {
    const out = toNetscape([base({ expirationDate: 1893456000 })]);
    expect(out.startsWith('# Netscape HTTP Cookie File')).toBe(true);
    const line = out.trim().split('\n').at(-1)!;
    const fields = line.split('\t');
    expect(fields).toHaveLength(7);
    expect(fields[5]).toBe('sid'); // name
    expect(fields[6]).toBe('abc'); // value
  });
  it('marks host-only cookies FALSE with no leading dot and domain cookies TRUE with leading dot', () => {
    const host = toNetscape([base({ hostOnly: true, domain: 'example.com' })]).trim().split('\n').at(-1)!.split('\t');
    expect(host[0]).toBe('example.com');
    expect(host[1]).toBe('FALSE');
    const dom = toNetscape([base({ hostOnly: false, domain: 'example.com' })]).trim().split('\n').at(-1)!.split('\t');
    expect(dom[0]).toBe('.example.com');
    expect(dom[1]).toBe('TRUE');
  });
  it('uses 0 expiry for a session cookie', () => {
    const s = toNetscape([base()]).trim().split('\n').at(-1)!.split('\t');
    expect(s[4]).toBe('0');
  });
});
```
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement** — `apps/cookie-manager/lib/io/export.ts`
```ts
import type { CookieAttrs } from '../cookie-types';

export interface WaferExport {
  format: 'wafer-cookies';
  version: 1;
  exportedFrom?: string;
  cookies: CookieAttrs[];
}

export function toJson(cookies: CookieAttrs[], exportedFrom?: string): string {
  const payload: WaferExport = { format: 'wafer-cookies', version: 1, exportedFrom, cookies };
  return JSON.stringify(payload, null, 2);
}

export function toNetscape(cookies: CookieAttrs[]): string {
  const header = '# Netscape HTTP Cookie File\n# Generated by Wafer\n';
  const lines = cookies.map((c) => {
    const bareHost = c.domain.replace(/^\./, '');
    const domainField = c.hostOnly ? bareHost : `.${bareHost}`;
    const includeSub = c.hostOnly ? 'FALSE' : 'TRUE';
    const expiry = c.expirationDate !== undefined ? Math.floor(c.expirationDate) : 0;
    return [domainField, includeSub, c.path, c.secure ? 'TRUE' : 'FALSE', String(expiry), c.name, c.value].join('\t');
  });
  return header + (lines.length ? lines.join('\n') + '\n' : '');
}
```
- [ ] **Step 4: Run → PASS**; **Step 5: Commit** `git add apps/cookie-manager/lib/io/export.ts apps/cookie-manager/lib/io/export.test.ts && git commit -m "feat: JSON + Netscape cookie export formatters (TDD)"`

---

## Task 2: JSON import parser — `parseCookiesJson` (pure, TDD)

**Files:** Create `apps/cookie-manager/lib/io/import.ts`, `apps/cookie-manager/lib/io/import.test.ts`

**Interfaces:** `interface ParseResult { cookies: CookieAttrs[]; errors: string[] }`; `function parseCookiesJson(text: string): ParseResult`. Accepts the Wafer wrapper `{cookies:[...]}` OR a bare array (Cookie-Editor style).

- [ ] **Step 1: Failing test** — `apps/cookie-manager/lib/io/import.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { parseCookiesJson } from './import';
import { toJson } from './export';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...o };
}

describe('parseCookiesJson', () => {
  it('round-trips a Wafer export', () => {
    const original = [base({ expirationDate: 1893456000 }), base({ name: 'other', hostOnly: true })];
    const res = parseCookiesJson(toJson(original));
    expect(res.errors).toEqual([]);
    expect(res.cookies).toEqual(original);
  });
  it('accepts a bare array of cookies', () => {
    const res = parseCookiesJson(JSON.stringify([base()]));
    expect(res.cookies).toHaveLength(1);
  });
  it('reports invalid JSON', () => {
    expect(parseCookiesJson('{not json').errors).toEqual(['Invalid JSON']);
  });
  it('skips and reports an entry missing a name', () => {
    const res = parseCookiesJson(JSON.stringify([{ domain: 'example.com' }]));
    expect(res.cookies).toHaveLength(0);
    expect(res.errors.length).toBe(1);
  });
  it('defaults unknown sameSite to unspecified and coerces types', () => {
    const res = parseCookiesJson(JSON.stringify([{ name: 'x', domain: 'e.com', sameSite: 'bogus' }]));
    expect(res.cookies[0].sameSite).toBe('unspecified');
    expect(res.cookies[0].path).toBe('/');
    expect(res.cookies[0].secure).toBe(false);
  });
});
```
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement** — `apps/cookie-manager/lib/io/import.ts`
```ts
import type { CookieAttrs, SameSite } from '../cookie-types';

const SAME_SITES: SameSite[] = ['no_restriction', 'lax', 'strict', 'unspecified'];

export interface ParseResult {
  cookies: CookieAttrs[];
  errors: string[];
}

function parsePartition(raw: unknown): CookieAttrs['partitionKey'] {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.topLevelSite !== 'string') return undefined;
  return { topLevelSite: o.topLevelSite, hasCrossSiteAncestor: o.hasCrossSiteAncestor === true ? true : undefined };
}

function coerce(raw: unknown, index: number, errors: string[]): CookieAttrs | null {
  if (typeof raw !== 'object' || raw === null) { errors.push(`Entry ${index}: not an object`); return null; }
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== 'string' || o.name === '') { errors.push(`Entry ${index}: missing name`); return null; }
  if (typeof o.domain !== 'string' || o.domain === '') { errors.push(`Entry ${index}: missing domain`); return null; }
  const sameSite: SameSite = SAME_SITES.includes(o.sameSite as SameSite) ? (o.sameSite as SameSite) : 'unspecified';
  return {
    name: o.name,
    value: typeof o.value === 'string' ? o.value : '',
    domain: o.domain,
    path: typeof o.path === 'string' ? o.path : '/',
    secure: o.secure === true,
    httpOnly: o.httpOnly === true,
    sameSite,
    hostOnly: o.hostOnly === true,
    expirationDate: typeof o.expirationDate === 'number' ? o.expirationDate : undefined,
    storeId: typeof o.storeId === 'string' ? o.storeId : undefined,
    partitionKey: parsePartition(o.partitionKey),
  };
}

export function parseCookiesJson(text: string): ParseResult {
  const errors: string[] = [];
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { cookies: [], errors: ['Invalid JSON'] }; }
  let arr: unknown;
  if (Array.isArray(data)) arr = data;
  else if (typeof data === 'object' && data !== null && Array.isArray((data as Record<string, unknown>).cookies)) {
    arr = (data as Record<string, unknown>).cookies;
  } else {
    return { cookies: [], errors: ['Expected a cookie array or an object with a "cookies" array'] };
  }
  const cookies: CookieAttrs[] = [];
  (arr as unknown[]).forEach((raw, i) => {
    const c = coerce(raw, i, errors);
    if (c) cookies.push(c);
  });
  return { cookies, errors };
}
```
> Note: the round-trip test expects `toEqual(original)`. Ensure `coerce` reproduces exactly the same shape the exporter wrote (session cookie → `expirationDate: undefined`; no partitionKey → `undefined`). `toEqual` treats missing vs `undefined` keys as equal in Vitest, so this holds.
- [ ] **Step 4: Run → PASS**; **Step 5: `tsc --noEmit` exit 0**; commit `git add apps/cookie-manager/lib/io/import.ts apps/cookie-manager/lib/io/import.test.ts && git commit -m "feat: JSON cookie import parser (TDD)"`

---

## Task 3: Download helper + store import + IoBar UI

**Files:** Create `apps/cookie-manager/lib/io/download.ts`, `apps/cookie-manager/components/IoBar.tsx`; Modify `apps/cookie-manager/stores/cookies-store.ts`, `apps/cookie-manager/entrypoints/sidepanel/App.tsx`.

**Interfaces:** `function downloadText(filename: string, text: string, mime?: string): void`; store `importCookies(cookies: CookieAttrs[]): Promise<{ imported: number; failed: number; errors: string[] }>`; `<IoBar />`.

- [ ] **Step 1: download helper** — `apps/cookie-manager/lib/io/download.ts`
```ts
export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```
- [ ] **Step 2: store importCookies.** In `stores/cookies-store.ts`:
  - Interface: add `importCookies: (cookies: CookieAttrs[]) => Promise<{ imported: number; failed: number; errors: string[] }>;`
  - Implementation (after `deleteCookie`):
```ts
  importCookies: async (cookies) => {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const c of cookies) {
      try {
        await setCookie(c);
        imported += 1;
      } catch (err) {
        failed += 1;
        errors.push(`${c.name}@${c.domain}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    await get().refresh();
    return { imported, failed, errors };
  },
```
- [ ] **Step 3: IoBar component** — `apps/cookie-manager/components/IoBar.tsx`
```tsx
import { useRef, useState } from 'react';
import { useCookiesStore, cookiesStore } from '../stores/cookies-store';
import { toJson, toNetscape } from '../lib/io/export';
import { parseCookiesJson } from '../lib/io/import';
import { downloadText } from '../lib/io/download';

export function IoBar() {
  const cookies = useCookiesStore((s) => s.cookies);
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  function hostSlug(): string {
    try { return activeUrl ? new URL(activeUrl).hostname : 'cookies'; } catch { return 'cookies'; }
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const parsed = parseCookiesJson(text);
    if (parsed.cookies.length === 0) {
      setStatus(`Import failed: ${parsed.errors[0] ?? 'no cookies found'}`);
      return;
    }
    const res = await cookiesStore.getState().importCookies(parsed.cookies);
    const parseNote = parsed.errors.length ? ` (${parsed.errors.length} skipped)` : '';
    setStatus(`Imported ${res.imported}, failed ${res.failed}${parseNote}`);
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.json`, toJson(cookies, activeUrl ?? undefined))}>Export JSON</button>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.txt`, toNetscape(cookies), 'text/plain')}>Export Netscape</button>
      <button type="button" onClick={() => fileRef.current?.click()}>Import JSON</button>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} style={{ display: 'none' }} />
      {status && <span style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>{status}</span>}
    </div>
  );
}
```
- [ ] **Step 4: Wire IoBar into App** — in `entrypoints/sidepanel/App.tsx`, import `IoBar` and render `<IoBar />` in the granted list view above the "Add cookie" button.
- [ ] **Step 5: Verify** `tsc --noEmit` exit 0; `test` green; `build` ok. **Commit** `git add apps/cookie-manager/lib/io/download.ts apps/cookie-manager/components/IoBar.tsx apps/cookie-manager/stores/cookies-store.ts apps/cookie-manager/entrypoints/sidepanel/App.tsx && git commit -m "feat: export (JSON/Netscape) + import wiring via Blob+anchor"`

---

## Task 4: `@wafer/ui-kit` theme + light/dark + tokenized colors

**Files:** Create `packages/ui-kit/{package.json,theme.css,index.ts,useTheme.ts}`, `apps/cookie-manager/components/ThemeToggle.tsx`; Modify `apps/cookie-manager/package.json`, `entrypoints/sidepanel/main.tsx`, and replace hardcoded colors with `var(--wafer-*)` tokens in App/CookieRow/CookieList/CookieEditor/GrantAccess/SearchBar.

**Interfaces:** `type ThemeMode = 'system' | 'light' | 'dark'`; `function useTheme(): [ThemeMode, (m: ThemeMode) => void]`; `function applyTheme(m: ThemeMode): void`; `<ThemeToggle />`.

- [ ] **Step 1: ui-kit package** — `packages/ui-kit/package.json`
```json
{
  "name": "@wafer/ui-kit",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.ts",
    "./theme.css": "./theme.css"
  }
}
```
`packages/ui-kit/theme.css`
```css
:root {
  --wafer-bg: #ffffff;
  --wafer-fg: #1a1a1a;
  --wafer-muted: #666666;
  --wafer-border: #e6e6e6;
  --wafer-accent: #2563eb;
  --wafer-danger: #b00020;
  --wafer-row-hover: #f5f5f5;
}
.wafer-dark-tokens {
  --wafer-bg: #1e1e1e;
  --wafer-fg: #eaeaea;
  --wafer-muted: #9a9a9a;
  --wafer-border: #333333;
  --wafer-accent: #5b9dff;
  --wafer-danger: #ff6b6b;
  --wafer-row-hover: #2a2a2a;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --wafer-bg: #1e1e1e;
    --wafer-fg: #eaeaea;
    --wafer-muted: #9a9a9a;
    --wafer-border: #333333;
    --wafer-accent: #5b9dff;
    --wafer-danger: #ff6b6b;
    --wafer-row-hover: #2a2a2a;
  }
}
:root[data-theme='dark'] {
  --wafer-bg: #1e1e1e;
  --wafer-fg: #eaeaea;
  --wafer-muted: #9a9a9a;
  --wafer-border: #333333;
  --wafer-accent: #5b9dff;
  --wafer-danger: #ff6b6b;
  --wafer-row-hover: #2a2a2a;
}
html, body { background: var(--wafer-bg); color: var(--wafer-fg); margin: 0; }
button { color: var(--wafer-fg); background: var(--wafer-bg); border: 1px solid var(--wafer-border); border-radius: 4px; padding: 4px 8px; cursor: pointer; }
input, textarea, select { background: var(--wafer-bg); color: var(--wafer-fg); border: 1px solid var(--wafer-border); border-radius: 4px; padding: 4px 6px; }
```
`packages/ui-kit/useTheme.ts`
```ts
import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'wafer:theme';

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>('system');
  useEffect(() => {
    void chrome.storage.sync.get(KEY).then((r) => {
      const m = (r[KEY] as ThemeMode | undefined) ?? 'system';
      setMode(m);
      applyTheme(m);
    });
  }, []);
  const set = (m: ThemeMode): void => {
    setMode(m);
    applyTheme(m);
    void chrome.storage.sync.set({ [KEY]: m });
  };
  return [mode, set];
}
```
`packages/ui-kit/index.ts`
```ts
export { useTheme, applyTheme } from './useTheme';
export type { ThemeMode } from './useTheme';
```
- [ ] **Step 2: app dependency + import css.** Add to `apps/cookie-manager/package.json` dependencies: `"@wafer/ui-kit": "workspace:*"`. Run `pnpm install`. In `entrypoints/sidepanel/main.tsx` add at the top (before other imports): `import '@wafer/ui-kit/theme.css';`
- [ ] **Step 3: ThemeToggle** — `apps/cookie-manager/components/ThemeToggle.tsx`
```tsx
import { useTheme, type ThemeMode } from '@wafer/ui-kit';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export function ThemeToggle() {
  const [mode, setMode] = useTheme();
  return (
    <select aria-label="Theme" value={mode} onChange={(e) => setMode(e.target.value as ThemeMode)} style={{ fontSize: 11 }}>
      {MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
    </select>
  );
}
```
- [ ] **Step 4: Tokenize colors.** Replace hardcoded colors with tokens across the panel components. Apply these exact replacements:
  - `#eee` / `1px solid #eee` → `var(--wafer-border)`
  - `#555` and `#666` → `var(--wafer-muted)`
  - `#888` → `var(--wafer-muted)`
  - `#b00` / `#b00020` (error text) → `var(--wafer-danger)`
  - The `borderBottom`/`border` hex values → `var(--wafer-border)`
  Files to sweep: `components/CookieRow.tsx`, `components/CookieList.tsx`, `components/CookieEditor.tsx` (labelStyle `#666`, error `#b00`), `components/GrantAccess.tsx` (`#555`), `entrypoints/sidepanel/App.tsx` (`#555`). Leave layout (sizes, fl‌ex) unchanged. Do NOT change the cookie-value rendering (still `{cookie.value}` text node).
  Render `<ThemeToggle />` in App's granted header row (next to the count).
- [ ] **Step 5: Verify** `tsc --noEmit` exit 0; `test` green; `build` ok (CSS import resolves). **Commit** `git add -A && git commit -m "feat: @wafer/ui-kit theme (light/dark) + tokenized panel colors"`

---

## Task 5: CHIPS partition inspector

**Files:** Modify `apps/cookie-manager/lib/cookies/read.ts`, `apps/cookie-manager/stores/cookies-store.ts`, `apps/cookie-manager/components/CookieRow.tsx`, `apps/cookie-manager/entrypoints/sidepanel/App.tsx`.

**Interfaces:** `function getPartitionedCookiesForUrl(url: string): Promise<CookieAttrs[]>`; store `showPartitioned: boolean` + `setShowPartitioned(v: boolean): void`.

- [ ] **Step 1: read partitioned cookies** — add to `apps/cookie-manager/lib/cookies/read.ts`:
```ts
export async function getPartitionedCookiesForUrl(url: string): Promise<CookieAttrs[]> {
  try {
    const site = new URL(url).origin;
    const cookies = await chrome.cookies.getAll({ url, partitionKey: { topLevelSite: site } });
    return cookies.map(fromChrome);
  } catch {
    return [];
  }
}
```
- [ ] **Step 2: store toggle + merged fetch.** In `stores/cookies-store.ts`:
  - Import: add `getPartitionedCookiesForUrl` to the existing `../lib/cookies/read` import.
  - Interface: add `showPartitioned: boolean;` and `setShowPartitioned: (v: boolean) => void;`
  - Initial state: `showPartitioned: false,` and action `setShowPartitioned: (v) => { set({ showPartitioned: v }); void get().refresh(); },`
  - In `refresh`, after computing the base `cookies` for `activeUrl`, merge partitioned when the toggle is on. Replace the line `const cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];` with:
```ts
      let cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
      if (activeUrl && get().showPartitioned) {
        const partitioned = await getPartitionedCookiesForUrl(activeUrl);
        cookies = cookies.concat(partitioned);
      }
```
  (Note: this requires `get` — already re-added in M2. Keep the seq guard checks after this.)
- [ ] **Step 3: partition badge on rows.** In `components/CookieRow.tsx`, add a small badge when the cookie is partitioned. After the name `<div>`, add:
```tsx
        {cookie.partitionKey?.topLevelSite && (
          <span title={`Partitioned: ${cookie.partitionKey.topLevelSite}`} style={{ fontSize: 10, color: 'var(--wafer-accent)', border: '1px solid var(--wafer-border)', borderRadius: 3, padding: '0 3px', marginLeft: 4 }}>CHIPS</span>
        )}
```
  (Place it inline with the name so the value line is unchanged.)
- [ ] **Step 4: toggle in App.** In `entrypoints/sidepanel/App.tsx`, read `showPartitioned` from the store and render a checkbox in the header:
```tsx
  const showPartitioned = useCookiesStore((s) => s.showPartitioned);
```
```tsx
      <label style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>
        <input type="checkbox" checked={showPartitioned} onChange={(e) => cookiesStore.getState().setShowPartitioned(e.target.checked)} /> Show partitioned (CHIPS)
      </label>
```
- [ ] **Step 5: Verify** `tsc --noEmit` exit 0; `test` green; `build` ok. **Commit** `git add -A apps/cookie-manager && git commit -m "feat: CHIPS partition inspector (partitioned fetch + badge + toggle)"`

---

## Self-Review (spec coverage)
- Blob+anchor export (no downloads perm), JSON + Netscape → Tasks 1,3. ✅
- Import round-trip (validated, reports skips) → Tasks 2,3. ✅
- Dark mode via ui-kit (light default + prefers-color-scheme + manual toggle) → Task 4. ✅
- CHIPS inspector (`getAll` with partitionKey, badge, toggle) using topLevelSite → Task 5. ✅

**Deferred:** live-browser verification of export downloads / import / theme / CHIPS → M5 E2E. `getPartitionedCookiesForUrl` enumerates only the active top-level site's partition (full cross-partition enumeration is not exposed by the API) — documented limitation.
