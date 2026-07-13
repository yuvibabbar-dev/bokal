export interface EntitlementCache {
  paid: boolean;
  /** epoch ms of the last successful billing check. */
  checkedAt: number;
}

export const CACHE_KEY = 'wafer:entitlement';

// Fail OPEN for paying users within the offline grace window; fail CLOSED for never-paid.
export function isEntitled(cache: EntitlementCache | null, now: number, graceMs: number): boolean {
  if (!cache || !cache.paid) return false;
  return now - cache.checkedAt < graceMs;
}
