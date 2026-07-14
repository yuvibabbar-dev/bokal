import ExtPay from 'extpay';
import { EXTPAY_APP_ID, USE_MOCK_BILLING } from './config';

export interface Billing {
  getEntitlement(): Promise<{ paid: boolean }>;
  openUpgrade(): Promise<void>;
}

const MOCK_KEY = 'bokal:mockPaid';

// Dev/QA/E2E entitlement: a local flag. openUpgrade() simulates a successful purchase so the
// whole Pro flow is exercisable without ExtPay. Selected when USE_MOCK_BILLING is true.
export class MockBilling implements Billing {
  async getEntitlement(): Promise<{ paid: boolean }> {
    const r = await chrome.storage.local.get(MOCK_KEY);
    return { paid: r[MOCK_KEY] === true };
  }
  async openUpgrade(): Promise<void> {
    await chrome.storage.local.set({ [MOCK_KEY]: true });
  }
}

// Live billing via ExtPay (extensionpay.com → your Stripe). getUser()/openPaymentPage() message
// the background, which must call extpay.startBackground(). The ExtPay instance is memoized.
let extpayInstance: ReturnType<typeof ExtPay> | null = null;
function extpay(): ReturnType<typeof ExtPay> {
  if (!extpayInstance) extpayInstance = ExtPay(EXTPAY_APP_ID);
  return extpayInstance;
}

export class ExtPayBilling implements Billing {
  async getEntitlement(): Promise<{ paid: boolean }> {
    // May throw on network failure — callers (syncEntitlementCache) fall back to the cached value
    // so the offline grace window applies.
    const user = await extpay().getUser();
    return { paid: user.paid };
  }
  async openUpgrade(): Promise<void> {
    // Opens the ExtPay payment page in a new tab (no window.open, so popup blockers don't apply).
    await extpay().openPaymentPage();
  }
}

export function getBilling(): Billing {
  return USE_MOCK_BILLING ? new MockBilling() : new ExtPayBilling();
}
