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
  /** User-visible reason the last billing action (upgrade or restore) failed (null = no error). */
  upgradeError: string | null;
  refresh: () => Promise<void>;
  openUpgrade: () => Promise<void>;
  /** Recover or manage an existing licence (new machine, cleared storage, cancel a subscription). */
  restore: () => Promise<void>;
}

async function readCache(): Promise<EntitlementCache | null> {
  const r = await chrome.storage.local.get(CACHE_KEY);
  return (r[CACHE_KEY] as EntitlementCache | undefined) ?? null;
}

// After sending the user to a billing page we get no callback (we deliberately ship no ExtPay
// content script), and the payment tab opens in the same window so the global side panel never
// hides — visibilitychange won't fire either. Polling is the only reliable way to notice. Bounded
// to ~2 minutes, exits as soon as entitlement lands.
let polling = false;
async function pollForEntitlement(): Promise<void> {
  // A second Upgrade/Restore click while a poll is in flight must not stack another 40×3s loop
  // (each cycle does a real billing fetch). One poll already covers both.
  if (polling) return;
  polling = true;
  try {
    for (let i = 0; i < 40; i++) {
      if (entitlementStore.getState().entitled) return;
      await new Promise((r) => setTimeout(r, 3000));
      await entitlementStore.getState().refresh();
    }
  } finally {
    polling = false;
  }
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
      console.error('[bokal] openUpgrade failed', err);
      set({ upgradeError: 'Couldn’t open the upgrade page — check your connection and try again.' });
      return;
    }
    await pollForEntitlement();
  },
  restore: async () => {
    // Same engagement gate as a purchase: the user is asking us to talk to billing on their behalf.
    await setEngagedPro();
    set({ upgradeError: null });
    try {
      await getBilling().openRestore();
    } catch (err) {
      console.error('[bokal] openRestore failed', err);
      set({ upgradeError: 'Couldn’t open your account page — check your connection and try again.' });
      return;
    }
    // Once they re-link the licence on that page, the poll picks it up and Pro unlocks in place.
    await pollForEntitlement();
  },
}));

// Reflect entitlement cache changes from any context (the daily alarm's re-check, another panel)
// into an open panel immediately. Guarded so a minimal test mock without onChanged doesn't throw.
chrome.storage.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes[CACHE_KEY]) {
    const cache = changes[CACHE_KEY].newValue as EntitlementCache | undefined;
    const entitled = isEntitled(cache ?? null, Date.now(), GRACE_MS);
    // Once Pro lands (e.g. the daily alarm or another panel confirms payment), any prior
    // billing-error message is stale — clear it so it can't surface on the now-Pro ManageBilling
    // surface, which shares this upgradeError state.
    entitlementStore.setState(entitled ? { entitled, upgradeError: null } : { entitled });
  }
});

export function useEntitlement<T>(sel: (s: EntitlementState) => T): T {
  return useStore(entitlementStore, sel);
}
