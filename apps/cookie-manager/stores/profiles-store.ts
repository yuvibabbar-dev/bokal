import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { Profile } from '../lib/profiles/types';
import { putProfile, getAllProfiles, deleteProfileDb } from '../lib/profiles/db';
import { encryptJson, decryptJson } from '../lib/profiles/crypto';
import { setCookie } from '../lib/cookies/write';
import { cookiesStore } from './cookies-store';
import type { CookieAttrs } from '../lib/cookie-types';

interface ProfilesState {
  profiles: Profile[];
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (name: string, passphrase?: string) => Promise<void>;
  apply: (id: string, passphrase?: string) => Promise<{ applied: number; failed: number }>;
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
  apply: async (id, passphrase) => {
    set({ busy: true, error: null });
    try {
      const profile = get().profiles.find((p) => p.id === id);
      if (!profile) throw new Error('Profile not found');
      const cookies = await cookiesOf(profile, passphrase);
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
      return { applied, failed };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return { applied: 0, failed: 0 };
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
