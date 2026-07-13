import { getBilling } from './billing';
import { CACHE_KEY, type EntitlementCache } from './entitlement';

// Live re-check → write cache. On failure (offline), leave the cache so grace still applies.
export async function syncEntitlementCache(): Promise<EntitlementCache | null> {
  try {
    const { paid } = await getBilling().getEntitlement();
    const cache: EntitlementCache = { paid, checkedAt: Date.now() };
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
    return cache;
  } catch {
    return null;
  }
}
