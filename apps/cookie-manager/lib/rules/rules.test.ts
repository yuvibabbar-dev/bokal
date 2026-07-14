import { describe, it, expect, beforeEach } from 'vitest';
import { loadRules, saveRules, toggleId, isProtected, matchesBlock, sortPinned, partitionDeletable, matchesKeep, computeCleanup, type Rules } from './rules';
import { cookieId } from '../cookies/keys';
import type { CookieAttrs } from '../cookie-types';

const c = (o: Partial<CookieAttrs> = {}): CookieAttrs => ({ name: 'a', value: '1', domain: 'ex.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: true, ...o });

function fakeLocal() {
  const m = new Map<string, unknown>();
  return {
    get: async (k: string) => (m.has(k) ? { [k]: m.get(k) } : {}),
    set: async (o: Record<string, unknown>) => { for (const [k, v] of Object.entries(o)) m.set(k, v); },
  };
}
beforeEach(() => { (globalThis as unknown as { chrome: unknown }).chrome = { storage: { local: fakeLocal() } }; });

describe('rules', () => {
  it('toggleId adds then removes', () => {
    expect(toggleId([], 'x')).toEqual(['x']);
    expect(toggleId(['x'], 'x')).toEqual([]);
  });

  it('round-trips through storage', async () => {
    const r: Rules = { protectedIds: ['p'], pinnedIds: [], blockedDomains: ['ads.com'], keepDomains: ['mysite.com'], autoSweep: true };
    await saveRules(r);
    expect(await loadRules()).toEqual(r);
  });

  it('loadRules defaults to empty', async () => {
    expect(await loadRules()).toEqual({ protectedIds: [], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false });
  });

  it('loadRules fills new fields as defaults for old stored data', async () => {
    await chrome.storage.local.set({ 'bokal:rules': { protectedIds: ['x'] } });
    expect(await loadRules()).toEqual({ protectedIds: ['x'], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false });
  });

  it('computeCleanup removes non-kept, non-protected cookies', () => {
    const keep = c({ name: 'k', domain: 'mysite.com' });
    const gone = c({ name: 'g', domain: 'tracker.com' });
    const prot = c({ name: 'p', domain: 'tracker.com' });
    const r: Rules = { protectedIds: [cookieId(prot)], pinnedIds: [], blockedDomains: [], keepDomains: ['mysite.com'], autoSweep: false };
    const out = computeCleanup([keep, gone, prot], r);
    expect(out.map((x) => x.name)).toEqual(['g']); // keep-listed kept, protected kept, tracker removed
  });

  it('matchesKeep does suffix match', () => {
    const r: Rules = { protectedIds: [], pinnedIds: [], blockedDomains: [], keepDomains: ['mysite.com'], autoSweep: false };
    expect(matchesKeep(r, c({ domain: 'app.mysite.com' }))).toBe(true);
    expect(matchesKeep(r, c({ domain: 'other.com' }))).toBe(false);
  });

  it('isProtected matches by cookieId', () => {
    const ck = c();
    const r: Rules = { protectedIds: [cookieId(ck)], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false };
    expect(isProtected(r, ck)).toBe(true);
    expect(isProtected(r, c({ name: 'b' }))).toBe(false);
  });

  it('matchesBlock does a suffix match ignoring a leading dot', () => {
    const r: Rules = { protectedIds: [], pinnedIds: [], blockedDomains: ['doubleclick.net'], keepDomains: [], autoSweep: false };
    expect(matchesBlock(r, c({ domain: 'ad.doubleclick.net' }))).toBe(true);
    expect(matchesBlock(r, c({ domain: '.doubleclick.net' }))).toBe(true);
    expect(matchesBlock(r, c({ domain: 'doubleclick.net' }))).toBe(true);
    expect(matchesBlock(r, c({ domain: 'notdoubleclick.net' }))).toBe(false);
    expect(matchesBlock(r, c({ domain: 'example.com' }))).toBe(false);
  });

  it('matchesBlock is case-insensitive (cookie domains are lowercase-canonical)', () => {
    const r: Rules = { protectedIds: [], pinnedIds: [], blockedDomains: ['DoubleClick.NET'], keepDomains: [], autoSweep: false };
    expect(matchesBlock(r, c({ domain: 'ad.doubleclick.net' }))).toBe(true);
    expect(matchesBlock(r, c({ domain: 'doubleclick.net' }))).toBe(true);
  });

  it('sortPinned puts pinned first, stable otherwise', () => {
    const a = c({ name: 'a' }), b = c({ name: 'b' }), d = c({ name: 'd' });
    const r: Rules = { protectedIds: [], pinnedIds: [cookieId(d)], blockedDomains: [], keepDomains: [], autoSweep: false };
    expect(sortPinned([a, b, d], r).map((x) => x.name)).toEqual(['d', 'a', 'b']);
  });

  it('partitionDeletable separates protected cookies', () => {
    const a = c({ name: 'a' }), b = c({ name: 'b' });
    const r: Rules = { protectedIds: [cookieId(b)], pinnedIds: [], blockedDomains: [], keepDomains: [], autoSweep: false };
    const { deletable, protectedSkipped } = partitionDeletable([a, b], r);
    expect(deletable.map((x) => x.name)).toEqual(['a']);
    expect(protectedSkipped).toBe(1);
  });
});
