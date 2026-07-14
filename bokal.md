# Architecture Document: Modern Developer Cookie Manager (MV3 Chrome Extension)

## TL;DR
- Build with **WXT** (Vite-based, actively maintained, cross-browser) + React + TypeScript; ship **named cookie profiles/sets stored locally** as the first Pro feature and defer the cloud-sync backend — local profiles are dramatically cheaper to ship than either sync or compliance scoring.
- Declare only `cookies`, `storage`, `sidePanel` and **`optional_host_permissions: ["<all_urls>"]`** requested at runtime — exactly Cookie-Editor's model — to keep the install warning minimal and speed review.
- Monetize with **ExtensionPay** (Stripe under the hood, 5% fee on top of Stripe's ~2.9% + $0.30, no backend); privacy-scoring is a pure-local Pro feature but its best data source (DuckDuckGo Tracker Radar) is non-commercial-licensed, so profiles/sync is the safer premium path.

## Context and positioning
The original EditThisCookie had, per gHacks (Dec 31, 2024), "over 3 million users and 11,000 ratings" and has been unavailable in the Chrome Web Store since roughly July 2024 — most plausibly because it never migrated to Manifest V3 (Google never issued an official reason; journalists inferred it). Into that vacuum, a malicious copycat named "EditThisCookies," later rebranded **"EditThisCookie®"**, appeared. Malware analyst **Eric Parker** analyzed it in a YouTube video (it had 30,000 users at publish; gHacks noted "Today, it sits at more than 50,000 users"), finding a fake website, obfuscated code, and information-stealing/phishing behavior targeting Facebook. (Note: Parker did not confirm active cookie exfiltration in the version tested — some headlines overstate this. Do not attribute this analysis to Wladimir Palant; his contemporaneous malware research covers different extensions.)

This is the exact trust vacuum this product targets: **minimal permissions, no remote code, local-first, published source.** Every architectural decision below is filtered through that positioning.

## 1. Manifest and permissions design

### 1.1 Recommended manifest.json
```json
{
  "manifest_version": 3,
  "name": "CookieName",
  "version": "1.0.0",
  "minimum_chrome_version": "114",
  "background": { "service_worker": "background.js", "type": "module" },
  "action": { "default_title": "CookieName" },
  "side_panel": { "default_path": "sidepanel.html" },
  "permissions": ["cookies", "storage", "sidePanel"],
  "optional_host_permissions": ["<all_urls>"],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 1.2 Host permission strategy — the central trade-off
- `<all_urls>` in `host_permissions` (install-time) gives full functionality but triggers the "read and change all your data on all websites" warning and heavier review scrutiny.
- `activeTab` only grants the active tab on user gesture — too narrow for a cookie manager that shows all cookies for a domain.
- **Winner: `optional_host_permissions: ["<all_urls>"]`** requested at runtime via `chrome.permissions.request()` behind a user gesture. This is exactly what **Cookie-Editor by cgagnier (Moustachauve)** declares: `permissions: ["cookies","tabs","storage","sidePanel"]` plus `optional_host_permissions: ["<all_urls>"]` (verified in its `manifest.chrome.json`; 2M users, `minimum_chrome_version: 102`). I'd **drop `tabs`** if you can get the active-tab URL from the sidePanel context, keeping the install-time warning to essentially nothing.

Chrome's own guidance: request the narrowest permission; broad permissions trigger extra scrutiny and longer reviews. Per Chrome for Developers, "Most extensions are reviewed within three days," but a submissions surge is causing extended review times as of 2026.

### 1.3 chrome.cookies API surface (2026)
- Core methods: `cookies.get`, `getAll`, `set`, `remove`, `getAllCookieStores`, plus the `onChanged` event.
- **HttpOnly**: the API can both **read and write** HttpOnly cookies — `Cookie.httpOnly` is exposed on read, and `set()` accepts an `httpOnly` boolean. This is a key differentiator vs. page JS, which cannot touch HttpOnly cookies. Editing works because the API operates on the network cookie store, not `document.cookie`.
- **Two-step update gotcha**: updating a cookie is implemented as remove-then-write, firing `onChanged` twice — once with cause `"overwrite"` (the delete) then `"explicit"` (the write). Debounce your UI refresh accordingly.
- **Host permissions required**: `getAll` only returns cookies for domains the extension has host permission to; `set`/`remove` fail without host permission for the target URL. This is why runtime `<all_urls>` matters.
- **CHIPS / partitioned cookies**: `getAll`, `get`, `set`, `remove` all accept a `partitionKey`. By default all methods operate on **unpartitioned** cookies; to surface partitioned cookies you must pass `partitionKey`. A "CHIPS inspector" (browse cookies by partition key) is a strong differentiating free feature.
- **SameSite**: values are `"no_restriction"`, `"lax"`, `"strict"`, `"unspecified"`. `no_restriction` requires `secure: true`.
- **Prefix rules to enforce in the editor UI** (RFC 6265bis §4.1.3, MDN):
  - `__Secure-` → must be set with `Secure` on an HTTPS origin.
  - `__Host-` → must be `Secure`, `Path=/`, and **no** `Domain` attribute (locks to the exact host).
  - Validate client-side before calling `set()`, or the write silently fails. Example rejections: `__Host-id=1; Secure` (missing `Path=/`), `__Host-id=1; Secure; Path=/; Domain=example.com` (Domain set).
- **Size/count limits**: name+value combined ≤ **4096 bytes**; each attribute value ≤ **1024 bytes** (RFC 6265bis / Chromium "Cookie size limits" intent). Observed per-domain cap **~180 cookies** in Chrome (empirical from community test tools — not an official Google constant).
- Session vs persistent: omitting `expirationDate` on `set()` makes a session cookie; `Cookie.session` is `true` for these.

### 1.4 Privacy Sandbox status 2026 — and what it means
Google reversed third-party cookie deprecation on **April 22, 2025**. Anthony Chavez, VP of Privacy Sandbox, wrote: "We've made the decision to maintain our current approach to offering users third-party cookie choice in Chrome, and will not be rolling out a new standalone prompt for third-party cookies." Then, on **October 17, 2025**, Chavez announced Chrome "decided to retire" ten Privacy Sandbox APIs — Attribution Reporting, IP Protection, On-Device Personalization, Private Aggregation, Protected Audience, Protected App Signals, Related Website Sets, SelectURL, SDK Runtime, and Topics — while **keeping CHIPS, FedCM, and Private State Tokens**.

**Implication**: third-party cookies remain enabled by default in Chrome with no removal timeline — a cookie manager is *more* relevant, not less. Because **CHIPS partitioning is on by default since Chrome 114/115**, a **partition-key browser / CHIPS inspector** is a forward-looking feature competitors lack (and CHIPS is one of the few sandbox technologies Google is keeping). Safari (ITP) and Firefox still block third-party cookies by default — relevant to the Firefox port's value proposition.

## 2. Extension architecture

### 2.1 Service worker lifecycle
- Chrome terminates the SW after **30 seconds of inactivity**; a single event taking >5 min, or a fetch >30s, also kills it. Any event/API call resets the timer.
- **Never store state in global variables** — they vanish on termination. Persist everything to `chrome.storage`.
- Register all event listeners **synchronously at the top level** of the SW file, not inside async callbacks, or they won't fire on the wakeup event.
- Use `chrome.storage.session` (in-memory, ~10 MB) for ephemeral cross-wakeup state; `chrome.storage.local` for durable data.
- Use `chrome.alarms` (min 30s interval) instead of `setTimeout`/`setInterval` for anything periodic (e.g., entitlement re-check).

### 2.2 Messaging
- For request/response (get cookies, set cookie): `chrome.runtime.sendMessage` with a Promise. Simple, stateless, survives SW restart.
- Avoid long-lived ports as a keepalive hack. The side panel is a normal extension page that can call `chrome.cookies.*` directly — you often don't need to route through the SW at all. Reserve the SW for `onChanged` listeners and permissions/entitlement logic.
- Offscreen documents: only needed for DOM APIs unavailable in a SW. For this app, the panel/popup handle clipboard directly — **no offscreen document needed**.

### 2.3 Side panel vs popup
- `chrome.sidePanel` shipped stable in **Chrome 114**. Manifest key `side_panel.default_path`; permission string `sidePanel`.
- `sidePanel.open()` must be called **inside a user gesture** (the #1 cause of silent failures).
- There is **no `openPanelOnActionClick` manifest field**; set it from the SW via `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.
- Global vs per-tab: default is one panel per window (persists across tabs). For a cookie manager you **want global** — cookies-for-current-tab update as the user switches tabs via `tabs.onActivated`. Simpler than per-tab scoping, which requires the `setOptions({enabled:false})` + per-tab-enable dance.
- **UX split**: side panel as the primary surface (resizable, persistent, feels like an app); open it on action click. `sidePanel.getLayout()` (Chrome 140+) reports left/right for RTL layouts.

### 2.4 State management + large lists
- Use **Zustand** (tiny, no boilerplate, works cleanly outside the React tree) over Context for the cookie store and entitlement state. Jotai is a fine alternative; avoid Redux.
- Virtualize the cookie list with **@tanstack/react-virtual** — domains can hold ~180 cookies and "all cookies" views run to thousands of rows. Render only visible rows.

### 2.5 Storage architecture
- `chrome.storage.local`: **10 MB** (5 MB before Chrome 114), raisable with `unlimitedStorage` (low review risk). Use for cookie profiles/sets, settings, entitlement cache.
- `chrome.storage.sync`: **102,400 bytes total, 8,192 bytes/item, 512 items max, ~120 writes/min**. Named cookie profiles will **not** fit reliably — a single logged-in session profile easily exceeds 8 KB/item. **Do not** put profiles in sync storage; chunking across 512 items is fragile. Use `sync` only for small preferences (theme, column layout).
- `chrome.storage.session`: **~10 MB**, in-memory, cleared on browser close (was ~1 MB before Chrome 112). Good for sensitive transient state; not exposed to content scripts by default (change via `setAccessLevel`).
- **IndexedDB** from the panel (or SW) for larger profile libraries — accessible from both contexts, no 10 MB ceiling concern in practice.
- **Export**: generate a `Blob` in the panel and trigger an anchor download (`URL.createObjectURL` + `<a download>`). This **avoids the `downloads` permission entirely**. MV3 broke background-initiated downloads from content scripts, so keep generation in the panel context.

### 2.6 Security architecture (threat model)
Cookie values are attacker-controlled, sensitive strings (they are session tokens). Treat the whole app as handling authentication data.
- **No telemetry containing values.** Any error reporting must redact cookie names/values. Never log values to console in production.
- **XSS**: render cookie values as **text nodes only** (React escapes by default — never `dangerouslySetInnerHTML`, never inject values into HTML). A malicious value like `<img onerror=...>` must never execute in the panel.
- **CSP**: `script-src 'self'; object-src 'self'` on `extension_pages`. No CDNs, no inline scripts, no `eval`. Bundle everything locally.
- **Clipboard**: "copy value" writes via `navigator.clipboard.writeText`; consider auto-clearing or a warning, since copied tokens can be stolen.
- **Profiles store**: profiles contain live session cookies = credential material. If cloud sync ships, it must be **end-to-end encrypted** (server never sees plaintext — see §3.3). Even local-only, offer optional passphrase encryption of the profile store at rest.
- **Trust mitigation** (post-EditThisCookie-copycat): a malicious update could exfiltrate all cookies; the defenses that matter to users are a **public source repo, minimal manifest, no remote code, and the CWS review**. Publish the threat model. This is your core differentiator against the copycat that poisoned the category.

## 3. Pro / monetization architecture

### 3.1 ExtensionPay
- Drop-in `ExtPay.js` library; Stripe under the hood; free to start; works cross-browser (Chrome/Edge/Firefox). Google shut down Chrome Web Store Payments in 2021 (it took a 5% fee); ExtPay's creator Glen Chiacchieri positions it as "the best replacement we've been able to come up with."
- **Fee**: per an addonews.com review, "5% of the transaction… on top of the fee that Stripe already takes (typically 2.9% + $0.30)." ExtPay reports developers have collectively made over $500k.
- API: `extpay.getUser().then(user => user.paid)` for entitlement; `extpay.openPaymentPage()` to charge. Supports one-time, subscription, free trials, freemium — covers your $2.99/mo, $19/yr, and $29 lifetime tiers.
- Requires registering the extension on extensionpay.com; the ExtPay origin must be reachable (it opens a payment tab/window).
- **Reliability/limitations**: no real developer admin dashboard (data split between ExtPay's minimal UI and Stripe); reports of the payment window being popup-blocked and failing silently — **verify the full flow with real test payments, not just dev mode**. Design a **fallback**: cache entitlement in `chrome.storage.local`, re-check via `chrome.alarms` (daily), and grant a **7–14 day offline grace period** so a temporary ExtPay outage doesn't lock out paying users.
- **Canada solo dev**: ExtPay + Stripe handles international billing and provides tax data; you remain responsible for remitting taxes. This is the simplest path. LemonSqueezy/Paddle act as merchant-of-record (they remit sales tax/VAT for you), which is attractive at scale, but license-key validation from an extension means CORS-enabled endpoints and your own key-check logic — more work than ExtPay. **Recommendation: ExtPay for launch**; revisit Paddle/LemonSqueezy if tax-compliance overhead grows.

### 3.2 Feature-gating architecture
- **Clean free/Pro separation for review compliance**: the free path must never load Pro code. Use dynamic `import()` for Pro modules gated behind an entitlement check, or build-time separation, so free users don't ship dormant Pro logic that confuses reviewers.
- Cache entitlement as `{ paid: boolean, checkedAt: number }` in `storage.local`. Read on UI load; refresh async.
- **Offline grace**: if `Date.now() - checkedAt < GRACE_MS`, honor last-known-paid. Fail open for paying users, fail closed for never-paid.

### 3.3 If cloud sync is the Pro feature (defer this)
- **Backend: Cloudflare Workers + D1** (SQLite, 10 GB/db) or KV. Free plan: 100k requests/day; paid plan **$5/month minimum** with no egress charges. Cheapest reliable option for a solo dev vs Supabase/Firebase.
- **End-to-end encryption** so the server never sees cookie values:
  - Derive a key from a user passphrase with **PBKDF2** (WebCrypto, ≥600k iterations, SHA-256). Argon2 is stronger but needs WASM; PBKDF2 via WebCrypto is built-in and adequate.
  - Encrypt each profile blob with **AES-GCM** (random 96-bit IV per encryption, stored alongside ciphertext).
  - Server stores only ciphertext + metadata (encrypt profile names too). Zero-knowledge: losing the passphrase = losing the data (document this).
- **Conflict resolution**: last-write-wins with an `updatedAt` timestamp per profile is sufficient; surface a conflict prompt for divergent edits rather than silent-merging.
- **Estimated monthly cost**: at 1k mostly-idle users, **$0–5** (free tier / base plan). At 10k users, **~$5–15** (base + modest D1/KV overage; KV writes are $5/million, reads $0.50/million after free allowances). At 50k users, **~$20–60** depending on sync frequency. Bandwidth is free on Workers — trivial relative to Pro revenue.

### 3.4 If privacy/compliance scoring is the Pro feature
- **Purely local scoring** over cookie flags: Secure, HttpOnly, SameSite strength, expiry length, host-only vs domain, third-party status, prefix compliance. No backend, no network — the cleanest privacy story and cheapest possible infra.
- **Tracker-list licensing is the catch**:
  - **DuckDuckGo Tracker Radar** is **CC BY-NC-SA 4.0 — non-commercial**. Its README/LICENSE states verbatim: "The Tracker Radar data is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. If you'd like to license the list for commercial use, please reach out." A paid Pro feature is commercial use — **do not ship it in a paid feature without a commercial license from DuckDuckGo.**
  - **EasyPrivacy/EasyList** are GPLv3 / CC BY-SA 3.0 dual-licensed — usable but copyleft-flavored, designed for URL-blocking syntax rather than domain metadata, and the share-alike terms need legal care.
  - **Safest**: ship scoring based on **cookie attributes only** (no third-party list), which needs no external data and no license.
- **Verdict**: attribute-based scoring is cheap and license-clean, but "is this a known tracker?" — the feature users actually want — is legally encumbered. This is a strong reason to make **profiles/sets the first Pro feature.**

### 3.5 Which Pro feature ships first
**Named cookie profiles/sets, stored locally, is the cheapest to ship** (no backend, no license, no crypto-critical path) and is already your committed Pro anchor. Ship it first. Add **cloud sync** second (an additive backend with clear per-user cost and E2E crypto). Treat **compliance scoring** as a v3 feature pending a Tracker Radar commercial license, optionally launching license-free attribute scoring in the interim.

## 4. Chrome Web Store compliance and review

### 4.1 Review requirements (2025–2026)
- **Single purpose**: state it narrowly — e.g., "View, edit, add, delete, import, and export browser cookies." Vague descriptions ("developer tool") fail.
- **Remote code prohibition**: MV3 forbids loading/executing remotely hosted code (no `eval`, no fetched `<script>`). **Fetching JSON config/data is allowed** — it's data, not code — provided you don't execute it and you disclose external server communication. Declare "No, I am not using remote code." ExtPay's library is bundled, not remotely loaded — compliant.
- **Data-use disclosures**: a cookie manager touches the **"Authentication information"** and **"Website content"** categories. Answer truthfully: you *access* cookies locally to provide the feature and (with no sync) **do not collect or transmit** them. Certify Limited Use and "does not sell/transfer data." If sync ships, you disclose that cookie data is transmitted (encrypted) for the sync feature the user explicitly enabled, and add a **prominent in-UI disclosure + affirmative consent** before first sync (a CWS requirement for sensitive data — must live in the product UI, not just the listing or privacy policy).
- **Permission justifications** (per-permission field): `cookies` → "core: read/write cookies the user manages"; `storage` → "save profiles and settings locally"; `sidePanel` → "primary UI surface"; host permission → "read/write cookies for sites the user inspects."
- **Privacy policy**: required for any data handling. Host a real URL; include a Limited Use statement; avoid generic SaaS boilerplate (it omits extension-specific disclosures and flags during review).
- **New-developer review**: most reviews complete within ~3 days, but expect longer with the 2026 submissions surge and any sensitive permissions. **One-appeal** model via the dashboard Appeal button.
- **Trader verification (EU DSA)**: as a paid extension you're a **"trader"** — you must verify and **publicly display** legal name, address, an SMS-verifiable phone number, and DUNS if a company. Required for new traders now. Budget time: phone/SMS verification is mandatory (Google Voice/VOIP works); a DUNS number can take ~30 days if you incorporate.

### 4.2 Listing optimization
- **No keyword stuffing** in title/description (Google's 2024+ crackdown; repetitive/duplicate content is rejected). Title = brand + short descriptor.
- Assets: 128×128 icon; screenshots **1280×800** or 640×400; optional promo tiles (small 440×280, marquee 1400×560).

## 5. Build, test, release pipeline

### 5.1 Framework choice — WXT (validated for 2026)
- **WXT** is the recommended default: Vite-based (fast HMR, small bundles — one benchmark put WXT ~400 KB vs Plasmo ~800 KB), file-based entrypoints, **first-class cross-browser builds** (Chrome/Edge/Firefox/Safari, MV2/MV3 handled), framework-agnostic (React/Vue/Svelte/Solid), and **actively developed**.
- **Plasmo**: React-first with the largest tutorial base, but **Parcel-based and development has slowed** — widespread community reports of stalled maintenance, with teams migrating to WXT reporting faster builds. Avoid for a multi-year project.
- **CRXJS**: a Vite *plugin*, not a framework; recently revived after its main branch sat obsolete for years; realistically Chromium-only. Good for expert control, not for a solo dev wanting batteries + Firefox.
- **Vanilla Vite**: viable but you hand-roll manifest generation, cross-browser output, and reload — WXT gives this for free.
- **Decision: WXT.** It directly serves the "cross-publish to Edge day one, Firefox later" requirement from one codebase.

### 5.2 Repo structure (monorepo, shared with the JSON viewer)
```
/ (pnpm workspace)
  packages/
    ui-kit/          # shared React components, dark mode, JSON tree, virtualization
    pay/             # shared ExtPay wrapper + entitlement/grace/gating logic
    tsconfig/        # shared TS config
  apps/
    cookie-manager/  # WXT project
    json-viewer/     # WXT project (second listing)
```

### 5.3 Types
- Use **`chrome-types`** (official, auto-generated daily from Chromium source, MV3+) for the most current API surface — the Chrome team explicitly points MV3 projects to `chrome-types`. (`@types/chrome`, currently ~v0.2.x on DefinitelyTyped, is popular and fine; `chrome-types` tracks HEAD.) With WXT you also get the unified `browser` namespace typed.

### 5.4 Testing
- **Unit**: Vitest + **`@webext-core/fake-browser`** (or WXT's built-in `fakeBrowser`) to mock `chrome.*` and test SW logic (entitlement, `onChanged` double-fire handling, prefix validation).
- **E2E**: **Playwright** with `chromium.launchPersistentContext(userDataDir, { channel: 'chromium', args: ['--disable-extensions-except=DIST','--load-extension=DIST'] })`. A persistent context is mandatory (extensions load only against a real profile); MV2 is no longer loadable in Playwright (2026) — MV3 only. Grab the extension ID from the service-worker URL via `context.serviceWorkers()` / `waitForEvent('serviceworker')`. Test popup/side-panel pages at `chrome-extension://ID/...`. Run headed under **xvfb** in CI.
- Test the SW lifecycle explicitly: force-stop via `chrome://serviceworker-internals/`, then trigger an event and assert state rehydrates from storage.

### 5.5 CI/CD
- **GitHub Actions**: build all apps, run Vitest + Playwright (xvfb), then upload.
- **Automated store upload**: `chrome-webstore-upload-cli` (Chrome), the **Edge Add-ons API** (Partner Center), and `web-ext sign` (AMO/Firefox). Chrome Web Store **API v2** (Oct 2025) adds service accounts, `STAGED_PUBLISH`, and `setPublishedDeployPercentage` (change rollout % without re-review).
- **Staged rollout**: percentage rollout is **only available for new versions of an already-published item with over 10,000 seven-day active users** (Chrome docs). A brand-new extension **cannot** stage — you publish to 100%. Plan for 100% launches initially; adopt percentage rollout after crossing 10k. **Version Rollback** (no re-review) is your launch-phase safety net; note a rollback discards any in-progress partial rollout and pending submissions.

### 5.6 Privacy-respecting error telemetry
- Sentry is usable in extensions but **must never capture cookie names/values, URLs containing tokens, or storage contents.** Strip PII in `beforeSend`; disable session replay; capture only stack traces + extension version. Consider self-hosted GlitchTip for full control. Default to **minimal or no telemetry** and market it as a trust feature — this aligns with your CWS data-use answers.

## 6. Edge / Firefox portability

- **Edge Add-ons**: same MV3 code; submit via **Partner Center**. Microsoft announced faster reviews in Feb 2025. Reuse the Chrome zip — day-one cross-publish is realistic with WXT's Chrome build.
- **Firefox** (later): WXT emits a Firefox build. Key differences relevant here:
  - **Side panel**: Firefox uses the `sidebar_action` manifest key + `sidebarAction` API, **not** `chrome.sidePanel`. WXT maps much of this, but the open/behavior logic differs — expect to fork the panel-open code. Note `sidebar_action` is a manifest key, **not** a permission.
  - **cookies API**: strong parity via `browser.cookies`; Firefox adds `firstPartyDomain`; natively Promise-based.
  - **MV3 on Firefox**: supported, but background uses **event pages**, not service workers; Firefox's MV2 deprecation date remains TBD as of 2025.
  - **`storage.session`**: supported in modern Firefox.
  - **`webextension-polyfill`**: use it if you write to the `browser` namespace for Chrome compatibility, but it has historically been MV3-awkward — WXT's unified `browser` wrapper is generally preferable to hand-adding the polyfill.

## 7. Implementation plan (6-week MVP, 10–20 hrs/week)

**Riskiest integrations front-loaded: the runtime permissions flow, cookies-API edge cases (HttpOnly, CHIPS, prefixes), and ExtPay.**

- **Week 1 — Scaffold + risk spikes.** WXT + React + TS monorepo; `chrome-types`; manifest with minimal perms + `optional_host_permissions`. Spike: `permissions.request('<all_urls>')` behind a gesture; read/write a cookie including HttpOnly; confirm `onChanged` double-fire handling. **DoD**: list and edit a real cookie from the side panel on a live site.
- **Week 2 — Core cookie CRUD + search.** Full view/edit/add/delete; prefix validation (`__Host-`/`__Secure-`); SameSite/secure/expiry controls; search/filter; virtualized list. **DoD**: full free CRUD works; malicious values render safely (XSS test passes).
- **Week 3 — Import/export + dark mode + CHIPS.** JSON import/export via Blob+anchor (no `downloads` perm); optional Netscape format; dark mode via `ui-kit`; CHIPS partition-key browsing. **DoD**: round-trip export→import verified; partitioned cookies visible.
- **Week 4 — Pro scaffolding + local profiles.** ExtPay integration; entitlement cache + offline grace + alarm re-check; feature-gate via dynamic import; named profiles/sets saved to `storage.local`/IndexedDB; save/apply/delete profile. **DoD**: paywall works with a real test payment; the free build loads no Pro code.
- **Week 5 — Hardening + tests.** Vitest units (entitlement, prefix rules, `onChanged`); Playwright E2E (persistent context) for CRUD + paywall; SW-termination test; redaction audit (no values in logs/telemetry). **DoD**: green CI including xvfb E2E; threat-model doc written.
- **Week 6 — Store prep + launch.** Privacy policy + Limited Use statement; data-use form; per-permission justifications; screenshots (1280×800); trader verification started early (SMS + optional DUNS); publish to CWS (100% — no staged rollout available yet) + Edge Partner Center. **DoD**: submitted to both stores; public source repo live.

**Deferred to post-launch**: cloud sync + Cloudflare backend + E2E crypto; compliance/tracker scoring (pending a Tracker Radar commercial license, or license-free attribute scoring); Firefox port (`sidebar_action` fork); lifetime-license polish; percentage staged rollout (after 10k users).

## 8. Shared architecture with the JSON viewer

- **Shared `ui-kit`**: dark mode, virtualization wrapper, form controls, and a **JSON tree component**. The JSON viewer *is* a tree renderer; the cookie manager reuses it for cookie-value JSON and import previews.
- **Shared `pay` package**: one ExtPay wrapper + entitlement/grace/gating logic across both listings; each extension registers its own ExtPay app ID.
- **Shared build pipeline**: one pnpm workspace, one GitHub Actions matrix building both apps and uploading to Chrome + Edge; shared tsconfig and lint.
- **Sequencing tip**: the JSON viewer is even lower-permission (likely just `storage` + `activeTab`, no host permissions), making it the ideal **first CWS submission** to warm up trader verification and build review reputation before the higher-scrutiny cookie manager.

## Caveats
- The **~180 cookies/domain** cap is empirically measured by community tools, not an official Google constant — treat as observed behavior. The 4096-byte name+value / 1024-byte-per-attribute limits are from RFC 6265bis and Chromium's cookie-size intent.
- **RFC 6265bis is still an Internet-Draft** (not a finalized RFC), though it is what browsers implement.
- Google **never officially stated why** the original EditThisCookie was delisted; MV2/MV3 incompatibility is the strongly-implied but journalist-inferred cause. The malicious "EditThisCookie®" analysis is credited to **Eric Parker (YouTube)**, not Wladimir Palant; Parker found info-stealing/phishing code but did **not** confirm active cookie exfiltration in the version tested.
- **ExtPay's 5% fee** (on top of Stripe's ~2.9% + $0.30) and reliability posture are as documented by ExtPay and third-party reviews; validate the live payment flow before launch.
- **Cloudflare cost estimates** are order-of-magnitude for typical sync loads; model against real KV/D1 operation counts once the sync design is fixed.
- **Chrome storage quotas** verified against current Chrome docs (local 10 MB post-114, sync 102,400 bytes / 8 KB item / 512 items, session ~10 MB post-112). There is a lingering doc discrepancy where older/third-party pages cite 5 MB for `storage.local`; the current official figure is 10 MB.
- **Privacy Sandbox**: the April 22, 2025 reversal (Chavez) and October 17, 2025 API retirements (Chavez, listing 10 retired APIs; CHIPS/FedCM/Private State Tokens retained) are from official Privacy Sandbox posts.