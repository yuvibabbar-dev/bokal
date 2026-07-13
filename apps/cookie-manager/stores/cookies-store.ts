import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { CookieAttrs } from '../lib/cookie-types';
import { getActiveTabUrl, getCookiesForUrl } from '../lib/cookies/read';
import { setCookie, removeCookie } from '../lib/cookies/write';
import { hasAllUrlsPermission } from '../lib/permissions';

interface CookiesState {
  granted: boolean;
  activeUrl: string | null;
  cookies: CookieAttrs[];
  query: string;
  loading: boolean;
  setQuery: (q: string) => void;
  refresh: () => Promise<void>;
  saveCookie: (c: CookieAttrs) => Promise<{ ok: boolean; error?: string }>;
  deleteCookie: (c: CookieAttrs) => Promise<void>;
}

const SESSION_KEY = 'wafer:lastCookies';

let refreshSeq = 0;

export const cookiesStore = createStore<CookiesState>((set, get) => ({
  granted: false,
  activeUrl: null,
  cookies: [],
  query: '',
  loading: false,
  setQuery: (q) => set({ query: q }),
  refresh: async () => {
    const seq = ++refreshSeq;
    set({ loading: true });
    try {
      const granted = await hasAllUrlsPermission();
      if (!granted) {
        if (seq === refreshSeq) set({ granted: false, activeUrl: null, cookies: [], loading: false });
        return;
      }
      const activeUrl = await getActiveTabUrl();
      const cookies = activeUrl ? await getCookiesForUrl(activeUrl) : [];
      if (seq !== refreshSeq) return; // a newer refresh superseded this one
      set({ granted: true, activeUrl, cookies, loading: false });
      // chrome.storage is the source of truth for cross-context rehydrate.
      await chrome.storage.session.set({ [SESSION_KEY]: { activeUrl, cookies } });
    } catch (err) {
      console.error('[wafer] refresh failed', err);
      if (seq === refreshSeq) set({ loading: false });
    }
  },
  saveCookie: async (c) => {
    try {
      await setCookie(c);
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
