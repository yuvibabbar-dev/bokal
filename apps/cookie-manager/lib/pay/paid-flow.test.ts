import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simulate ExtPay's getUser() so the full entitlement pipeline can be exercised without a browser.
const getUser = vi.fn();
vi.mock('extpay', () => ({
  default: () => ({ getUser, openPaymentPage: vi.fn(), startBackground: vi.fn() }),
}));

import { syncEntitlementCache } from './sync';
import { setEngagedPro } from './engagement';
import { isEntitled, CACHE_KEY, type EntitlementCache } from './entitlement';
import { GRACE_MS } from './config';

function fakeLocal() {
  const m = new Map<string, unknown>();
  return {
    get: async (k: string) => (m.has(k) ? { [k]: m.get(k) } : {}),
    set: async (o: Record<string, unknown>) => { for (const [k, v] of Object.entries(o)) m.set(k, v); },
    _map: m,
  };
}
let store: ReturnType<typeof fakeLocal>;
beforeEach(() => {
  store = fakeLocal();
  (globalThis as unknown as { chrome: unknown }).chrome = { storage: { local: store } };
  getUser.mockReset();
});

describe('ExtPay paid flow — full integration (billing → gate → cache → entitlement)', () => {
  it('a PAID ExtPay user, once they engaged Pro, becomes entitled', async () => {
    getUser.mockResolvedValue({ paid: true });
    await setEngagedPro(); // user clicked "Unlock Pro"
    const cache = await syncEntitlementCache();
    expect(cache).toEqual({ paid: true, checkedAt: expect.any(Number) });
    expect(isEntitled(cache, Date.now(), GRACE_MS)).toBe(true);
    expect(getUser).toHaveBeenCalledOnce();
  });

  it('a FREE user who never engaged makes NO ExtPay call and is not entitled', async () => {
    getUser.mockResolvedValue({ paid: true }); // even if ExtPay would say paid...
    const cache = await syncEntitlementCache(); // ...the gate blocks contact
    expect(cache).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
    expect(isEntitled(cache, Date.now(), GRACE_MS)).toBe(false);
  });

  it('an engaged but UNPAID user is not entitled', async () => {
    getUser.mockResolvedValue({ paid: false });
    await setEngagedPro();
    const cache = await syncEntitlementCache();
    expect(cache).toEqual({ paid: false, checkedAt: expect.any(Number) });
    expect(isEntitled(cache, Date.now(), GRACE_MS)).toBe(false);
  });

  it('OFFLINE after a prior paid check keeps Pro via the 14-day grace window', async () => {
    store._map.set(CACHE_KEY, { paid: true, checkedAt: Date.now() }); // last known: paid
    getUser.mockRejectedValue(new Error('offline'));
    const cache = await syncEntitlementCache(); // gated in (paid cache), getUser throws → null
    expect(cache).toBeNull();
    const prior = store._map.get(CACHE_KEY) as EntitlementCache;
    expect(isEntitled(prior, Date.now(), GRACE_MS)).toBe(true); // still entitled during grace
  });
});
