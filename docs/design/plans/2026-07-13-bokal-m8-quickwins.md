# Bokal M8 — Quick Wins Implementation Plan


**Goal:** Ship the seven evidence-backed M8 quick wins — the CHIPS all-view bug fix, validated imports with detailed errors, automation-framework export/import, all-domains export/import, a native per-site access chip, and a post-task review prompt.

**Architecture:** Extend the existing `lib/io/*` + `lib/cookies/*` + `lib/permissions.ts` libraries and the `cookies-store`; add small new libs (`lib/io/automation.ts`, `lib/review.ts`). All new broad host access is runtime-requested via the existing `optional_host_permissions`; the install manifest is unchanged. UI changes are confined to `IoBar.tsx` and `App.tsx`.

**Tech Stack:** WXT + React 19 + TypeScript, Zustand vanilla stores, Vitest (hand-mocked `chrome.cookies`/`chrome.permissions`).

## Global Constraints

- `minimum_chrome_version: 114` — feature-detect anything newer (CHIPS `partitionKey` filter is Chrome 119+; `addHostAccessRequest` is Chrome 133+); degrade gracefully, never throw on the floor.
- No `tabs` permission; **no install-time `host_permissions`** — broad access only via runtime `chrome.permissions.request({ origins: ['<all_urls>'] })` inside a user gesture.
- Never log cookie values/passphrases (redaction guard scans all shipped source). Cookie values render as **text nodes only**.
- Free build ships zero Pro code (unchanged in M8 — no Pro surfaces added).
- Every trust/permission claim in `docs/store/` + `docs/threat-model.md` stays literally true.
- Commit after every task. Keep `pnpm -r test` + `tsc --noEmit` green throughout.

---

### Task 1: Fix CHIPS partitioned cookies missing from the all-cookies view

**Files:**
- Modify: `apps/cookie-manager/lib/cookies/read.ts` (`getAllCookies`)
- Test: `apps/cookie-manager/lib/cookies/read.test.ts` (create)

**Interfaces:**
- Produces: `getAllCookies(): Promise<CookieAttrs[]>` — now returns partitioned + unpartitioned.

Verified against MDN/Chrome: `getAll({})` returns only unpartitioned; `getAll({ partitionKey: {} })` returns **both** partitioned and unpartitioned. The `partitionKey` filter is Chrome 119+, so wrap in try/catch and fall back to `getAll({})` on the 114–118 floor.

- [ ] **Step 1: Failing test** — mock `chrome.cookies.getAll` to return `[unpartitioned, partitioned]` only when called with `{ partitionKey: {} }`, and `[unpartitioned]` for `{}`. Assert `getAllCookies()` includes the partitioned cookie and calls with `{ partitionKey: {} }`. Add a second test: if `getAll({partitionKey:{}})` rejects, it falls back to `getAll({})` and still resolves.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllCookies } from './read';

const uP = { name: 'a', value: '1', domain: 'x.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: true };
const part = { name: 'b', value: '2', domain: 'y.com', path: '/', secure: true, httpOnly: false, sameSite: 'no_restriction', hostOnly: true, partitionKey: { topLevelSite: 'https://top.com' } };

beforeEach(() => {
  (globalThis as any).chrome = { cookies: { getAll: vi.fn(async (d: any) => (d && d.partitionKey ? [uP, part] : [uP])) } };
});

describe('getAllCookies', () => {
  it('includes partitioned cookies via partitionKey:{}', async () => {
    const out = await getAllCookies();
    expect(chrome.cookies.getAll).toHaveBeenCalledWith({ partitionKey: {} });
    expect(out.find((c) => c.name === 'b')?.partitionKey?.topLevelSite).toBe('https://top.com');
  });
  it('falls back to unpartitioned on old Chrome (getAll rejects with partitionKey)', async () => {
    (chrome.cookies.getAll as any) = vi.fn(async (d: any) => { if (d && d.partitionKey) throw new Error('unsupported'); return [uP]; });
    const out = await getAllCookies();
    expect(out).toHaveLength(1);
  });
});
```

- [ ] **Step 2:** Run `pnpm --filter @bokal/cookie-manager exec vitest run lib/cookies/read.test.ts` → FAIL.
- [ ] **Step 3: Implement**

```ts
export async function getAllCookies(): Promise<CookieAttrs[]> {
  try {
    // partitionKey:{} returns partitioned + unpartitioned (Chrome 119+). See MDN cookies.getAll.
    const cookies = await chrome.cookies.getAll({ partitionKey: {} });
    return cookies.map(fromChrome);
  } catch {
    const cookies = await chrome.cookies.getAll({}); // 114–118 floor: unpartitioned only
    return cookies.map(fromChrome);
  }
}
```

- [ ] **Step 4:** Run the test → PASS. Then `pnpm -r test` → all green.
- [ ] **Step 5: Commit** `fix(m8): include CHIPS partitioned cookies in the all-cookies view`

---

### Task 2: Route imports through validateCookie (M7 deferral)

**Files:**
- Modify: `apps/cookie-manager/stores/cookies-store.ts` (`importCookies`)
- Test: `apps/cookie-manager/stores/cookies-store.import.test.ts` (create) — or extend an existing store test if present.

**Interfaces:**
- Produces: `importCookies(cookies): Promise<{ imported: number; failed: number; errors: string[] }>` — unchanged signature; now pre-validates each cookie and records validation failures in `errors` without attempting `setCookie`.

`validateCookie(c, { isSecureOrigin })` needs a secure-origin flag. Derive it per-cookie: `isSecureOrigin: c.secure || cookieUrl(c).startsWith('https:')` (an import targeting an https URL is a secure origin). Skip cookies with blocking issues; still attempt the rest.

- [ ] **Step 1: Failing test** — import one valid cookie and one invalid (`__Host-` with a Domain set, i.e. `hostOnly:false`). Assert `imported===1`, `failed===1`, and `errors[0]` contains the `__Host-` message. Mock `chrome.cookies.set` to resolve truthy.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** — in `importCookies`, before `setCookie(c)`, compute `const issues = validateCookie(c, { isSecureOrigin: c.secure })`. If `issues.length`, push `` `${c.name}@${c.domain}: ${issues.map(i=>i.message).join('; ')}` `` to `errors`, `failed++`, `continue`. Import `validateCookie` + `cookieUrl` at the top.
- [ ] **Step 4:** Run → PASS; `pnpm -r test` green.
- [ ] **Step 5: Commit** `feat(m8): validate imported cookies before writing (JSON + header)`

---

### Task 3: Restore detailed import error reporting

**Files:**
- Modify: `apps/cookie-manager/components/IoBar.tsx` (`onImportFile`)
- Test: covered via a component-light assertion is overkill; verify by the store test in Task 2 + manual E2E. (No new unit test file — this is a presentation change over already-tested data.)

**Interfaces:** consumes `parseCookiesJson(text).errors` and `importCookies().errors`.

- [ ] **Step 1:** Change `onImportFile` so that: if JSON parse yields zero cookies but `parseCookiesJson(text).errors` is non-empty, show `` `Import failed: ${parseErrors[0]}` ``. After import, if `res.failed > 0`, show `` `Imported ${res.imported}, failed ${res.failed}${note} — ${res.errors[0]}${res.errors.length > 1 ? ` (+${res.errors.length - 1} more)` : ''}` ``. Keep the success line for `failed===0`.
- [ ] **Step 2:** `tsc --noEmit` clean; `pnpm --filter @bokal/cookie-manager build` succeeds.
- [ ] **Step 3: Commit** `feat(m8): surface parse + per-cookie failure reasons on import`

---

### Task 4: Automation-framework export/import (Playwright storageState, Puppeteer, Playwright addCookies)

**Files:**
- Create: `apps/cookie-manager/lib/io/automation.ts`
- Create: `apps/cookie-manager/lib/io/automation.test.ts`
- Modify: `apps/cookie-manager/lib/io/import.ts` (sniff Playwright storageState + Puppeteer array shapes)
- Modify: `apps/cookie-manager/components/IoBar.tsx` (export menu entries)

**Interfaces:**
- Produces:
  - `toPlaywrightStorageState(cookies: CookieAttrs[]): string` — JSON `{ cookies: PwCookie[], origins: [] }`.
  - `toPuppeteerJson(cookies: CookieAttrs[]): string` — JSON `PptrCookie[]`.
  - `toPlaywrightCookies(cookies: CookieAttrs[]): string` — JSON `PwCookie[]` (the `addCookies` argument).
  - `fromAutomationJson(data: unknown): CookieAttrs[] | null` — returns cookies if `data` is a storageState object or a Puppeteer/Playwright cookie array, else null.

Playwright cookie shape: `{ name, value, domain, path, expires (seconds or -1 for session), httpOnly, secure, sameSite: 'Strict'|'Lax'|'None' }`. Puppeteer `setCookie` shape: `{ name, value, domain, path, expires (seconds), httpOnly, secure, sameSite: 'Strict'|'Lax'|'None' }` (very close; Puppeteer also allows `url`/`session`). Map our `SameSite` (`no_restriction|lax|strict|unspecified`) → `None|Lax|Strict`; `unspecified` omits the field (Playwright defaults). Reverse-map on import (`None→no_restriction`, missing→`unspecified`).

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { toPlaywrightStorageState, toPuppeteerJson, toPlaywrightCookies, fromAutomationJson } from './automation';

const c = { name: 's', value: 't', domain: '.ex.com', path: '/', secure: true, httpOnly: true, sameSite: 'no_restriction', hostOnly: false, expirationDate: 1893456000 };

describe('automation formats', () => {
  it('storageState has cookies + empty origins, None sameSite, expires seconds', () => {
    const o = JSON.parse(toPlaywrightStorageState([c as any]));
    expect(o.origins).toEqual([]);
    expect(o.cookies[0]).toMatchObject({ name: 's', sameSite: 'None', secure: true, httpOnly: true, expires: 1893456000 });
  });
  it('session cookie → expires -1 in playwright', () => {
    const o = JSON.parse(toPlaywrightCookies([{ ...c, expirationDate: undefined } as any]));
    expect(o[0].expires).toBe(-1);
  });
  it('puppeteer array shape', () => {
    const a = JSON.parse(toPuppeteerJson([c as any]));
    expect(a[0]).toMatchObject({ name: 's', sameSite: 'None' });
  });
  it('round-trips storageState back to CookieAttrs', () => {
    const back = fromAutomationJson(JSON.parse(toPlaywrightStorageState([c as any])));
    expect(back?.[0]).toMatchObject({ name: 's', sameSite: 'no_restriction', httpOnly: true });
  });
  it('parses a bare puppeteer/playwright cookie array', () => {
    const back = fromAutomationJson(JSON.parse(toPuppeteerJson([c as any])));
    expect(back?.[0].name).toBe('s');
  });
  it('returns null for non-automation data', () => {
    expect(fromAutomationJson({ format: 'bokal-cookies', cookies: [] })).toBeNull();
  });
});
```

- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement `automation.ts`** — `SAME_SITE_OUT: Record<SameSite,'Strict'|'Lax'|'None'|undefined>` (`strict→Strict, lax→Lax, no_restriction→None, unspecified→undefined`); reverse `SAME_SITE_IN`. `expires = c.expirationDate !== undefined ? Math.floor(c.expirationDate) : -1`. `fromAutomationJson`: if object with `cookies` array **and** `origins` present → storageState; if a top-level array whose items have `name`+`domain` → cookie array; map each via `automationToAttrs`. Return null otherwise (so the bokal-cookies object with no `origins`/non-array-top doesn't match). Reuse `CookieAttrs` defaults (`hostOnly: !domain.startsWith('.')` is wrong for leading-dot domains — set `hostOnly: false` for automation imports since these formats carry a Domain; leading-dot means non-host-only).
- [ ] **Step 4: Wire import sniffing** — in `parseCookiesJson`, before the "expected array/object" error, try `fromAutomationJson(data)`; if non-null, return `{ cookies, errors: [] }`.
- [ ] **Step 5: Wire export UI** — in `IoBar`, add a `<select>`-style "Export for…" group or three buttons: "Playwright (storageState)", "Puppeteer", "Playwright addCookies" calling `downloadText('<slug>-storageState.json', toPlaywrightStorageState(cookies))` etc. Add a one-line note near the automation exports: "Cookies only — localStorage/tokens aren't included."
- [ ] **Step 6:** Run tests → PASS; `pnpm -r test` green; `tsc` clean.
- [ ] **Step 7: Commit** `feat(m8): Playwright storageState + Puppeteer cookie export/import`

---

### Task 5: Export/import ALL cookies across all domains (persistent all-URLs opt-in)

**Files:**
- Modify: `apps/cookie-manager/lib/permissions.ts` (add `ensureAllUrls`)
- Modify: `apps/cookie-manager/components/IoBar.tsx` (all-sites actions, shown in `scope==='all'`)
- Test: `apps/cookie-manager/lib/permissions.test.ts` (create) — `ensureAllUrls` returns true if already granted without requesting.

**Interfaces:**
- Produces: `ensureAllUrls(): Promise<boolean>` — `contains` first; if already granted, return true without a request; else `request` (must be called inside a gesture — no awaits before it in the handler).

Since the `all` scope already lists every cookie once granted, "export all" is `downloadText(...)` over the shown list. The new part is the **import to all sites** path and making the all-scope actions explicit + gesture-safe. Persistent grant = we never revoke (§decision 1).

- [ ] **Step 1: Failing test** — mock `chrome.permissions.contains` → true; assert `ensureAllUrls()` resolves true and `request` was not called. Second: `contains`→false, `request`→true; assert resolves true.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**

```ts
export async function ensureAllUrls(): Promise<boolean> {
  if (await chrome.permissions.contains(ALL_URLS)) return true;
  return chrome.permissions.request(ALL_URLS);
}
```

- [ ] **Step 4: Wire UI** — the `scope==='all'` branch already renders `IoBar cookies={filtered}`. Its export buttons already act on the shown list, so "Export all" works once granted. Add an explicit label when `scope==='all'`: change the Export buttons' filenames to `all-sites-cookies.*`. For import in all-scope, gate `onImportFile`'s click: the Import button's onClick becomes `async` gesture that calls `ensureAllUrls()` **is not gesture-safe after await** — instead call `void ensureAllUrls()` synchronously in the click, then open the file dialog regardless (the file dialog itself is the second gesture). Simpler: keep import as-is (writes route per-cookie to each domain via `cookieUrl`, which needs host access per domain). Add a note in all-scope: "Importing to all sites needs all-sites access." and a "Grant all-sites access" button (calls `requestAllUrls()` synchronously) shown when `scope==='all' && !granted-all`. Track all-urls-granted from the store's `granted` (already all-urls).
- [ ] **Step 5:** `tsc` clean; `build` ok; `pnpm -r test` green.
- [ ] **Step 6: Commit** `feat(m8): all-sites cookie export/import with persistent all-URLs opt-in`

---

### Task 6: Native per-site access chip via addHostAccessRequest

**Files:**
- Modify: `apps/cookie-manager/lib/permissions.ts` (add `registerSiteAccessRequest`)
- Modify: `apps/cookie-manager/entrypoints/background.ts` (register on tab activation when host access missing)
- Test: `apps/cookie-manager/lib/permissions.test.ts` (extend) — no-op when API absent.

**Interfaces:**
- Produces: `registerSiteAccessRequest(tabId: number): Promise<void>` — feature-detects `chrome.permissions.addHostAccessRequest`; calls it for the tab so Chrome shows its native "Allow" chip. Silent no-op on Chrome < 133.

- [ ] **Step 1: Failing test** — with `chrome.permissions.addHostAccessRequest` undefined, `registerSiteAccessRequest(1)` resolves without throwing. With it defined (a vi.fn), it is called with `{ tabId: 1 }`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**

```ts
export async function registerSiteAccessRequest(tabId: number): Promise<void> {
  const api = chrome.permissions as { addHostAccessRequest?: (o: { tabId: number }) => Promise<void> };
  if (typeof api.addHostAccessRequest !== 'function') return;
  try { await api.addHostAccessRequest({ tabId }); } catch { /* already granted or unsupported */ }
}
```

- [ ] **Step 4: Wire SW** — in `background.ts`, add `chrome.tabs.onActivated.addListener(({ tabId }) => { void hasAllUrlsPermission().then((g) => { if (!g) void registerSiteAccessRequest(tabId); }); })`. Import both from `../lib/permissions`. Keep the in-panel Grant button as the always-present fallback (unchanged).
- [ ] **Step 5:** `tsc` clean; `build` ok; tests green.
- [ ] **Step 6: Commit** `feat(m8): native per-site access chip (addHostAccessRequest, Chrome 133+)`

---

### Task 7: Post-task review prompt (after 3rd successful cookie action)

**Files:**
- Create: `apps/cookie-manager/lib/review.ts`
- Create: `apps/cookie-manager/lib/review.test.ts`
- Modify: `apps/cookie-manager/stores/cookies-store.ts` (bump the counter on each successful action)
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx` (render the one-time prompt)

**Interfaces:**
- Produces:
  - `recordAction(): Promise<void>` — increments `bokal:actionCount` in `storage.local` (no-op once the prompt has been shown/dismissed).
  - `shouldPromptReview(): Promise<boolean>` — true when `actionCount >= 3` and not yet shown.
  - `dismissReviewPrompt(): Promise<void>` — sets `bokal:reviewPromptShown = true`.
  - `reviewUrl(): string` — `` `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews` ``.

- [ ] **Step 1: Failing tests** — with a fake `chrome.storage.local` (Map-backed): calling `recordAction()` three times then `shouldPromptReview()` → true; after `dismissReviewPrompt()`, `shouldPromptReview()` → false and further `recordAction()` leaves it false.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement `review.ts`** — keys `bokal:actionCount`, `bokal:reviewPromptShown`. `recordAction`: if shown flag set, return; else `count = (get)+1; set`. `shouldPromptReview`: `!shown && count >= 3`. Guard `chrome.runtime.id` for tests (fallback empty string).
- [ ] **Step 4: Wire store** — in `cookies-store`, after a successful `saveCookie`, `deleteCookie`, `deleteAllForSite` (removed>0), and `importCookies` (imported>0), call `void recordAction()`. Import from `../lib/review`.
- [ ] **Step 5: Wire App** — add `const [showReview, setShowReview] = useState(false)`; in the mount effect, after refresh, `void shouldPromptReview().then(setShowReview)`; also re-check when `cookies` change (cheap). Render a dismissible banner above `IoBar` when `showReview`: text "Enjoying Bokal? A quick review helps." + a link (`<a href={reviewUrl()} target="_blank" rel="noreferrer">Leave a review</a>`) and a "Dismiss" button → `void dismissReviewPrompt(); setShowReview(false)`. The link click also dismisses.
- [ ] **Step 6:** Run tests → PASS; `pnpm -r test` green; `tsc` clean; `build` ok.
- [ ] **Step 7: Commit** `feat(m8): one-time post-task review prompt (non-incentivized)`

---

### Task 8: M8 doc truthfulness pass + full verification

**Files:**
- Modify: `docs/threat-model.md` (note the user-initiated persistent all-sites grant for export/import-all)
- Modify: `docs/store/privacy-policy.md` + `docs/store/permission-justifications.md` (host-permission entry: add that all-sites export/import may request persistent `<all_urls>` at the user's initiation; still nothing at install; still nothing transmitted)

- [ ] **Step 1:** Update the three docs with 1–2 accurate sentences each. Do not overclaim — install manifest still declares no host permissions; the grant is user-initiated and revocable via Chrome's UI.
- [ ] **Step 2: Full gate** — run:
  ```bash
  pnpm -r test
  pnpm --filter @bokal/cookie-manager exec tsc --noEmit
  pnpm --filter @bokal/cookie-manager build
  pnpm --filter @bokal/cookie-manager zip
  pnpm --filter @bokal/cookie-manager exec playwright test
  pnpm --filter @bokal/cookie-manager build:e2e && BOKAL_E2E=1 pnpm --filter @bokal/cookie-manager exec playwright test
  ```
  Confirm: all tests green; `.output/chrome-mv3/manifest.json` has **no** `host_permissions`, permissions exactly `["cookies","storage","sidePanel","unlimitedStorage","alarms"]`; ProfilesPanel still a separate chunk; E2E green both builds.
- [ ] **Step 3: Commit** `docs(m8): threat-model + privacy note the user-initiated persistent all-sites grant`

---

## Self-Review

- **Spec coverage:** M8 tasks map 1:1 to the spec's M8 table (T1 bug, T2 validate imports, T3 import errors, T4 automation formats, T5 export-all, T6 addHostAccessRequest, T7 review prompt) + a doc-truthfulness task. ✓
- **Placeholder scan:** every code step has real code; no TBD/TODO. ✓
- **Type consistency:** `ensureAllUrls`/`requestAllUrls`/`hasAllUrlsPermission`/`registerSiteAccessRequest` names consistent; `fromAutomationJson` used in both `automation.ts` and `import.ts`; `recordAction`/`shouldPromptReview`/`dismissReviewPrompt`/`reviewUrl` consistent across `review.ts`, store, and App. ✓
- **Invariant check:** no new install-time permissions; no Pro code added; no value logging introduced; text-node rendering unchanged. ✓
