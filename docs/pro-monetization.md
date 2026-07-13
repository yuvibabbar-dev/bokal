# Wafer Pro — activating ExtPay (currently mock mode)

Pro entitlement runs through the `Billing` interface (`lib/pay/billing.ts`). Today `getBilling()`
returns `MockBilling` (entitlement via the `wafer:mockPaid` local flag; `openUpgrade()` sets it).
This makes the whole Pro flow testable without an account.

To go live:
1. Register the extension at https://extensionpay.com and get the app id; set `EXTPAY_APP_ID` in `lib/pay/config.ts`.
2. `pnpm --filter @wafer/cookie-manager add extpay`.
3. Add an `ExtPayBilling implements Billing` in `billing.ts`:
   - construct `const extpay = ExtPay(EXTPAY_APP_ID)`;
   - `getEntitlement()` → `const u = await extpay.getUser(); return { paid: u.paid };`
   - `openUpgrade()` → `extpay.openPaymentPage();`
   - defensively catch network errors in `getEntitlement` (return last-known) and handle popup-blockers on `openUpgrade`.
4. Call `extpay.startBackground()` at the top of `background.ts`.
5. Set `USE_MOCK_BILLING=false` and switch `getBilling()` to return `ExtPayBilling` when not mocking.
6. Verify a real test purchase end-to-end (ExtPay dev mode) before publishing.
