import ExtPay from 'extpay';
import { EXTPAY_APP_ID, USE_MOCK_BILLING } from './config';

export interface Billing {
  getEntitlement(): Promise<{ paid: boolean }>;
  openUpgrade(): Promise<void>;
  /**
   * Open the billing account page so an EXISTING customer can recover or manage their licence.
   * ExtPay identifies a payer solely by an API key in browser storage, so without this a lifetime
   * buyer who reinstalls, switches machines, or clears storage would silently lose Pro with no way
   * back — and a subscriber would have no way to cancel.
   */
  openRestore(): Promise<void>;
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
  async openRestore(): Promise<void> {
    // In the mock, "restoring" simply re-grants the local flag.
    await chrome.storage.local.set({ [MOCK_KEY]: true });
  }
}

// Live billing via ExtPay (extensionpay.com → your Stripe). getUser() fetches the license and
// openPaymentPage()/openLoginPage() open a tab — all self-contained, so we deliberately do NOT call
// extpay.startBackground() (that only relays messages from an extensionpay.com content script, which
// Bokal doesn't ship). The ExtPay instance is memoized.
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
  async openRestore(): Promise<void> {
    // ExtPay's account/login page: the customer enters the email they paid with, and ExtPay
    // re-links the licence to this install. It is also where a subscriber cancels.
    await extpay().openLoginPage();
  }
}

export function getBilling(): Billing {
  return USE_MOCK_BILLING ? new MockBilling() : new ExtPayBilling();
}
