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
  /** User-visible reason the last "Unlock Pro" click failed (null = no error). */
  upgradeError: string | null;
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
  upgradeError: null,
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
    set({ upgradeError: null });
    try {
      await getBilling().openUpgrade();
    } catch (err) {
      // Never fail silently: the click must always produce either the payment tab or a message.
      // No cookie data flows through billing, so logging the error itself is safe.
      console.error('[wafer] openUpgrade failed', err);
      set({ upgradeError: 'Couldn’t open the upgrade page — check your connection and try again.' });
      return;
    }
    // No onPaid content script: poll for the completed purchase. The payment page opens as a tab in
    // the same window, so the (global) side panel never hides and visibilitychange won't fire —
    // polling is the reliable way to unlock without closing/reopening. Bounded (~2 min), stops early.
    for (let i = 0; i < 40; i++) {
      if (entitlementStore.getState().entitled) return;
      await new Promise((r) => setTimeout(r, 3000));
      await entitlementStore.getState().refresh();
    }
  },
}));

// Reflect entitlement cache changes from any context (the daily alarm's re-check, another panel)
// into an open panel immediately. Guarded so a minimal test mock without onChanged doesn't throw.
chrome.storage.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes[CACHE_KEY]) {
    const cache = changes[CACHE_KEY].newValue as EntitlementCache | undefined;
    entitlementStore.setState({ entitled: isEntitled(cache ?? null, Date.now(), GRACE_MS) });
  }
});

export function useEntitlement<T>(sel: (s: EntitlementState) => T): T {
  return useStore(entitlementStore, sel);
}
