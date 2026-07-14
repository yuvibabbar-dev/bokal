import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { CookieAttrs } from '../lib/cookie-types';
import { getActiveTabUrl, getAllCookies, getCookiesForUrl, getPartitionedCookiesForUrl } from '../lib/cookies/read';
import { setCookie, removeCookie } from '../lib/cookies/write';
import { hasAllUrlsPermission, hasSiteAccess } from '../lib/permissions';
import { cookieId } from '../lib/cookies/keys';
import { validateForImport } from '../lib/cookies/validation';
import { recordAction } from '../lib/review';
import { loadRules, partitionDeletable, isProtected, computeCleanup } from '../lib/rules/rules';

interface CookiesState {
  granted: boolean;
  ready: boolean;
  activeUrl: string | null;
  cookies: CookieAttrs[];
  query: string;
  loading: boolean;
  showPartitioned: boolean;
  scope: 'site' | 'all';
  setQuery: (q: string) => void;
  setShowPartitioned: (v: boolean) => void;
  setScope: (s: 'site' | 'all') => void;
  refresh: () => Promise<void>;
  saveCookie: (c: CookieAttrs, original?: CookieAttrs) => Promise<{ ok: boolean; error?: string }>;
  deleteCookie: (c: CookieAttrs) => Promise<void>;
  deleteAllForSite: (cookies: CookieAttrs[]) => Promise<{ removed: number; failed: number; skipped: number }>;
  cleanupNow: () => Promise<{ removed: number; failed: number }>;
  importCookies: (cookies: CookieAttrs[]) => Promise<{ imported: number; failed: number; errors: string[] }>;
}

const SESSION_KEY = 'bokal:lastCookies';

let refreshSeq = 0;

export const cookiesStore = createStore<CookiesState>((set, get) => ({
  granted: false,
  ready: false,
  activeUrl: null,
  cookies: [],
  query: '',
  loading: false,
  showPartitioned: false,
  scope: 'site',
  setQuery: (q) => set({ query: q }),
  setShowPartitioned: (v) => { set({ showPartitioned: v }); void get().refresh(); },
  setScope: (s) => { set({ scope: s }); void get().refresh(); },
  refresh: async () => {
    const seq = ++refreshSeq;
    set({ loading: true });
    try {
      const scope = get().scope;
      const activeUrl = await getActiveTabUrl();
      // Grant gate: the all-cookies scope genuinely needs <all_urls>. The single-site scope is
      // granted if the user holds the broad grant OR per-site access to the active origin — a
      // broad-access user is never re-prompted, even on a tab whose URL we can't read.
      const broad = await hasAllUrlsPermission();
      const granted = scope === 'all'
        ? broad
        : broad || (!!activeUrl && (await hasSiteAccess(activeUrl)));
      if (!granted) {
        // Keep activeUrl (activeTab may surface it pre-grant) so the grant screen can name the site.
        if (seq === refreshSeq) set({ granted: false, activeUrl, cookies: [], loading: false, ready: true });
        return;
      }
      let cookies: CookieAttrs[];
      if (scope === 'all') {
        cookies = await getAllCookies();
      } else {
        cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
        if (activeUrl && get().showPartitioned) {
          cookies = cookies.concat(await getPartitionedCookiesForUrl(activeUrl));
        }
      }
      if (seq !== refreshSeq) return; // a newer refresh superseded this one
      set({ granted: true, activeUrl, cookies, loading: false, ready: true });
      // chrome.storage is the source of truth for cross-context rehydrate.
      await chrome.storage.session.set({ [SESSION_KEY]: { activeUrl, cookies } });
    } catch (err) {
      console.error('[bokal] refresh failed', err);
      if (seq === refreshSeq) set({ loading: false, ready: true });
    }
  },
  saveCookie: async (c, original) => {
    try {
      await setCookie(c);
      if (original && cookieId(original) !== cookieId(c)) {
        await removeCookie(original);
      }
      await recordAction();
      await get().refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
  deleteCookie: async (c) => {
    // Data-layer enforcement of the protect invariant (the disabled UI button is not the boundary).
    if (isProtected(await loadRules(), c)) return;
    await removeCookie(c);
    await recordAction();
    await get().refresh();
  },
  deleteAllForSite: async (list) => {
    // Protected cookies are never deleted by any Bokal action.
    const rules = await loadRules();
    const { deletable, protectedSkipped } = partitionDeletable(list, rules);
    let removed = 0;
    let failed = 0;
    for (const c of deletable) {
      try { await removeCookie(c); removed += 1; } catch { failed += 1; }
    }
    if (removed > 0) await recordAction();
    await get().refresh();
    return { removed, failed, skipped: protectedSkipped };
  },
  cleanupNow: async () => {
    // Remove every cookie not on the keep-list (and never a protected one). Needs <all_urls>.
    const rules = await loadRules();
    const removable = computeCleanup(await getAllCookies(), rules);
    let removed = 0;
    let failed = 0;
    for (const c of removable) {
      try { await removeCookie(c); removed += 1; } catch { failed += 1; }
    }
    if (removed > 0) await recordAction();
    await get().refresh();
    return { removed, failed };
  },
  importCookies: async (cookies) => {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    // Validate before writing so invalid cookies get a specific reason rather than a silent
    // browser rejection (both JSON and header imports flow through here).
    const { valid, invalid } = validateForImport(cookies);
    for (const { cookie, message } of invalid) {
      failed += 1;
      errors.push(`${cookie.name}@${cookie.domain}: ${message}`);
    }
    for (const c of valid) {
      try {
        await setCookie(c);
        imported += 1;
      } catch (err) {
        failed += 1;
        errors.push(`${c.name}@${c.domain}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (imported > 0) await recordAction();
    await get().refresh();
    return { imported, failed, errors };
  },
}));

/** Rehydrate synchronously-ish from session storage so a remounted panel shows last data instantly. */
export async function hydrateFromStorage(): Promise<void> {
  const stored = await chrome.storage.session.get(SESSION_KEY);
  const snap = stored[SESSION_KEY] as { activeUrl: string | null; cookies: CookieAttrs[] } | undefined;
  if (snap) cookiesStore.setState({ activeUrl: snap.activeUrl, cookies: snap.cookies });
}

export function useCookiesStore<T>(selector: (s: CookiesState) => T): T {
  return useStore(cookiesStore, selector);
}
