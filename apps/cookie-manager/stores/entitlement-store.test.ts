import { describe, it, expect, vi, beforeEach } from 'vitest';

// The store module registers chrome.storage listeners at import time, so the fake must exist
// before the (hoisted) import executes.
const h = vi.hoisted(() => {
  const map = new Map<string, unknown>();
  const local = {
    get: async (k: string) => (map.has(k) ? { [k]: map.get(k) } : {}),
    set: async (o: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(o)) map.set(k, v);
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local, onChanged: { addListener: () => {} } },
  };
  return { map, openUpgrade: vi.fn(), getEntitlement: vi.fn() };
});

vi.mock('../lib/pay/billing', () => ({
  getBilling: () => ({ getEntitlement: h.getEntitlement, openUpgrade: h.openUpgrade }),
}));

import { entitlementStore } from './entitlement-store';

beforeEach(() => {
  h.map.clear();
  h.openUpgrade.mockReset();
  h.getEntitlement.mockReset();
  h.getEntitlement.mockResolvedValue({ paid: false });
  entitlementStore.setState({ entitled: false, loading: false, upgradeError: null });
});

describe('entitlement-store openUpgrade error surfacing', () => {
  it('sets a user-visible upgradeError when the billing page fails to open', async () => {
    h.openUpgrade.mockRejectedValue(new Error('network down'));
    await entitlementStore.getState().openUpgrade();
    expect(entitlementStore.getState().upgradeError).toMatch(/couldn.t open/i);
  });

  it('leaves upgradeError null when the billing page opens fine', async () => {
    h.openUpgrade.mockResolvedValue(undefined);
    // Pre-entitled so the post-purchase poll exits on its first check (no timers in the test).
    entitlementStore.setState({ entitled: true });
    await entitlementStore.getState().openUpgrade();
    expect(entitlementStore.getState().upgradeError).toBeNull();
  });

  it('clears a stale upgradeError when the user retries and it succeeds', async () => {
    h.openUpgrade.mockRejectedValueOnce(new Error('offline'));
    await entitlementStore.getState().openUpgrade();
    expect(entitlementStore.getState().upgradeError).not.toBeNull();

    h.openUpgrade.mockResolvedValueOnce(undefined);
    entitlementStore.setState({ entitled: true });
    await entitlementStore.getState().openUpgrade();
    expect(entitlementStore.getState().upgradeError).toBeNull();
  });
});
