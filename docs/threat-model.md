# Bokal — Threat Model

Bokal is a Chrome (MV3) cookie manager. Its whole pitch is trust: it does the same job as
copycat extensions (some of which have shipped malicious updates that exfiltrate cookies) while
being minimal-permission, auditable, and honest about what it does and doesn't protect. This
document describes what Bokal protects, how, and — just as importantly — what it doesn't.

Every control below is cited by file path. If a claim here isn't backed by code and a test, it
doesn't belong in this document.

## 1. Assets

What an attacker (or a curious user) would want out of Bokal, roughly in order of sensitivity:

1. **Cookie values in transit through the UI.** A cookie value can be a session token, an auth
   bearer, or other secret material for whatever site set it. Bokal displays and edits these
   values, so the UI is a place where that material passes through untrusted-input handling.
2. **Saved Pro profiles.** A profile is a named, persisted snapshot of a cookie set
   (`apps/cookie-manager/lib/profiles/types.ts`) — effectively a bundle of credential material at
   rest, stored in IndexedDB (`apps/cookie-manager/lib/profiles/db.ts`).
3. **The user's encryption passphrase**, when they opt to encrypt a profile
   (`apps/cookie-manager/lib/profiles/crypto.ts`). Bokal never stores it — only key material
   derived from it, for the duration of a single encrypt/decrypt call.
4. **Entitlement state** (`bokal:mockPaid` / future ExtPay user record) — low sensitivity to the
   user, but relevant to Bokal's business model integrity.
5. **The extension package itself** — its manifest, its dependency tree, and the update channel
   Chrome Web Store uses to push new code to every installed user.

## 2. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│  Web page (any origin)                                               │
│  — no content script, no DOM access, no message channel from Bokal   │
└─────────────────────────────────────────────────────────────────────┘
                 │  (no boundary crossing at all — see 2.1)
┌─────────────────────────────────────────────────────────────────────┐
│  Extension privileged contexts (service worker, side panel)          │
│  — talks to the browser via chrome.cookies / chrome.storage /        │
│    chrome.permissions / indexedDB only                               │
└─────────────────────────────────────────────────────────────────────┘
                 │                              │
        chrome.cookies API              chrome.storage.local / IndexedDB
     (gated by optional host perm)         (extension-origin storage)
                 │                              │
     ┌───────────▼───────────┐      ┌───────────▼────────────┐
     │ Browser cookie jar     │      │ Local disk (profile dir)│
     │ (per-site, per-user)   │      │ — OS-level access only  │
     └────────────────────────┘      └──────────────────────────┘

                 (future, not wired — see 4.5 / 5.1)
┌─────────────────────────────────────────────────────────────────────┐
│  extensionpay.com (third-party billing) — NOT contacted today         │
└─────────────────────────────────────────────────────────────────────┘
```

**2.1 Extension vs. page.** Bokal has no `content_scripts` entry and no `tabs` permission
(`apps/cookie-manager/wxt.config.ts`). It never runs code in, or reads the DOM/JS globals of, any
web page. All cookie access goes through the `chrome.cookies` API from the service worker / side
panel, not through page injection. This removes an entire class of "malicious page attacks the
extension" or "extension attacks the page" boundary crossings by construction — there is no
channel between the two, so this boundary needs no separate control, it needs no code path to
exist at all, and the manifest is the enforcement (there is nothing to add that would create one
by accident, since WXT wires content scripts explicitly per entry point and none exists here).

**2.2 Extension vs. the browser's cookie jar.** `cookies` is an install-time permission, but
reading/writing cookies for a specific site additionally requires host permission for that site.
Bokal ships `optional_host_permissions: ['<all_urls>']` (not `host_permissions`), so the published
build installs with **zero** host access. Host access is granted at runtime via
`chrome.permissions.request` (`apps/cookie-manager/lib/permissions.ts`), which Chrome requires to
be called synchronously inside a user gesture — Bokal can't silently self-grant this. This is the
primary consent boundary in the product.

**Per-site by default (M11).** For the normal single-site view, Bokal requests host access **only
for the active origin's registrable domain** (`requestSiteAccess` → `chrome.permissions.request`
with per-site match patterns), not `<all_urls>`. It reads the active tab's URL via the `activeTab`
permission (granted when the panel is opened from the toolbar) to know which origin to request —
`activeTab` shows no install warning, is not the `tabs` permission, and does not itself grant
cookie access. A broad `<all_urls>` grant is requested **only** as an explicit opt-in for the
features that inherently span every site: the all-cookies view, all-sites export/import, and the
cleanup sweep. `<all_urls>` is declared *optional* solely because Chrome requires a declared
pattern before an extension can request any subset of it.

The per-site request (`siteOriginPatterns`) uses **exact** host patterns for the active host and
each parent domain (`scheme://domain/*`), never a `scheme://*.domain/*` wildcard. This is a
deliberate safety choice: without a Public Suffix List, a `*.` wildcard on a guessed registrable
domain could over-grant to an entire public suffix (e.g. `*.co.il` = every .co.il site). Exact
patterns cannot do that — overshooting into a public-suffix level (e.g. `co.il/*`) grants access
only to the non-registrable, non-navigable host `co.il`, i.e. nothing real — while still covering
the current URL's cookies (which live on the host or a parent domain). Nothing is transmitted off
the device regardless of scope.

**Residual (needs real-browser QA before ship):** the per-site grant surfaces the active site's
URL via `activeTab`, which Chrome grants for the tab Bokal is invoked on (opening the panel from
the toolbar). On tab-switch to a not-yet-granted site, `activeTab` is not re-granted, so the panel
falls back to the "allow all sites" path until the user re-invokes Bokal on that tab. This flow is
covered by unit tests for the permission logic but the actual permission prompt / activeTab timing
is not exercised by the standalone-panel E2E harness.

**2.2b Automatic cleanup + block rules.** Block rules (reactive, in the service worker) and the
optional daily cleanup sweep (`bokal:cleanup` alarm) both *delete* cookies; they never transmit
anything. Both honor the protect list (a protected cookie is never removed, even by a sweep or a
block match — enforced at the data layer, not the UI). Cleanup is on-demand or once-daily while the
browser runs; Bokal has no `tabs` permission, so it cannot act on tab close. Rules live in
`chrome.storage.local`.

**2.3 Extension vs. local storage.** `chrome.storage.local` (small state — the mock entitlement
flag) and IndexedDB (`lib/profiles/db.ts`, database `bokal`, object store `profiles`) are both
extension-origin storage: isolated from web pages and other extensions by the browser, but not
encrypted by the browser itself. Anything Bokal writes there is as protected as the OS user
account and disk — no more, no less — unless Bokal adds its own encryption layer (§4.3).

**2.3b Billing network path (ExtPay, M12).** Pro entitlement is checked via ExtPay
(`extensionpay.com`), the one network path in the product. It is **Pro-gated**: `getUser()` fires
only after the user opens the upgrade page or holds a paid cache (`shouldContactBilling`), and
`startBackground()` only registers a listener (no fetch on init) — so free users make zero network
calls. Only license status is exchanged; no cookie or browsing data is sent. ExtPay's library is
**bundled** (no remote code), and it needs only the `storage` permission — Bokal adds no
`host_permissions` and no content script (the `onPaid` content-script path is deliberately not
used; entitlement is re-checked on panel `visibilitychange` instead). The privacy policy carves
this out explicitly.

**2.4 Extension vs. network / remote code.** `content_security_policy.extension_pages` is
`script-src 'self'; object-src 'self'` (`apps/cookie-manager/wxt.config.ts`), and there is no
`host_permissions` in the published manifest and no code that fetches or `eval`s remote script (the
ExtPay library is bundled; its entitlement fetch to extensionpay.com is data, not remote code —
see §2.3b).
Bokal cannot load remotely-hosted JS even if it wanted to.

**2.5 Extension vs. future ExtPay.** Billing is currently mock-only
(`apps/cookie-manager/lib/pay/billing.ts`) — no network call to `extensionpay.com` happens in this
build. When ExtPay is wired (`docs/pro-monetization.md`), that becomes a real trust boundary: the
extension will trust a third-party service's response for entitlement state. Cookie values and
passphrases must never be sent across that boundary; nothing in the current `Billing` interface
carries them, and that interface shape (`{ paid: boolean }` in, nothing but a payment-page open
out) is the constraint any future `ExtPayBilling` implementation has to preserve.

## 3. Threats and Mitigations

### 3.1 XSS via a malicious cookie value

**Threat:** a site sets a cookie whose name/value contains HTML or a script payload
(`<img src=x onerror=...>`), hoping Bokal's UI will render it as markup and execute attacker
script inside the extension's privileged page context.

**Mitigation:** `apps/cookie-manager/components/CookieRow.tsx` renders `cookie.value` as a plain
JSX expression child of a `<div>` — React always renders expression children as an escaped DOM
text node, never as `innerHTML`. There is no `dangerouslySetInnerHTML` anywhere the value flows.
The source even carries the invariant as a comment: *"value is attacker-controlled → text node
only, never HTML"*.

**Enforced by:** `apps/cookie-manager/components/CookieRow.test.tsx` renders a cookie with
`value: '<img src=x onerror="window.__pwned=1">'` and asserts (a) no `<img>` element is created,
(b) the literal string appears as text content, (c) `window.__pwned` is never set. This runs in
CI (`pnpm -r test`, `.github/workflows/ci.yml`) on every push and PR.

This same control covers imported cookies: `apps/cookie-manager/lib/io/import.ts` parses JSON
defensively (type-checks every field, coerces unknowns to safe defaults, never `eval`s) and
produces plain string values — a malicious import file can only inject a string, which then goes
through the identical text-node rendering path.

### 3.2 Sensitive data leaking through logs

**Threat:** a `console.log`/`console.error` statement (added during debugging and forgotten)
prints a cookie value or a user's passphrase, which then ends up in `chrome://extensions` service
worker logs, crash reports, or a screenshot the user shares for support.

**Mitigation / enforced by:** `apps/cookie-manager/lib/security/redaction.test.ts` is a static
audit, not a manual review: it walks every shipped `.ts`/`.tsx` file across the app **and the
`@bokal/ui-kit` package** (excluding tests, `.output`, `node_modules`, `.wxt`, `e2e`, `dist`) and,
after stripping string-literal contents (so a word inside a log *message* doesn't trip it), fails
if any `console.log/error/warn/info/debug/dir/table/trace(...)` call on a line references an
identifier named `value(s)`, `passphrase`, `pass`, `plaintext`, `blob`, `cookie(s)`, `draft`,
`profile`, or `secret` — catching whole-object logging (`console.log(cookie)`), not just `.value`
access. This runs in CI on every push/PR. **Known blind spot** (stated honestly, since this is a
tripwire not a proof): the scan is line-by-line, so a `console` call split across multiple lines,
or a value aliased into an unrelated variable name, can evade it — code review remains the backstop.

### 3.3 Malicious update / supply-chain compromise exfiltrating cookies

**Threat:** this is the actual attack the EditThisCookie copycat is understood to have used — a
widely-installed extension ships an update (or a compromised transitive dependency) that quietly
sends cookies to a remote server. Bokal's whole trust pitch is that this class of attack is
structurally harder here.

**Mitigations:**
- **Minimal, auditable permission surface.** Install-time permissions are `cookies`, `storage`,
  `sidePanel`, `unlimitedStorage`, `alarms` — no `tabs`, no broad host access at install
  (`apps/cookie-manager/wxt.config.ts`). Host access (`<all_urls>`) is `optional` and gated behind
  an explicit runtime user gesture (§2.2), so it can't be silently exercised by a compromised
  update the moment it lands — the update would still need the user to hit "grant" again if
  permissions changed, and Chrome re-prompts on any permission increase.
- **No remote code.** CSP `script-src 'self'; object-src 'self'` and no `host_permissions` for
  fetching remote script (§2.4) — a malicious update has to ship its payload *in* the reviewable
  package, not fetch it later.
- **Public source.** The source is publishable/auditable rather than obfuscated, so the actual
  behavior of any release can be diffed against what shipped before.
- **Chrome Web Store review** on every published update is an external gate this document doesn't
  control but that the minimal-permission manifest makes more effective (less surface to hide
  something in).
- **Pinned/locked dependencies.** `zustand` (`5.0.14`), `@tanstack/react-virtual` (`3.14.6`), and
  `@wxt-dev/module-react` (`1.1.3`) are exact-pinned (no `^`) in
  `apps/cookie-manager/package.json`; the full resolved tree (including transitive deps and the
  remaining caret-ranged deps like `react`, `typescript`, `vitest`) is locked via the committed
  root `pnpm-lock.yaml`. CI installs with `pnpm install --frozen-lockfile`
  (`.github/workflows/ci.yml`), so an unreviewed lockfile drift fails the build instead of silently
  pulling a new transitive version.
- **CI as a gate, not a suggestion.** Every push/PR runs `tsc --noEmit`, the full `vitest` suite
  (including the redaction audit and the crypto/round-trip tests below), a production `build`, and
  a Playwright E2E job against both build variants under `xvfb` (`.github/workflows/ci.yml`).

**Non-mitigation, stated plainly:** none of the above stops a determined, well-resourced attacker
who compromises the developer's npm/CWS publishing credentials directly — that's an operational
key-management concern outside this document's scope (see §5, non-goals).

### 3.4 Profile theft at rest (disk access, stolen device, malware reading the browser profile dir)

**Threat:** someone with local disk access (malware, a stolen/unlocked laptop, a forensic tool)
reads the extension's IndexedDB files directly, bypassing the browser UI entirely, and recovers
saved cookie profiles.

**Mitigation:** profiles are optionally encrypted. `apps/cookie-manager/lib/profiles/crypto.ts`
derives an AES-GCM-256 key from the user's passphrase via PBKDF2-SHA256 with **600,000
iterations** and a random 16-byte salt, then encrypts the profile JSON with a random 12-byte IV.
The output is a versioned blob (`{ v: 1, iter, salt, iv, ct }`), so a future KDF/iteration bump
doesn't break old profiles. When `Profile.encrypted === true`
(`apps/cookie-manager/lib/profiles/types.ts`), only the encrypted `blob` field is populated; the
plaintext `cookies` field is absent.

**This is opt-in, not default** — see residual risk §5.2.

### 3.5 Passphrase loss

**Threat:** the user forgets their profile passphrase and expects Bokal (or its developer) to
recover it.

**Mitigation:** documented zero-knowledge design — Bokal never stores the passphrase or a
recoverable derivative of it anywhere (not in `chrome.storage`, not in IndexedDB, not sent
anywhere). `deriveKey()` in `crypto.ts` only ever holds the passphrase in memory for the duration
of a single `encryptJson`/`decryptJson` call. This is the correct trade-off for a local secrets
tool, but it means passphrase loss is unrecoverable by design — stated here so it's an informed
user choice, not a support surprise.

## 4. Non-Goals

Stating these explicitly so the trust claim above isn't overstated:

- **Bokal is not a malware/phishing scanner.** It does not analyze the sites whose cookies it
  shows, does not warn about known-malicious domains, and does not validate cookie *content* for
  anything beyond the schema coercion in `lib/io/import.ts`. A cookie value being rendered safely
  (§3.1) is not the same as Bokal vouching for the site that set it.
- **No cloud sync in the MVP.** Profiles live only in local IndexedDB
  (`apps/cookie-manager/lib/profiles/db.ts`). There is no cross-device sync, no backend, and
  therefore no server-side breach surface for profile data — but also no cross-device recovery if
  local storage is lost.
- **Not a defense against a compromised OS or browser.** If the user's machine already has
  arbitrary code execution (keylogger, root-level malware), no browser-extension-level control
  here — encryption included — is a meaningful boundary. §3.4's encryption defends against *disk
  access without code execution* (stolen drive, casual snooping), not an active compromise.
- **Not hardened against a compromised extension-developer account.** Supply-chain controls in
  §3.3 reduce the blast radius and improve auditability of a bad release; they don't prevent one if
  the publishing credentials themselves are compromised. That's operational security, out of scope
  for a client-side threat model.

## 5. Residual Risks

Honest, current gaps — not hidden in the mitigations above:

**5.1 Mock billing lets anyone unlock Pro for free.** `MockBilling.openUpgrade()`
(`apps/cookie-manager/lib/pay/billing.ts`) sets a local `chrome.storage.local` flag
(`bokal:mockPaid`) with no payment or server-side check. Until real ExtPay billing is wired
(tracked in `docs/pro-monetization.md`), any user (or anyone who reads the source, which is most
of them) can grant themselves Pro entitlement locally at zero cost. This is a **business-model
risk, not a data-security risk** — it doesn't expose any other user's data or weaken §3's
controls. `USE_MOCK_BILLING` (`lib/pay/config.ts`) is a loud guard: flipping it to `false` without
implementing `ExtPayBilling` throws at `getBilling()` call time rather than silently shipping an
unenforced gate, so this can't ship to production by accident — but it is live today, on this
branch, and must be closed before Pro is sold for real.

**5.2 Unencrypted profiles store cookie values in plaintext at rest, by user choice.** Encryption
(§3.4) is opt-in. A user who saves a profile without a passphrase gets a `Profile` with
`encrypted: false` and a populated `cookies: CookieAttrs[]` array — full plaintext values sitting
in IndexedDB, protected only by OS/browser-profile isolation, not by Bokal. This is a deliberate
UX trade-off (not every saved profile is sensitive enough to warrant a passphrase prompt every
time), but it means the default path for a rushed user is plaintext-at-rest, and that should be
stated rather than implied away by the existence of the encryption feature.

**5.3 CHIPS partition matching is best-effort, not exact.** `apps/cookie-manager/lib/site.ts`
derives a "site" as `scheme://hostname` to compare against a CHIPS partition's `topLevelSite` for
the inspector UI. This is an approximation: it drops the port (closer to the real registrable-site
concept than raw origin) but does **not** reduce a subdomain like `www.example.com` to its apex
(`example.com`), so the CHIPS inspector may under-match on subdomains. Exact eTLD+1 derivation
needs the Public Suffix List, or `chrome.cookies.getPartitionKey()` (Chrome 130+), and either
requires a real browser to validate against actual partition behavior — deferred to the M5
Playwright E2E suite (`apps/cookie-manager/e2e/`) rather than solved with more string-matching
logic that could itself be a false source of confidence. This is a correctness/UX gap in the CHIPS
badge, not a data-exposure risk: it can only cause Bokal to *fail to label* a partitioned cookie
as such, not to leak or misattribute cookie values.

## 6. Verification

Every control cited above is enforced by an automated check that runs in CI
(`.github/workflows/ci.yml`) on every push and pull request, not by manual review alone:

| Control | Enforced by |
|---|---|
| Cookie values never render as HTML | `apps/cookie-manager/components/CookieRow.test.tsx` |
| No cookie value / passphrase logging | `apps/cookie-manager/lib/security/redaction.test.ts` |
| Profile encryption round-trips correctly | `apps/cookie-manager/lib/profiles/crypto.test.ts`, `apps/cookie-manager/lib/profiles/roundtrip.test.ts` |
| Import parsing never executes untrusted input | `apps/cookie-manager/lib/io/import.test.ts`, `apps/cookie-manager/lib/io/roundtrip.test.ts` |
| Manifest stays minimal-permission | reviewed at `apps/cookie-manager/wxt.config.ts`; host access via `optional_host_permissions` only |
| Dependency tree matches lockfile | `pnpm install --frozen-lockfile` in CI |
| Type safety | `tsc --noEmit` in CI |
| Real-browser behavior (permission grant, CHIPS, cookie CRUD) | `apps/cookie-manager/e2e/*.spec.ts` (Playwright, both build variants, under `xvfb`) |
