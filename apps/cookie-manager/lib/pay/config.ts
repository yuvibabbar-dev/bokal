// extensionpay.com app id. ONE id serves both dev and production: ExtPay auto-detects test mode
// from installType (unpacked/dev install -> test key; Chrome Web Store install -> live key), so a
// separate "prod app" is NOT needed.
//
// ⚠ THIS ID IS EFFECTIVELY PERMANENT. ExtPay mints per-app API keys, so changing it after the first
// store release orphans every existing customer's license. Decide it before v1.0 ships.
//
// ⚠ 'bokal-test' is a DEV-ERA NAME: ExtPay shows the app's name on the checkout page, so paying
// customers would see "Bokal-Test" while entering card details. Rename the app to "Bokal" in the
// ExtPay dashboard (or register a clean `bokal` app, which is available) BEFORE launch.
export const EXTPAY_APP_ID = 'bokal-test';
// Offline grace: honor last-known-paid for 14 days without a successful re-check.
export const GRACE_MS = 14 * 24 * 60 * 60 * 1000;
// When true, Pro entitlement comes from a local mock flag (dev/QA/E2E) instead of ExtPay.
// false = live ExtPay (ExtPayBilling). Flip to true to run without an ExtPay/Stripe account.
export const USE_MOCK_BILLING = false;
