import { describe, it, expect } from 'vitest';
import { toJson } from './export';
import { parseCookiesJson } from './import';
import { toSetDetails } from '../cookies/write';
import type { CookieAttrs } from '../cookie-types';

function base(o: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'v', domain: 'example.com', path: '/', secure: true, httpOnly: true, sameSite: 'lax', hostOnly: false, ...o };
}

describe('export -> import -> set round-trip', () => {
  it('preserves a partitioned __Host- cookie through the full pipeline', () => {
    const original = base({
      name: '__Host-sid',
      hostOnly: true,
      path: '/',
      partitionKey: { topLevelSite: 'https://top.example', hasCrossSiteAncestor: false },
      expirationDate: 1893456000,
    });
    const parsed = parseCookiesJson(toJson([original]));
    expect(parsed.errors).toEqual([]);
    expect(parsed.cookies[0]).toEqual(original);

    const details = toSetDetails(parsed.cookies[0]!);
    expect(details.url).toBe('https://example.com/');
    expect('domain' in details).toBe(false); // host-only omits domain
    expect(details.secure).toBe(true);
    expect(details.partitionKey).toEqual({ topLevelSite: 'https://top.example', hasCrossSiteAncestor: false });
    expect(details.expirationDate).toBe(1893456000);
  });
});
