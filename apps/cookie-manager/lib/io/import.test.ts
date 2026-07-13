import { describe, it, expect } from 'vitest';
import { parseCookiesJson } from './import';
import { toJson } from './export';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...o };
}

describe('parseCookiesJson', () => {
  it('round-trips a Wafer export', () => {
    const original = [base({ expirationDate: 1893456000 }), base({ name: 'other', hostOnly: true })];
    const res = parseCookiesJson(toJson(original));
    expect(res.errors).toEqual([]);
    expect(res.cookies).toEqual(original);
  });
  it('accepts a bare array of cookies', () => {
    const res = parseCookiesJson(JSON.stringify([base()]));
    expect(res.cookies).toHaveLength(1);
  });
  it('reports invalid JSON', () => {
    expect(parseCookiesJson('{not json').errors).toEqual(['Invalid JSON']);
  });
  it('skips and reports an entry missing a name', () => {
    const res = parseCookiesJson(JSON.stringify([{ domain: 'example.com' }]));
    expect(res.cookies).toHaveLength(0);
    expect(res.errors.length).toBe(1);
  });
  it('defaults unknown sameSite to unspecified and coerces types', () => {
    const res = parseCookiesJson(JSON.stringify([{ name: 'x', domain: 'e.com', sameSite: 'bogus' }]));
    expect(res.cookies).toHaveLength(1);
    expect(res.cookies[0]!.sameSite).toBe('unspecified');
    expect(res.cookies[0]!.path).toBe('/');
    expect(res.cookies[0]!.secure).toBe(false);
  });
  it('round-trips a partitioned cookie preserving hasCrossSiteAncestor', () => {
    const original = [base({ partitionKey: { topLevelSite: 'https://top.example', hasCrossSiteAncestor: false } })];
    const res = parseCookiesJson(toJson(original));
    expect(res.errors).toEqual([]);
    expect(res.cookies).toEqual(original);
  });
});
