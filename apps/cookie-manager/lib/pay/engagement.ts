import { CACHE_KEY, isEntitled, type EntitlementCache } from './entitlement';
import { GRACE_MS } from './config';

// Whether the user has ever engaged with Pro (opened the upgrade/payment page). Free users who
// never engage should never trigger a network call to the billing server — that's what preserves
// Wafer's "nothing leaves your device" claim for the people who care about it most.
const ENGAGED_KEY = 'wafer:proEngaged';

export async function hasEngagedPro(): Promise<boolean> {
  const r = await chrome.storage.local.get(ENGAGED_KEY);
  return r[ENGAGED_KEY] === true;
}

export async function setEngagedPro(): Promise<void> {
  await chrome.storage.local.set({ [ENGAGED_KEY]: true });
}

/**
 * Contact the billing server ONLY if the user has engaged Pro or is within a paid grace window.
 * A brand-new free user (no engagement, no paid cache) returns false, so Wafer never phones home
 * for them. The daily alarm re-check and the panel refresh both route through here.
 */
export async function shouldContactBilling(): Promise<boolean> {
  if (await hasEngagedPro()) return true;
  const r = await chrome.storage.local.get(CACHE_KEY);
  return isEntitled((r[CACHE_KEY] as EntitlementCache | undefined) ?? null, Date.now(), GRACE_MS);
}
