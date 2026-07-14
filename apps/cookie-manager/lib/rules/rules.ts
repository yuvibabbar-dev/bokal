import type { CookieAttrs } from '../cookie-types';
import { cookieId } from '../cookies/keys';

export interface Rules {
  /** cookieIds protected from deletion. */
  protectedIds: string[];
  /** cookieIds pinned to the top of the list. */
  pinnedIds: string[];
  /** domains whose cookies are auto-removed on set (reactive block). */
  blockedDomains: string[];
  /** domains whose cookies are KEPT during cleanup (allow-list). */
  keepDomains: string[];
  /** run a daily cleanup sweep of everything not on the keep-list. */
  autoSweep: boolean;
}

export const RULES_KEY = 'wafer:rules';

const EMPTY: Rules = { protectedIds: [], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false };

export async function loadRules(): Promise<Rules> {
  const r = await chrome.storage.local.get(RULES_KEY);
  const stored = r[RULES_KEY] as Partial<Rules> | undefined;
  return {
    protectedIds: stored?.protectedIds ?? [],
    pinnedIds: stored?.pinnedIds ?? [],
    blockedDomains: stored?.blockedDomains ?? [],
    keepDomains: stored?.keepDomains ?? [],
    autoSweep: stored?.autoSweep ?? false,
  };
}

export async function saveRules(rules: Rules): Promise<void> {
  await chrome.storage.local.set({ [RULES_KEY]: rules });
}

/** Add id if absent, remove it if present. Returns a new array. */
export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function isProtected(rules: Rules, c: CookieAttrs): boolean {
  return rules.protectedIds.includes(cookieId(c));
}

export function isPinned(rules: Rules, c: CookieAttrs): boolean {
  return rules.pinnedIds.includes(cookieId(c));
}

// Cookie domains are lowercase-canonical in Chrome, so normalize block rules to match.
const bare = (d: string): string => d.replace(/^\./, '').toLowerCase();

function suffixMatch(domains: string[], cookieDomain: string): boolean {
  const host = bare(cookieDomain);
  return domains.some((d) => {
    const bd = bare(d);
    return host === bd || host.endsWith('.' + bd);
  });
}

/** True if the cookie's domain equals or is a subdomain of any blocked domain (leading dot ignored). */
export function matchesBlock(rules: Rules, c: CookieAttrs): boolean {
  return suffixMatch(rules.blockedDomains, c.domain);
}

/** True if the cookie's domain is on the cleanup keep-list (equal or subdomain). */
export function matchesKeep(rules: Rules, c: CookieAttrs): boolean {
  return suffixMatch(rules.keepDomains, c.domain);
}

/** Cookies a cleanup sweep would remove: NOT on the keep-list and NOT protected. */
export function computeCleanup(cookies: CookieAttrs[], rules: Rules): CookieAttrs[] {
  return cookies.filter((c) => !matchesKeep(rules, c) && !isProtected(rules, c));
}

/** Pinned cookies first (in their original relative order), then the rest (original order). Stable. */
export function sortPinned(cookies: CookieAttrs[], rules: Rules): CookieAttrs[] {
  const pinned = cookies.filter((c) => isPinned(rules, c));
  const rest = cookies.filter((c) => !isPinned(rules, c));
  return [...pinned, ...rest];
}

/** Split a delete batch into cookies safe to remove and a count of protected ones skipped. */
export function partitionDeletable(cookies: CookieAttrs[], rules: Rules): { deletable: CookieAttrs[]; protectedSkipped: number } {
  const deletable = cookies.filter((c) => !isProtected(rules, c));
  return { deletable, protectedSkipped: cookies.length - deletable.length };
}
