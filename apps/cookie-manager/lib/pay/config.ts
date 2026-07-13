// PLACEHOLDER extensionpay.com app id — replace with the real one at launch.
export const EXTPAY_APP_ID = 'wafer-cookie-manager';
// Offline grace: honor last-known-paid for 14 days without a successful re-check.
export const GRACE_MS = 14 * 24 * 60 * 60 * 1000;
// When true, Pro entitlement comes from a local mock flag (dev/QA/E2E) instead of ExtPay.
// To go live: install `extpay`, set USE_MOCK_BILLING=false + a real EXTPAY_APP_ID, wire the SW
// (see docs/pro-monetization.md).
export const USE_MOCK_BILLING = true;
