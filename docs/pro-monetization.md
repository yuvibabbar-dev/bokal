# Bokal Pro — ExtPay billing (WIRED, M12)

Pro entitlement runs through the `Billing` interface (`lib/pay/billing.ts`). As of M12 it is wired
to **ExtPay** (`extpay@3.1.2`) and live by default:

- `lib/pay/config.ts`: `EXTPAY_APP_ID = 'bokal-test'` (the sandbox app — **swap to the production id
  before public launch**), `USE_MOCK_BILLING = false` (→ `ExtPayBilling`; flip to `true` for the
  `MockBilling` local-flag path used in dev/QA/E2E, no account needed).
- `ExtPayBilling` (`billing.ts`): `getEntitlement()` → `extpay.getUser().paid`; `openUpgrade()` →
  `extpay.openPaymentPage()` (opens a tab — no popup blocker). Network errors propagate so
  `syncEntitlementCache` falls back to the cached value (14-day offline grace).
- SW (`entrypoints/background.ts`): `ExtPay(EXTPAY_APP_ID).startBackground()` at the top when not
  mocking — required so `getUser()`/`openPaymentPage()` (called from the panel) work.

## Privacy-preserving design (deliberate, trust-first)

- **Free users never contact ExtPay.** `syncEntitlementCache` is gated by `shouldContactBilling()`
  (`lib/pay/engagement.ts`): it returns false unless the user has opened the upgrade page
  (`bokal:proEngaged`) or holds a paid cache within grace. `startBackground()` only registers a
  message listener — it does NOT fetch on init (verified in the ExtPay source). So a user who never
  buys/opens Pro makes **zero** network calls to extensionpay.com. This is what keeps the
  "nothing leaves your device" claim true (see `docs/store/privacy-policy.md`).
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

## Before public launch

- Swap `EXTPAY_APP_ID` to the production app id; flip Stripe from test to live on the ExtPay
  dashboard; keep `USE_MOCK_BILLING = false`.
- (Optional, decided in the business doc) wire the 7-day reverse trial via `extpay.openTrialPage()`
  + `user.trialStartedAt`, triggered on saving the 2nd profile.
