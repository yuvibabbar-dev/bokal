# Bokal Pro — ExtPay billing (LIVE)

Pro entitlement runs through the `Billing` interface (`lib/pay/billing.ts`). It is wired to
**ExtPay** (`extpay@3.1.2`) and live:

- `lib/pay/config.ts`: `EXTPAY_APP_ID = 'bokal-test'` — ⚠ **PERMANENT. This IS the live production
  app id** (registered on extensionpay.com, display name "Bokal", Stripe connected LIVE; the
  `-test` suffix is historical). **Never change it — a new id would orphan every existing
  license.** There is no "swap to a production id" step: ExtPay serves test mode to unpacked
  installs and live mode to store installs on the SAME id. `USE_MOCK_BILLING = false`
  (→ `ExtPayBilling`; flip to `true` for the `MockBilling` local-flag path used in dev/QA/E2E,
  no account needed).
- `ExtPayBilling` (`billing.ts`): `getEntitlement()` → `extpay.getUser().paid`; `openUpgrade()` →
  `extpay.openPaymentPage()` (opens a tab — no popup blocker). Network errors propagate so
  `syncEntitlementCache` falls back to the cached value (14-day offline grace).
- SW (`entrypoints/background.ts`): **deliberately constructs NO ExtPay and does NOT call
  `startBackground()`** — that function is only a relay for an extensionpay.com content script
  Bokal doesn't ship, and merely constructing `ExtPay()` writes an install marker to
  `storage.sync`. The panel constructs the client lazily inside `billing.ts`, gated by engagement
  (see below).

## Privacy-preserving design (deliberate, trust-first)

- **Free users never contact ExtPay.** `syncEntitlementCache` is gated by `shouldContactBilling()`
  (`lib/pay/engagement.ts`): it returns false unless the user has opened the upgrade page
  (`bokal:proEngaged`) or holds a paid cache within grace. The SW never constructs ExtPay at all
  (see above). So a user who never buys/opens Pro makes **zero** network calls to extensionpay.com
  and **zero** off-device writes. This is what keeps the "nothing leaves your device" claim true
  (see `docs/store/privacy-policy.md`).
- **No `onPaid` content script.** Using ExtPay's `onPaid`/`onTrialStarted` would require a
  declarative content script on `https://extensionpay.com/*`. To keep the manifest free of any
  content script (and any new host access), Bokal instead re-checks entitlement on panel
  `visibilitychange` (`App.tsx`) — so a completed purchase is picked up when the user returns from
  the payment tab. Manifest adds **no** permissions, **no** `host_permissions`, **no**
  content scripts (ExtPay needs only `storage`, already present).

## To take a Stripe (test-mode) sandbox purchase end-to-end

1. Register the extension id `bokal-test` on extensionpay.com (or change the id in config to your
   registered one), connect your Stripe account, and create the plans (Monthly $4.99 / Annual
   $19.99 / Lifetime $29.99 launch price, Lifetime default). **DONE for Bokal** — app + Stripe are
   live; this section is kept as the generic runbook.
2. Build + load unpacked (`pnpm --filter @bokal/cookie-manager build`, load `.output/chrome-mv3`).
3. Grant Bokal access to a site, open the panel, click **★ Unlock Pro** → ExtPay page (test mode
   asks for your ExtPay account password) → Stripe test checkout → pay with `4242 4242 4242 4242`
   (any future expiry / CVC). Return to the panel → the profiles panel should unlock.
4. In DevTools, confirm a FREE session (never clicking Unlock Pro) makes no request to
   extensionpay.com.

## Launch state (2026-07-14)

- **DONE — do not repeat:** app id is live and permanent (see top), Stripe is LIVE, plans created
  ($4.99/mo · $19.99/yr · $29.99 lifetime launch price → ~$39 around 2026-09-14),
  `USE_MOCK_BILLING = false`. An earlier revision of this file said to "swap to the production id
  before launch" — that instruction is OBSOLETE and following it now would orphan paid licenses.
- (Post-launch, M13) wire the 7-day reverse trial via `extpay.openTrialPage()` +
  `user.trialStartedAt`, triggered on saving the 2nd profile — deliberately deferred until there is
  traffic to A/B against.
