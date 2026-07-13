import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { CookieAttrs } from '../lib/cookie-types';
import { getActiveTabUrl, getCookiesForUrl, getPartitionedCookiesForUrl } from '../lib/cookies/read';
import { setCookie, removeCookie } from '../lib/cookies/write';
import { hasAllUrlsPermission } from '../lib/permissions';
import { cookieId } from '../lib/cookies/keys';

interface CookiesState {
  granted: boolean;
  ready: boolean;
  activeUrl: string | null;
  cookies: CookieAttrs[];
  query: string;
  loading: boolean;
  showPartitioned: boolean;
  setQuery: (q: string) => void;
  setShowPartitioned: (v: boolean) => void;
  refresh: () => Promise<void>;
  saveCookie: (c: CookieAttrs, original?: CookieAttrs) => Promise<{ ok: boolean; error?: string }>;
  deleteCookie: (c: CookieAttrs) => Promise<void>;
  importCookies: (cookies: CookieAttrs[]) => Promise<{ imported: number; failed: number; errors: string[] }>;
}

const SESSION_KEY = 'wafer:lastCookies';

let refreshSeq = 0;

export const cookiesStore = createStore<CookiesState>((set, get) => ({
  granted: false,
  ready: false,
  activeUrl: null,
  cookies: [],
  query: '',
  loading: false,
  showPartitioned: false,
  setQuery: (q) => set({ query: q }),
  setShowPartitioned: (v) => { set({ showPartitioned: v }); void get().refresh(); },
  refresh: async () => {
    const seq = ++refreshSeq;
    set({ loading: true });
    try {
      const granted = await hasAllUrlsPermission();
      if (!granted) {
        if (seq === refreshSeq) set({ granted: false, activeUrl: null, cookies: [], loading: false, ready: true });
        return;
      }
      const activeUrl = await getActiveTabUrl();
      let cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
      if (activeUrl && get().showPartitioned) {
        const partitioned = await getPartitionedCookiesForUrl(activeUrl);
        cookies = cookies.concat(partitioned);
      }
      if (seq !== refreshSeq) return; // a newer refresh superseded this one
      set({ granted: true, activeUrl, cookies, loading: false, ready: true });
      // chrome.storage is the source of truth for cross-context rehydrate.
      await chrome.storage.session.set({ [SESSION_KEY]: { activeUrl, cookies } });
    } catch (err) {
      console.error('[wafer] refresh failed', err);
      if (seq === refreshSeq) set({ loading: false, ready: true });
    }
  },
  saveCookie: async (c, original) => {
    try {
      await setCookie(c);
      if (original && cookieId(original) !== cookieId(c)) {
        await removeCookie(original);
      }
      await get().refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
  deleteCookie: async (c) => {
    await removeCookie(c);
    await get().refresh();
  },
  importCookies: async (cookies) => {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const c of cookies) {
      try {
        await setCookie(c);
        imported += 1;
      } catch (err) {
        failed += 1;
        errors.push(`${c.name}@${c.domain}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
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
