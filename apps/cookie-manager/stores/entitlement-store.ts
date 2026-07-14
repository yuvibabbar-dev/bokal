import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { getBilling } from '../lib/pay/billing';
import { syncEntitlementCache } from '../lib/pay/sync';
import { setEngagedPro } from '../lib/pay/engagement';
import { isEntitled, CACHE_KEY, type EntitlementCache } from '../lib/pay/entitlement';
import { GRACE_MS } from '../lib/pay/config';

interface EntitlementState {
  entitled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  openUpgrade: () => Promise<void>;
}

async function readCache(): Promise<EntitlementCache | null> {
  const r = await chrome.storage.local.get(CACHE_KEY);
  return (r[CACHE_KEY] as EntitlementCache | undefined) ?? null;
}

let entSeq = 0;

export const entitlementStore = createStore<EntitlementState>((set) => ({
  entitled: false,
  loading: false,
  refresh: async () => {
    const seq = ++entSeq;
    if (seq === entSeq) set({ loading: true });
    // Decide from cache first (offline-friendly), then attempt a live re-check.
    const cached = await readCache();
    if (seq === entSeq) set({ entitled: isEntitled(cached, Date.now(), GRACE_MS) });
    const fresh = await syncEntitlementCache();
    if (seq !== entSeq) return;
    if (fresh) set({ entitled: isEntitled(fresh, Date.now(), GRACE_MS) });
    set({ loading: false });
  },
  openUpgrade: async () => {
    // The user is opting into Pro — from now on it's fine to contact the billing server.
    await setEngagedPro();
    await getBilling().openUpgrade();
    await entitlementStore.getState().refresh();
  },
}));

export function useEntitlement<T>(sel: (s: EntitlementState) => T): T {
  return useStore(entitlementStore, sel);
}
