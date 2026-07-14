import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { CookieAttrs } from '../lib/cookie-types';
import { loadRules, saveRules, toggleId, type Rules } from '../lib/rules/rules';
import { cookieId } from '../lib/cookies/keys';

interface RulesState {
  rules: Rules;
  refresh: () => Promise<void>;
  toggleProtect: (c: CookieAttrs) => Promise<void>;
  togglePin: (c: CookieAttrs) => Promise<void>;
  addBlock: (domain: string) => Promise<void>;
  removeBlock: (domain: string) => Promise<void>;
  addKeep: (domain: string) => Promise<void>;
  removeKeep: (domain: string) => Promise<void>;
  setAutoSweep: (on: boolean) => Promise<void>;
}

const RULES_KEY = 'bokal:rules';
const EMPTY: Rules = { protectedIds: [], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false };

export const rulesStore = createStore<RulesState>((set, get) => ({
  rules: EMPTY,
  refresh: async () => { set({ rules: await loadRules() }); },
  toggleProtect: async (c) => {
    const r = get().rules;
    const next: Rules = { ...r, protectedIds: toggleId(r.protectedIds, cookieId(c)) };
    set({ rules: next });
    await saveRules(next);
  },
  togglePin: async (c) => {
    const r = get().rules;
    const next: Rules = { ...r, pinnedIds: toggleId(r.pinnedIds, cookieId(c)) };
    set({ rules: next });
    await saveRules(next);
  },
  addBlock: async (domain) => {
    const d = domain.trim().replace(/^\./, '').toLowerCase();
    if (!d) return;
    const r = get().rules;
    if (r.blockedDomains.includes(d)) return;
    const next: Rules = { ...r, blockedDomains: [...r.blockedDomains, d] };
    set({ rules: next });
    await saveRules(next);
  },
  removeBlock: async (domain) => {
    const r = get().rules;
    const next: Rules = { ...r, blockedDomains: r.blockedDomains.filter((x) => x !== domain) };
    set({ rules: next });
    await saveRules(next);
  },
  addKeep: async (domain) => {
    const d = domain.trim().replace(/^\./, '').toLowerCase();
    if (!d) return;
    const r = get().rules;
    if (r.keepDomains.includes(d)) return;
    const next: Rules = { ...r, keepDomains: [...r.keepDomains, d] };
    set({ rules: next });
    await saveRules(next);
  },
  removeKeep: async (domain) => {
    const r = get().rules;
    const next: Rules = { ...r, keepDomains: r.keepDomains.filter((x) => x !== domain) };
    set({ rules: next });
    await saveRules(next);
  },
  setAutoSweep: async (on) => {
    const r = get().rules;
    const next: Rules = { ...r, autoSweep: on };
    set({ rules: next });
    await saveRules(next);
  },
}));

// Keep panels in sync when rules change in another context (the SW never writes rules, but a
// second panel or the DevTools surface might). Guard the listener so importing this store under a
// minimal chrome mock (no storage.onChanged) doesn't throw at module load.
chrome.storage.onChanged?.addListener((changes, area) => {
  if (area === 'local' && changes[RULES_KEY]) {
    rulesStore.setState({ rules: { ...EMPTY, ...(changes[RULES_KEY].newValue as Partial<Rules> | undefined) } });
  }
});

export function useRules<T>(sel: (s: RulesState) => T): T {
  return useStore(rulesStore, sel);
}
