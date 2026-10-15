import { describe, it, expect } from 'vitest';
import { parseCookiesJson, parseImport } from './import';
import { toJson, toNetscape } from './export';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...o };
}

describe('parseCookiesJson', () => {
  it('round-trips a Bokal export', () => {
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

describe('parseImport (format detection chain)', () => {
  it('routes JSON to the JSON parser', () => {
    const r = parseImport(toJson([base()]), 'example.com');
    expect(r.format).toBe('json');
    expect(r.cookies.map((c) => c.name)).toEqual(['sid']);
  });

  it('routes a Netscape cookies.txt to the Netscape parser', () => {
    const r = parseImport('# Netscape HTTP Cookie File\n.example.com\tTRUE\t/\tTRUE\t0\tsid\tabc\n', 'ignored.com');
    expect(r.format).toBe('netscape');
    expect(r.cookies[0]).toMatchObject({ name: 'sid', value: 'abc', domain: '.example.com' });
  });

  it('still detects Netscape when every record line carries the "#HttpOnly_" marker', () => {
    const text = toNetscape([base({ httpOnly: true }), base({ name: 'other', httpOnly: true, hostOnly: true })]);
    const r = parseImport(text, 'ignored.com');
    expect(r.format).toBe('netscape');
    expect(r.cookies.map((c) => c.httpOnly)).toEqual([true, true]);
  });

  it('routes a raw header string to the header parser, scoped to the given domain', () => {
    const r = parseImport('sid=abc; theme=dark', 'example.com');
    expect(r.format).toBe('header');
    expect(r.cookies.map((c) => [c.name, c.domain])).toEqual([['sid', 'example.com'], ['theme', 'example.com']]);
  });

  it('tries Netscape before the permissive header parser so a value containing "=" is not misread', () => {
    // The header parser would happily split this on its lone "=" and produce garbage.
    const r = parseImport('example.com\tFALSE\t/\tFALSE\t0\ttoken\tabc=def\n', 'example.com');
    expect(r.format).toBe('netscape');
    expect(r.cookies[0]).toMatchObject({ name: 'token', value: 'abc=def' });
  });

  it('reports unparseable input with no format and surfaces the JSON error', () => {
    const r = parseImport('this is not anything', 'example.com');
    expect(r.format).toBeNull();
    expect(r.cookies).toEqual([]);
    expect(r.errors[0]).toBe('Invalid JSON');
  });

  it('distinguishes valid-but-empty JSON from a parse failure', () => {
    const r = parseImport('[]', 'example.com');
    expect(r.format).toBe('json');
    expect(r.cookies).toEqual([]);
    expect(r.errors).toEqual([]);
  });
});
