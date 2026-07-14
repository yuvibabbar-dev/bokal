import { describe, it, expect, beforeEach } from 'vitest';
import { hasEngagedPro, setEngagedPro, shouldContactBilling } from './engagement';
import { CACHE_KEY } from './entitlement';
import { GRACE_MS } from './config';

function fakeLocal() {
  const m = new Map<string, unknown>();
  return {
    get: async (key: string) => (m.has(key) ? { [key]: m.get(key) } : {}),
    set: async (o: Record<string, unknown>) => { for (const [k, v] of Object.entries(o)) m.set(k, v); },
    _map: m,
  };
}

let store: ReturnType<typeof fakeLocal>;
beforeEach(() => {
  store = fakeLocal();
  (globalThis as unknown as { chrome: unknown }).chrome = { storage: { local: store } };
});

describe('pro engagement gate', () => {
  it('a fresh free user has not engaged and must NOT contact billing', async () => {
    expect(await hasEngagedPro()).toBe(false);
    expect(await shouldContactBilling()).toBe(false);
  });

  it('once engaged, contact billing', async () => {
    await setEngagedPro();
    expect(await hasEngagedPro()).toBe(true);
    expect(await shouldContactBilling()).toBe(true);
  });

  it('a recently-paid cache also warrants contacting billing (re-check) even without the flag', async () => {
    store._map.set(CACHE_KEY, { paid: true, checkedAt: Date.now() });
    expect(await hasEngagedPro()).toBe(false);
    expect(await shouldContactBilling()).toBe(true);
  });

  it('an expired paid cache (past grace) does NOT by itself warrant contact', async () => {
    store._map.set(CACHE_KEY, { paid: true, checkedAt: Date.now() - GRACE_MS - 1 });
    expect(await shouldContactBilling()).toBe(false);
  });
});
