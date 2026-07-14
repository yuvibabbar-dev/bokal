import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the extpay module so ExtPayBilling can be tested without a browser/network.
const getUser = vi.fn();
const openPaymentPage = vi.fn(async () => {});
vi.mock('extpay', () => ({
  default: () => ({ getUser, openPaymentPage, startBackground: vi.fn() }),
}));

import { ExtPayBilling } from './billing';

beforeEach(() => {
  getUser.mockReset();
  openPaymentPage.mockClear();
});

describe('ExtPayBilling', () => {
  it('maps ExtPay user.paid to the entitlement', async () => {
    getUser.mockResolvedValueOnce({ paid: true });
    expect(await new ExtPayBilling().getEntitlement()).toEqual({ paid: true });
    getUser.mockResolvedValueOnce({ paid: false });
    expect(await new ExtPayBilling().getEntitlement()).toEqual({ paid: false });
  });

  it('openUpgrade opens the ExtPay payment page', async () => {
    await new ExtPayBilling().openUpgrade();
    expect(openPaymentPage).toHaveBeenCalledOnce();
  });

  it('propagates a network error so the caller can fall back to cache', async () => {
    getUser.mockRejectedValueOnce(new Error('offline'));
    await expect(new ExtPayBilling().getEntitlement()).rejects.toThrow('offline');
  });
});
