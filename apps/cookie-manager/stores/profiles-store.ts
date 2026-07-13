import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { Profile } from '../lib/profiles/types';
import { putProfile, getAllProfiles, deleteProfileDb } from '../lib/profiles/db';
import { encryptJson, decryptJson } from '../lib/profiles/crypto';
import { setCookie, removeCookie } from '../lib/cookies/write';
import { cookieUrl } from '../lib/cookies/keys';
import { getCookiesForUrl } from '../lib/cookies/read';
import { loadRules, isProtected } from '../lib/rules/rules';
import { cookiesStore } from './cookies-store';
import type { CookieAttrs } from '../lib/cookie-types';

interface ProfilesState {
  profiles: Profile[];
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (name: string, passphrase?: string) => Promise<void>;
  apply: (id: string, opts?: { passphrase?: string; replace?: boolean }) => Promise<{ applied: number; failed: number; removed: number }>;
  remove: (id: string) => Promise<void>;
}

async function cookiesOf(profile: Profile, passphrase?: string): Promise<CookieAttrs[]> {
  if (!profile.encrypted) return profile.cookies ?? [];
  if (!profile.blob) return [];
  if (!passphrase) throw new Error('This profile is encrypted — a passphrase is required.');
  return decryptJson<CookieAttrs[]>(profile.blob, passphrase);
}

export const profilesStore = createStore<ProfilesState>((set, get) => ({
  profiles: [],
  busy: false,
  error: null,
  load: async () => {
    try {
      const profiles = await getAllProfiles();
      profiles.sort((a, b) => b.createdAt - a.createdAt);
      set({ profiles });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  save: async (name, passphrase) => {
    set({ busy: true, error: null });
    try {
      const { cookies, activeUrl } = cookiesStore.getState();
      const base: Profile = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
        site: activeUrl ?? undefined,
        encrypted: Boolean(passphrase),
      };
      const profile: Profile = passphrase
        ? { ...base, blob: await encryptJson(cookies, passphrase) }
        : { ...base, cookies };
      await putProfile(profile);
      await get().load();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ busy: false });
    }
  },
  apply: async (id, opts) => {
    set({ busy: true, error: null });
    try {
      const profile = get().profiles.find((p) => p.id === id);
      if (!profile) throw new Error('Profile not found');
      const cookies = await cookiesOf(profile, opts?.passphrase);
      let removed = 0;
      if (opts?.replace) {
        // Clear existing cookies for every URL this profile touches, then apply — a true restore.
        // Best-effort: removes existing cookies for the profile's URLs, then sets. A partial set-failure leaves those cookies cleared with no rollback (reported as failed).
        // Protected cookies are never removed, even on a replace (data-layer protect invariant).
        const rules = await loadRules();
        const urls = [...new Set(cookies.map((c) => cookieUrl(c)))];
        for (const url of urls) {
          for (const existing of await getCookiesForUrl(url)) {
            if (isProtected(rules, existing)) continue;
            try {
              await removeCookie(existing);
              removed += 1;
            } catch {
              /* best effort */
            }
          }
        }
      }
      let applied = 0;
      let failed = 0;
      for (const c of cookies) {
        try {
          await setCookie(c);
          applied += 1;
        } catch {
          failed += 1;
        }
      }
      await cookiesStore.getState().refresh();
      return { applied, failed, removed };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return { applied: 0, failed: 0, removed: 0 };
    } finally {
      set({ busy: false });
    }
  },
  remove: async (id) => {
    try {
      await deleteProfileDb(id);
      await get().load();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
}));

export function useProfiles<T>(sel: (s: ProfilesState) => T): T {
  return useStore(profilesStore, sel);
}
