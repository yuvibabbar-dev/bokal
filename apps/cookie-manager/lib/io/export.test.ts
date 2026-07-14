import { describe, it, expect } from 'vitest';
import { toJson, toNetscape } from './export';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...o };
}

describe('toJson', () => {
  it('wraps cookies with format+version and round-trips via JSON.parse', () => {
    const parsed = JSON.parse(toJson([base()], 'https://example.com'));
    expect(parsed.format).toBe('bokal-cookies');
    expect(parsed.version).toBe(1);
    expect(parsed.exportedFrom).toBe('https://example.com');
    expect(parsed.cookies).toHaveLength(1);
    expect(parsed.cookies[0].name).toBe('sid');
  });
});

describe('toNetscape', () => {
  it('emits a header and one 7-field tab-separated line per cookie', () => {
    const out = toNetscape([base({ expirationDate: 1893456000 })]);
    expect(out.startsWith('# Netscape HTTP Cookie File')).toBe(true);
    const line = out.trim().split('\n').at(-1)!;
    const fields = line.split('\t');
    expect(fields).toHaveLength(7);
    expect(fields[5]).toBe('sid'); // name
    expect(fields[6]).toBe('abc'); // value
  });
  it('marks host-only cookies FALSE with no leading dot and domain cookies TRUE with leading dot', () => {
    const host = toNetscape([base({ hostOnly: true, domain: 'example.com' })]).trim().split('\n').at(-1)!.split('\t');
    expect(host[0]).toBe('example.com');
    expect(host[1]).toBe('FALSE');
    const dom = toNetscape([base({ hostOnly: false, domain: 'example.com' })]).trim().split('\n').at(-1)!.split('\t');
    expect(dom[0]).toBe('.example.com');
    expect(dom[1]).toBe('TRUE');
  });
  it('uses 0 expiry for a session cookie', () => {
    const s = toNetscape([base()]).trim().split('\n').at(-1)!.split('\t');
    expect(s[4]).toBe('0');
  });
});
