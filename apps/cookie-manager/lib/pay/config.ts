// extensionpay.com app id for Wafer. 'wafer-test' is the sandbox/test app — swap to the
// production id before the public launch (a one-line change).
export const EXTPAY_APP_ID = 'wafer-test';
// Offline grace: honor last-known-paid for 14 days without a successful re-check.
export const GRACE_MS = 14 * 24 * 60 * 60 * 1000;
// When true, Pro entitlement comes from a local mock flag (dev/QA/E2E) instead of ExtPay.
// false = live ExtPay (ExtPayBilling). Flip to true to run without an ExtPay/Stripe account.
export const USE_MOCK_BILLING = false;
