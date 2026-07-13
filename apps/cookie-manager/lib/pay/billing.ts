export interface Billing {
  getEntitlement(): Promise<{ paid: boolean }>;
  openUpgrade(): Promise<void>;
}

const MOCK_KEY = 'wafer:mockPaid';

// Dev/QA/E2E entitlement: a local flag. openUpgrade() simulates a successful purchase so the
// whole Pro flow is exercisable without ExtPay. Replace with ExtPayBilling at launch.
export class MockBilling implements Billing {
  async getEntitlement(): Promise<{ paid: boolean }> {
    const r = await chrome.storage.local.get(MOCK_KEY);
    return { paid: r[MOCK_KEY] === true };
  }
  async openUpgrade(): Promise<void> {
    await chrome.storage.local.set({ [MOCK_KEY]: true });
  }
}

export function getBilling(): Billing {
  return new MockBilling();
}
