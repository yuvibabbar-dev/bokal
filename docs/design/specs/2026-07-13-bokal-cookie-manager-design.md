# Bokal — Design Spec (Cookie Manager, MV3 Chrome Extension)

- **Date:** 2026-07-13
- **Status:** Approved design — ready for implementation planning
- **Source architecture doc:** [`bokal.md`](../../../bokal.md)
- **Research provenance:** all technical decisions below were verified against current (July 2026) primary sources via a 10-area research + adversarial-verification pass; every verification returned "upheld". See §14.

---

## 0. Summary & scope

**Bokal** is a Manifest V3 Chrome/Edge cookie manager (React + TypeScript) positioned into the vacuum left by EditThisCookie: **minimal permissions, no remote code, local-first, published source.** Every decision is filtered through that trust positioning.

**In scope (full MVP, doc Weeks 1–6):**
1. Free core: WXT scaffold, runtime `<all_urls>` permission flow, full cookie CRUD with prefix/SameSite/size validation, search/filter, virtualized list, XSS-safe rendering, import/export, dark mode, CHIPS partition inspector.
2. Pro layer: ExtPay integration (placeholder app ID, dev/mock mode), entitlement cache + offline grace + alarm re-check, dynamic-import gating, and **named local cookie profiles/sets** (Pro feature #1) with optional at-rest encryption.
3. Hardening + tests: Vitest unit + Playwright E2E, SW-termination test, redaction audit, threat-model doc.
4. Store-prep **artifacts**: privacy policy, data-use disclosure answers, per-permission justifications, listing copy, 1280×800 screenshots, icon/promo tiles, EU-DSA trader-verification checklist.

**Deferred (post-launch, not in this build):** cloud sync + Cloudflare backend + E2E crypto; tracker/compliance scoring (Tracker Radar is non-commercial-licensed); Firefox port (`sidebar_action` fork); the second JSON-viewer extension.

**Boundary — requires the user, cannot be done from here:** real Stripe payment test; registering a real ExtPay app ID; CWS/Edge developer accounts, store submission, and EU-DSA trader verification (public legal name/address/SMS phone); hosting the privacy-policy URL. Bokal delivers the built, zipped, ready-to-upload package plus all copy/artifacts; the user performs account-bound actions.

---

## 1. Locked decisions

| Area | Decision |
|---|---|
| Product name | **Bokal** |
| Framework | **WXT** (Vite-based), version **pinned** (pre-1.0; 0.x minor bumps can break) |
| Repo | **pnpm monorepo**, cookie-manager app only; shared `ui-kit`/`pay`/`tsconfig` packages so the JSON viewer slots in later with no refactor |
| Payments | **ExtPay** with a **placeholder app ID in dev/mock mode**; swap real ID + Stripe later. Provider not abstracted behind an interface (YAGNI); ExtPay wrapper isolated in `packages/pay` if a swap is ever needed |
| `tabs` permission | **Dropped** (max-minimal, zero install warnings) |
| Install perms | `["cookies","storage","sidePanel"]` + `optional_host_permissions:["<all_urls>"]` + `unlimitedStorage` |
| Primary UI | Global side panel (one per window) |
| State | Zustand vanilla store; **`chrome.storage` is the source of truth** |
| Pro feature #1 | Named local cookie profiles/sets |

---

## 2. Repo layout

Git repo + pnpm workspace rooted at `chrome_extensions/bokal/`.

```
bokal/
  docs/                              # bokal.md (source) + this spec + threat-model.md + store/ artifacts
  pnpm-workspace.yaml
  package.json                       # workspace root scripts (build, test, e2e, zip)
  .github/workflows/ci.yml
  packages/
    tsconfig/                        # shared tsconfig base
    ui-kit/                          # dark mode, virtualization wrapper, form controls, JSON-tree
    pay/                             # ExtPay wrapper + entitlement/grace/gating logic
  apps/
    cookie-manager/                  # WXT + React + TS
      wxt.config.ts
      entrypoints/
        background.ts                # service worker
        sidepanel/                   # index.html + React app (primary UI)
      lib/                           # cookies API wrapper, validation, import/export, crypto
      stores/                        # zustand stores (cookies, entitlement, ui)
      components/
      e2e/                           # Playwright specs
```

Each unit has one clear purpose and a defined interface: `packages/pay` exposes an entitlement API and knows nothing about cookies; `lib/cookies` wraps `chrome.cookies` and knows nothing about React; `ui-kit` is presentational and knows nothing about the extension APIs.

---

## 3. Manifest & permissions

MV3, `minimum_chrome_version: 114`, name **Bokal**, background service worker (`type: "module"`), `side_panel.default_path`, CSP `script-src 'self'; object-src 'self'`.

- **Install-time permissions:** `["cookies","storage","sidePanel"]` + `unlimitedStorage`. No `tabs`.
- **`optional_host_permissions: ["<all_urls>"]`**, requested at runtime via `chrome.permissions.request()` **synchronously inside a user gesture** (no `await` before the call, or the gesture is lost).
- **First-run UX (consequence of dropping `tabs`):** before the host grant, the panel cannot name the active site. Empty state reads "Grant access to read cookies for **this site**" with a Grant button (the gesture). After grant, `tabs.query({active,lastFocusedWindow})` returns `url` (host permission substitutes for `tabs` for the four sensitive tab properties), so host name + cookies appear together. `tabs.onActivated` still fires without `tabs` (carries `tabId`/`windowId` only) → on tab switch, re-query and re-read cookies for the newly active tab.
- Partial grants (user grants specific hosts instead of `<all_urls>`) are handled: cookie/URL access is limited to granted hosts; UI surfaces which hosts are accessible.

---

## 4. Extension architecture

### Service worker (`background.ts`)
All listeners registered **synchronously at top level**. No global state — everything persists to `chrome.storage`.
- `cookies.onChanged` → relay to panel; **debounced/coalesced** to absorb the remove-then-write **double-fire** (an `"overwrite"` immediately followed by an `"explicit"` for the same name+domain+path within a short window = one logical update).
- `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` (there is no manifest field for this).
- `chrome.alarms` daily entitlement re-check (min 30s interval; never `setTimeout`).
- `permissions.onAdded`/`onRemoved` to react to host-grant changes.

### Side panel (primary surface)
Global (one per window), calls `chrome.cookies.*` **directly** — no SW round-trip for CRUD. Refreshes on `tabs.onActivated`. `getLayout()` feature-detected (Chrome 140+) for left/right RTL awareness; new installs default the panel to the **right**, so never assume left. A lightweight popup is an optional secondary quick-access surface (post-MVP).

### Messaging
`chrome.runtime.sendMessage` promise-based for panel↔SW (entitlement reads, `onChanged` relay). No long-lived keepalive ports. No offscreen document (clipboard handled in the panel).

### State
Zustand vanilla stores usable outside React (SW + panel). Because the panel remounts on close/reopen and the SW idle-suspends (~30s), **in-memory Zustand state is per-context and ephemeral** — `chrome.storage` (local/session) is the single source of truth; stores rehydrate on load and sync via `chrome.storage.onChanged`. `@tanstack/react-virtual` virtualizes the cookie list (`useFlushSync:false` under React 19); "all cookies" runs to thousands of rows, single-domain to ~180.

---

## 5. Cookie CRUD + validation (free core)

Views: current-domain cookies + an "all cookies" view. Full attribute editor: `name`, `value`, `domain`, `path`, `secure`, `httpOnly`, `sameSite`, expiry (with session toggle → omit `expirationDate`), `storeId`, `partitionKey`. HttpOnly cookies are read **and** written via the API (operates on the network store, not `document.cookie`) — a real differentiator vs page JS.

**Client-side validation before `set()`** (writes fail silently otherwise):
- `__Host-` → requires `Secure` + `Path=/` + **no** `Domain` (host-only). Reject e.g. `__Host-id=1; Secure` (missing Path) or `…; Path=/; Domain=example.com` (Domain set).
- `__Secure-` → requires `Secure` on an HTTPS origin.
- `sameSite:"no_restriction"` requires `secure:true`.
- name+value ≤ **4096 bytes**; each attribute value ≤ **1024 bytes**; soft warning near **~180 cookies/domain** (observed/RFC-6265bis limits, not API-guaranteed — treat as enforcement thresholds).
- `set()` requires a constructed `url` and matching host permission; missing cookies in `getAll` may be a permissions gap, not an API bug — surface that distinction.

Search/filter across name/domain/value. Copy-value via `navigator.clipboard.writeText` with an optional auto-clear/warning (copied tokens are stealable).

---

## 6. CHIPS partition inspector (free differentiator)

Toggle to browse **partitioned** cookies by partition. **Extend the partition model beyond the doc:** carry `partitionKey.hasCrossSiteAncestor` (Chrome 130+), not just `topLevelSite`, and use `chrome.cookies.getPartitionKey()` to address third-party partitioned cookies correctly — both are now first-class in the official API. Group/label cookies by partition. Scope this as a **secondary "power/debug" feature, not the headline**: CHIPS is default-on and now cross-browser (Baseline 2025) but Firefox/Safari flip-flopped on it and real-world `Partitioned` adoption is still thin. Headline pitch stays the simple truth: third-party cookies are fully alive in Chrome with no sunset.

---

## 7. Import / export

- **Export:** generate a `Blob` in the panel + `<a download>` (`URL.createObjectURL`) — **no `downloads` permission**. Formats: JSON (Cookie-Editor-compatible shape) + optional Netscape `cookies.txt`.
- **Import:** file input → parse → validate (§5 rules) → bulk `set()`, reporting per-cookie failures.
- **Invariant (tested):** export → import round-trips losslessly.

---

## 8. Security / threat model

Cookie values are session tokens — treated as credential material throughout.
- **XSS:** values rendered as **text nodes only** (React default escaping; never `dangerouslySetInnerHTML`, never inject into HTML). Explicit test: a value like `<img onerror=…>` must never execute in the panel.
- **CSP:** `script-src 'self'; object-src 'self'`. **No remote code**, no CDNs, no `eval` — everything bundled (ExtPay's library is bundled, not remotely loaded).
- **Telemetry:** default to **none**; if any error reporting is added it must redact cookie names/values/URLs-with-tokens in `beforeSend`. Never log values to console in production. Marketed as a trust feature.
- **Profiles at rest:** Pro profiles are live credentials. Offer **optional passphrase encryption** — AES-GCM (random 96-bit IV per encryption, stored with ciphertext) with a key derived via PBKDF2 (WebCrypto, ≥600k iterations, SHA-256). Zero-knowledge: losing the passphrase loses the data (documented).
- **Trust mitigation (post-copycat):** public source repo, minimal manifest, no remote code, published `docs/threat-model.md`. This is the core differentiator against the malicious "EditThisCookie®" that poisoned the category.

---

## 9. Pro layer — ExtPay + gating + local profiles

### `packages/pay`
ExtPay wrapper. `getUser().paid` for entitlement; `openPaymentPage()` to charge. Tiers **$2.99/mo · $19/yr · $29 lifetime**. **Placeholder app ID, ExtPay dev/mock mode.**
- **All-in take rate is ~7–8%** (ExtPay 5% + Stripe ~2.9%+$0.30) — not 5%. ExtPay is **not** a merchant-of-record → tax is the user's responsibility (fine under CAD $30k GST/HST small-supplier threshold at launch).
- **Defensive integration** (ExtPay reliability caveats): `getUser()` can throw on network failure → catch and fall back to cache; the payment window is a popup that blockers can silently kill → detect and show a manual "open payment page" fallback; guard the known bug where subscription status vanishes when multiple extension versions are installed. Verify the real flow with a real test payment before launch (user action).

### Entitlement
Cache `{ paid: boolean, checkedAt: number }` in `storage.local`. **Offline grace: 14 days** (`GRACE_MS`, tunable) — if `Date.now() - checkedAt < GRACE_MS`, honor last-known-paid — **fail open for paying users, fail closed for never-paid.** Daily `chrome.alarms` async re-check.

### Gating
Pro modules loaded via **dynamic `import()`** behind the entitlement check so the **free build ships zero Pro code** (clean CWS review separation; reviewers never see dormant Pro logic).

### Pro feature #1 — named cookie profiles/sets
Snapshot a domain's cookies (or a selection) as a named profile → apply/restore (bulk `set()`) → delete. Stored in `storage.local` (+ `unlimitedStorage`) for the common case, graduating to **IndexedDB** for larger libraries. Passphrase encryption (§8) is **opt-in (default off)**, with an in-UI warning that profiles hold live credentials; when enabled it applies to the whole profile store. Keep write-failure handling regardless of storage area (global disk quota can still fail writes).

---

## 10. Testing

- **Unit (Vitest + WXT `fakeBrowser`/`@webext-core/fake-browser`):** entitlement + offline-grace math, prefix/size validation, `onChanged` debounce/coalesce, import/export round-trip. Note: `fakeBrowser` does **not** mock `chrome.cookies` → hand-mock the cookies wrapper in units; real cookie behavior is E2E-only.
- **E2E (Playwright):** `chromium.launchPersistentContext(userDataDir, { channel: 'chromium', args: ['--disable-extensions-except=DIST','--load-extension=DIST'] })` — **`channel:'chromium'` is mandatory** because Chrome/Edge removed the sideload flags; that channel also runs extensions **headless**, so prefer headless in CI and keep `xvfb-run` only as a fallback for flaky SW startup. Read the extension ID from the SW URL via `context.waitForEvent('serviceworker')` then `sw.url().split('/')[2]` (not `serviceWorkers()[0]` immediately). Cover: permission-grant flow, side-panel CRUD on a live site, XSS-safe render, paywall gating in dev/mock mode, and **SW-termination → rehydrate-from-storage** (force-stop, trigger event, assert state restored).

---

## 11. CI/CD + cross-browser

GitHub Actions matrix: build → Vitest → Playwright (headless chromium, xvfb fallback) → zip artifacts. Types via `chrome-types` or `@types/chrome` (either fine). WXT emits **Chrome + Edge** from the same MV3 zip for day-one cross-publish; Firefox build deferred (`sidebar_action` fork). Store-upload tooling (`chrome-webstore-upload-cli`, Edge Add-ons API) is wired but **submission stays manual** (user accounts). New items publish at **100%** (staged % rollout needs >10k 7-day active users); Version Rollback (no re-review) is the launch-phase safety net.

---

## 12. Store-prep deliverables + CWS/trader realities

Bokal produces (user submits):
- Privacy policy + **Limited Use** statement (host URL is user's).
- Data-use disclosure answers: **Authentication information** + **Website content** (and scope to **web browsing activity** only if cookie storage implicates it); certify no sale/transfer, no collection/transmission (no sync in MVP).
- Per-permission justifications (`cookies`, `storage`, `sidePanel`, host permission).
- Single-purpose description ("View, edit, add, delete, import, and export browser cookies") + non-stuffed listing copy; 1280×800 screenshots generated from the running extension; 128×128 icon + promo tiles (440×280 / 1400×560).

**Corrected expectations (verified):**
- **Review takes weeks, not ~3 days** (April-2026 submission surge, officially acknowledged). Keep the first release lean to speed manual review.
- **Trader status is triggered by commercial capacity, not by charging** — publishing as a business/professional makes you a trader even for a free tier. Legal name + address + **SMS-verified phone** are mandatory and **posted publicly at the listing footer** → use a business/registered-agent address, not a home address. **DUNS is optional** (org-only; a solo dev verifies via SMS phone). Verification info can't be edited in place (must flip to Non-Trader and re-verify).
- **Aug 1 2026 CWS policy:** data use must be **"strictly necessary"** to the stated single purpose — any excess is a rejection risk.
- Chrome Web Store Payments have been shut since Feb 2021 → all paid tiers run through ExtPay/Stripe, never a CWS billing rail.

---

## 13. What can / can't be verified here

**Can (and will show):** build; unit + E2E tests; loading the extension in a Chromium browser and driving real cookie CRUD on a live site; XSS/permission/import-export verification; Pro gating in ExtPay dev/mock mode.

**Cannot (user action):** a real Stripe payment; store submission; EU-DSA trader verification; hosting the privacy policy.

---

## 14. Research provenance (2026-07-13)

10 decision areas each researched against primary sources and adversarially re-checked; **all verifications "upheld".** Key sources: WXT [npm 0.20.27](https://registry.npmjs.org/wxt/latest) + [upgrade guide](https://wxt.dev/guide/resources/upgrading); [ExtensionPay](https://extensionpay.com/) (5% + Stripe, non-MoR); [`chrome.cookies`](https://developer.chrome.com/docs/extensions/reference/api/cookies) (double-fire, `getPartitionKey`, `hasCrossSiteAncestor`); [`chrome.sidePanel`](https://developer.chrome.com/docs/extensions/reference/api/sidePanel); [Cookie-Editor manifest](https://github.com/Moustachauve/cookie-editor/blob/master/manifest.chrome.json) + [`chrome.tabs` sensitive-property rules](https://developer.chrome.com/docs/extensions/reference/api/tabs); [`chrome.storage`](https://developer.chrome.com/docs/extensions/reference/api/storage) quotas; [Privacy Sandbox reversal](https://privacysandbox.google.com/blog/privacy-sandbox-next-steps) + [retirements](https://privacysandbox.google.com/blog/update-on-plans-for-privacy-sandbox-technologies); [CWS trader FAQ](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq) + [Aug-2026 policy](https://developer.chrome.com/blog/cws-policy-updates-2026); [Playwright Chrome extensions](https://playwright.dev/docs/chrome-extensions) (chromium-channel headless); Zustand [v5.0.14](https://www.npmjs.com/package/zustand) + [`@tanstack/react-virtual` v3.14.6](https://www.npmjs.com/package/@tanstack/react-virtual).

---

## 15. Deferred (explicitly out of scope for this build)
Cloud sync + Cloudflare Workers/D1 backend + E2E crypto; tracker/compliance scoring (DuckDuckGo Tracker Radar is CC BY-NC-SA — needs a commercial license; license-free attribute-only scoring possible later); Firefox port (`sidebar_action`); the second JSON-viewer extension (shared-package structure leaves room for it).

## 16. Open questions
None blocking. Defaults chosen (tunable during build): offline-grace window = **14 days**; profile encryption = **opt-in, default off**. Still genuinely optional: keeping Netscape export in scope, and adding a secondary popup surface (post-MVP).
