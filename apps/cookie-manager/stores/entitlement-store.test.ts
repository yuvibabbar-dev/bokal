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
  return { map, openUpgrade: vi.fn(), openRestore: vi.fn(), getEntitlement: vi.fn() };
});

vi.mock('../lib/pay/billing', () => ({
  getBilling: () => ({
    getEntitlement: h.getEntitlement,
    openUpgrade: h.openUpgrade,
    openRestore: h.openRestore,
  }),
}));

import { entitlementStore } from './entitlement-store';
import { hasEngagedPro } from '../lib/pay/engagement';

beforeEach(() => {
  h.map.clear();
  h.openUpgrade.mockReset();
  h.openRestore.mockReset();
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

// Without this, a lifetime buyer who reinstalls, switches machines, or clears storage loses Pro
// permanently — ExtPay identifies a payer only by an API key held in browser storage.
describe('entitlement-store restore', () => {
  it('opens the billing account page so an existing customer can recover their licence', async () => {
    h.openRestore.mockResolvedValue(undefined);
    entitlementStore.setState({ entitled: true }); // poll exits immediately
    await entitlementStore.getState().restore();
    expect(h.openRestore).toHaveBeenCalledOnce();
  });

  it('records Pro engagement, so the entitlement re-check is allowed to contact billing', async () => {
    h.openRestore.mockResolvedValue(undefined);
    entitlementStore.setState({ entitled: true });
    expect(await hasEngagedPro()).toBe(false);
    await entitlementStore.getState().restore();
    expect(await hasEngagedPro()).toBe(true);
  });

  it('surfaces an error instead of failing silently when the account page will not open', async () => {
    h.openRestore.mockRejectedValue(new Error('offline'));
    await entitlementStore.getState().restore();
    expect(entitlementStore.getState().upgradeError).toMatch(/couldn.t open/i);
  });
});
