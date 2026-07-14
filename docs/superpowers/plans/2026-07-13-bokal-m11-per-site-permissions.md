# Bokal M11 — Per-Site Permission Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Make Bokal's runtime host-access grant **per-site** (the active origin only) instead of a single broad `<all_urls>` grant, so the store claim "access to the specific site you choose" becomes literally true — while keeping "no `tabs` permission, no install-time host permissions." Reserve `<all_urls>` as an explicit opt-in for the genuinely broad features (all-cookies view, all-sites export/import, cleanup sweep).

**Decision provenance:** deep-research (2026-07-13, 22 confirmed / 3 refuted claims, primary Chrome docs + Cookie-Editor source). Per-origin host permission + `cookies` is necessary and sufficient for that origin's cookies; `<all_urls>` only for all-sites enumeration; `activeTab` does NOT grant `chrome.cookies` but DOES let us read the active tab's URL on a gesture (so we can request the right origin without `tabs`). Decision 2 (surface): keep side-panel-primary; add onboarding, do NOT add `action.default_popup`.

**Architecture:** `activeTab` lets the panel read the active URL when it opens (the toolbar click that opens the side panel grants activeTab for that tab). The panel then requests host permission for **that origin's registrable domain** via `chrome.permissions.request` inside the grant-button gesture (URL already known from mount → the request call stays synchronous). Durable per-origin host permission then covers subsequent reads (host permission also unlocks `tab.url` for matching tabs). Broad `<all_urls>` stays as the all-scope opt-in and as the fallback when the active URL can't be read.

**Tech Stack:** WXT + React 19 + TS, Zustand, Vitest.

## Global Constraints

- Keep **no `tabs` permission** and **no install-time `host_permissions`**. Add only `activeTab` (shows no install warning; is NOT the `tabs` permission). Keep `optional_host_permissions: ['<all_urls>']` as the grantable superset (Chrome requires a declared pattern to request any subset of it).
- Never log cookie values; values render as text nodes only. Free build ships no Pro code.
- Do NOT regress the working broad path: `<all_urls>`, once granted, must still satisfy every scope (per-site checks pass when broad is held).
- **Verification caveat (call out in the report):** Chrome permission *prompts* and `activeTab` timing can't be exercised by the standalone-panel Playwright harness (it pre-grants via the BOKAL_E2E manifest). The per-site permission LOGIC is unit-tested; the actual grant prompt needs real-browser QA — same limitation the current broad flow already has.
- Commit per task; keep `pnpm -r test` + `tsc` green.

---

### Task 1: Per-site permission helpers (pure lib + tests)

**Files:**
- Modify: `apps/cookie-manager/lib/permissions.ts`
- Create: `apps/cookie-manager/lib/permissions.test.ts`

**Interfaces (add; keep existing `hasAllUrlsPermission`/`requestAllUrls`/`onPermissionsChanged`):**
- `registrableDomain(host: string): string` — eTLD+1 heuristic (last 2 labels; last 3 if the 2-label suffix is a known multi-part public suffix like `co.uk`, `com.au`, `co.jp`; return host unchanged for IPs / single-label hosts). Documented as a heuristic (a full PSL would be exact) — mirrors Cookie-Editor.
- `siteOriginPatterns(url: string): string[]` — `[`${scheme}//${host}/*``, `${scheme}//*.${registrableDomain(host)}/*`]` (the second covers the apex + all subdomains; matches Cookie-Editor's `permissionHandler.js`). Returns `[]` for unparseable/non-http(s) URLs.
- `hasSiteAccess(url: string): Promise<boolean>` — `chrome.permissions.contains({ origins: siteOriginPatterns(url) })`; returns false for `[]`. (True when the per-site OR the broad `<all_urls>` grant is held, since `<all_urls>` contains the subset.)
- `requestSiteAccess(url: string): Promise<boolean>` — `chrome.permissions.request({ origins: siteOriginPatterns(url) })`; false for `[]`. MUST be called from a gesture with the URL already known (no await before it).

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrableDomain, siteOriginPatterns, hasSiteAccess, requestSiteAccess } from './permissions';

describe('registrableDomain', () => {
  it('reduces a subdomain to eTLD+1', () => { expect(registrableDomain('www.example.com')).toBe('example.com'); });
  it('handles a multi-part public suffix', () => { expect(registrableDomain('shop.example.co.uk')).toBe('example.co.uk'); });
  it('leaves an apex domain', () => { expect(registrableDomain('example.com')).toBe('example.com'); });
  it('leaves an IP / single label', () => { expect(registrableDomain('localhost')).toBe('localhost'); expect(registrableDomain('127.0.0.1')).toBe('127.0.0.1'); });
});

describe('siteOriginPatterns', () => {
  it('covers the host and *.registrableDomain', () => {
    expect(siteOriginPatterns('https://www.example.com/path?q=1')).toEqual(['https://www.example.com/*', 'https://*.example.com/*']);
  });
  it('returns [] for a non-http url', () => { expect(siteOriginPatterns('chrome://extensions')).toEqual([]); });
});

describe('hasSiteAccess / requestSiteAccess', () => {
  beforeEach(() => { (globalThis as unknown as { chrome: unknown }).chrome = { permissions: { contains: vi.fn(async () => true), request: vi.fn(async () => true) } }; });
  it('checks contains with the site patterns', async () => {
    expect(await hasSiteAccess('https://a.example.com/')).toBe(true);
    expect(chrome.permissions.contains).toHaveBeenCalledWith({ origins: ['https://a.example.com/*', 'https://*.example.com/*'] });
  });
  it('returns false for an unsupported url without calling chrome', async () => {
    (chrome.permissions.contains as unknown) = vi.fn(async () => true);
    expect(await hasSiteAccess('about:blank')).toBe(false);
    expect(chrome.permissions.contains).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run `pnpm --filter @bokal/cookie-manager exec vitest run lib/permissions.test.ts` → FAIL.
- [ ] **Step 3: Implement** the four functions. `registrableDomain`: split on `.`; if ≤2 labels or the host is all-numeric (IP), return host; if last two labels are in `MULTI_PART_SUFFIXES` (a small set: `co.uk gov.uk ac.uk com.au net.au org.au co.nz co.jp co.kr com.br com.cn co.in co.za`), return last 3 labels, else last 2. `siteOriginPatterns`: `new URL(url)`, bail (`[]`) unless protocol is `http:`/`https:`.
- [ ] **Step 4:** Run → PASS; `pnpm -r test` green; `tsc` clean.
- [ ] **Step 5: Commit** `feat(m11): per-site host-permission helpers (registrableDomain, siteOriginPatterns, has/requestSiteAccess)`

---

### Task 2: Declare `activeTab`

**Files:**
- Modify: `apps/cookie-manager/wxt.config.ts` (`permissions` += `activeTab`)

- [ ] **Step 1:** Add `'activeTab'` to the `permissions` array. (activeTab shows no install warning and is not the `tabs` permission — it lets the panel read the active tab's URL after the opening gesture, enabling a per-origin request without broad access.)
- [ ] **Step 2:** `build`; confirm generated manifest `permissions` = `["cookies","storage","sidePanel","unlimitedStorage","alarms","activeTab"]`, still **no** `host_permissions`, `optional_host_permissions` unchanged.
- [ ] **Step 3: Commit** `feat(m11): declare activeTab (read active URL for per-site grants; no tabs, no install warning)`

---

### Task 3: Per-site grant gate in the cookies store

**Files:**
- Modify: `apps/cookie-manager/stores/cookies-store.ts` (`refresh`)

**Behavior:**
- `all` scope: gate on `hasAllUrlsPermission()` (unchanged — genuinely needs broad).
- `site` scope: read `activeUrl` first; `granted` = `activeUrl != null && await hasSiteAccess(activeUrl)`. When granted, load site cookies as today. When not, set `granted:false` but keep `activeUrl` (so the grant screen can name the site if activeTab surfaced it).
- Keep the `ready`/seq-guard/session-cache logic intact.

- [ ] **Step 1:** Rework `refresh`: compute `activeUrl = await getActiveTabUrl()` up front. If `scope === 'all'` → `granted = await hasAllUrlsPermission()`. Else → `granted = !!activeUrl && await hasSiteAccess(activeUrl)`. If not granted: `set({ granted:false, activeUrl, cookies:[], loading:false, ready:true })` (note: pass `activeUrl`, not null, so the grant UI can show the host). If granted: existing cookie-load path (site vs all). Import `hasSiteAccess` alongside `hasAllUrlsPermission`.
- [ ] **Step 2:** `tsc` clean; `pnpm -r test` green; `build` ok.
- [ ] **Step 3: Commit** `feat(m11): per-site grant gate (site scope checks the active origin; all scope needs <all_urls>)`

---

### Task 4: GrantAccess — request the active site (broad only as opt-in / fallback)

**Files:**
- Modify: `apps/cookie-manager/components/GrantAccess.tsx`
- Modify: `apps/cookie-manager/entrypoints/sidepanel/App.tsx` (pass `activeUrl`, `scope` to GrantAccess; keep the all-scope path)

**Behavior:**
- GrantAccess receives `activeUrl` and `scope`.
- `site` scope with a known `activeUrl`: primary button "Allow cookies for **{host}**" → `requestSiteAccess(activeUrl)` (URL known from mount, so the request stays synchronous in the click). A secondary, muted link "Enable access for all sites instead" → `requestAllUrls()`.
- `site` scope with NO `activeUrl` (e.g. a tab Bokal can't yet see): copy "Reopen Bokal from the toolbar icon on the site you want to manage" + a fallback "Allow all sites" button → `requestAllUrls()`.
- `all` scope not granted: "Enable access for all sites to view every cookie" → `requestAllUrls()`.
- Onboarding hint (Decision 2 mitigation): one muted line — "Bokal lives in the side panel — click the toolbar icon any time to open it here."

- [ ] **Step 1:** Rework `GrantAccess` to take `{ activeUrl, scope, onGrant }` and render the branch above; import `requestSiteAccess`, `requestAllUrls`. Each handler calls the request synchronously (no await before it) then `.then((g) => { if (g) onGrant(); })`.
- [ ] **Step 2:** `App`: `<GrantAccess activeUrl={activeUrl} scope={scope} onGrant={...} />`.
- [ ] **Step 3:** `tsc` clean; `pnpm -r test` green; `build` ok; E2E both builds (the grant-gate test asserts the gate renders without host access — the copy changed but the gate still shows; update the E2E selector if it matched old text).
- [ ] **Step 4: Commit** `feat(m11): per-site grant UI (allow one site; all-sites as explicit opt-in) + side-panel onboarding hint`

---

### Task 5: Truthful store copy + threat-model + full gate

**Files:**
- Modify: `docs/store/permission-justifications.md` (host line — now literally true), `docs/store/listing.md` (host line), `docs/store/privacy-policy.md` (if needed), `docs/threat-model.md` (§2.2 — remove the accuracy-gap flag; describe the per-site default + broad opt-in + activeTab)

- [ ] **Step 1:** Rewrite the host-access copy to the now-true statement: Bokal declares no host access at install; it requests access **for the specific site you're on** at runtime (via Chrome's prompt), and requests all-sites access only when you open the all-cookies view / export all sites / run cleanup. Add `activeTab` to the plain-English permissions list ("read the current tab's address so Bokal can ask for access to just that site; not the `tabs` permission, shows no install warning"). Remove the `docs/threat-model.md` §2.2 "accuracy flag" block (the gap is now closed) and describe the per-site model.
- [ ] **Step 2: Full gate:**
  ```bash
  pnpm -r test && pnpm --filter @bokal/cookie-manager exec tsc --noEmit
  pnpm --filter @bokal/cookie-manager build && pnpm --filter @bokal/cookie-manager zip
  pnpm --filter @bokal/cookie-manager exec playwright test
  pnpm --filter @bokal/cookie-manager build:e2e && BOKAL_E2E=1 pnpm --filter @bokal/cookie-manager exec playwright test
  ```
  Confirm: tests green; manifest `permissions` = the 5 + `activeTab`, no `host_permissions`, `optional_host_permissions:['<all_urls>']`, `devtools_page` present; ProfilesPanel still a separate chunk; E2E green both builds.
- [ ] **Step 3: Commit** `docs(m11): store copy + threat-model now describe the (true) per-site permission model`

---

## Self-Review

- **Spec/decision coverage:** per-site helpers (T1) + activeTab (T2) + grant gate (T3) + grant UI/onboarding (T4) + truthful copy (T5). Decision 2: no `action.default_popup` added; onboarding hint added. ✓
- **Placeholder scan:** all steps carry real code/commands. ✓
- **Type consistency:** `registrableDomain`/`siteOriginPatterns`/`hasSiteAccess`/`requestSiteAccess` consistent lib→store→component; existing broad helpers untouched. ✓
- **No-regression:** broad `<all_urls>` still satisfies `hasSiteAccess` (superset) and remains the all-scope path + fallback; nothing forces a broad grant away. ✓
- **Invariants:** no `tabs`; no install-time host perms; `activeTab` only; no value logging; text nodes; no Pro code. ✓
