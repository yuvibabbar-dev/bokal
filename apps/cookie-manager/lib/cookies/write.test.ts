import { describe, it, expect } from 'vitest';
import { toSetDetails } from './write';
import type { CookieAttrs } from '../cookie-types';

function base(overrides: Partial<CookieAttrs> = {}): CookieAttrs {
  return { name: 'sid', value: 'abc', domain: 'example.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false, ...overrides };
}

describe('toSetDetails', () => {
  it('builds url from the cookie and copies core fields', () => {
    const d = toSetDetails(base());
    expect(d.url).toBe('https://example.com/');
    expect(d.name).toBe('sid');
    expect(d.value).toBe('abc');
    expect(d.path).toBe('/');
    expect(d.secure).toBe(true);
    expect(d.sameSite).toBe('lax');
  });
  it('sets domain when not host-only', () => {
    expect(toSetDetails(base({ hostOnly: false, domain: 'example.com' })).domain).toBe('example.com');
  });
  it('omits domain when host-only', () => {
    expect('domain' in toSetDetails(base({ hostOnly: true }))).toBe(false);
  });
  it('omits expirationDate for a session cookie', () => {
    expect('expirationDate' in toSetDetails(base())).toBe(false);
  });
  it('includes expirationDate for a persistent cookie', () => {
    expect(toSetDetails(base({ expirationDate: 1893456000 })).expirationDate).toBe(1893456000);
  });
  it('passes through partitionKey', () => {
    const d = toSetDetails(base({ partitionKey: { topLevelSite: 'https://top.example', hasCrossSiteAncestor: true } }));
    expect(d.partitionKey).toEqual({ topLevelSite: 'https://top.example', hasCrossSiteAncestor: true });
  });
});
