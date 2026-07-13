import { describe, it, expect } from 'vitest';
import { auditCookie } from './audit';
import type { CookieAttrs } from './cookie-types';

const c = (o: Partial<CookieAttrs> = {}): CookieAttrs => ({ name: 'a', value: '1', domain: 'ex.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: true, ...o });

describe('auditCookie', () => {
  it('flags a missing SameSite attribute', () => {
    expect(auditCookie(c({ sameSite: 'unspecified' })).some((f) => /SameSite/.test(f.message))).toBe(true);
  });

  it('flags SameSite=None without a partition', () => {
    expect(auditCookie(c({ sameSite: 'no_restriction' })).some((f) => /partition/i.test(f.message))).toBe(true);
  });

  it('does not flag SameSite=None WITH a partition', () => {
    const flags = auditCookie(c({ sameSite: 'no_restriction', partitionKey: { topLevelSite: 'https://a.com' } }));
    expect(flags.some((f) => /partition/i.test(f.message))).toBe(false);
  });

  it('flags an insecure cookie', () => {
    expect(auditCookie(c({ secure: false })).some((f) => /Secure/.test(f.message))).toBe(true);
  });

  it('flags a very large cookie', () => {
    expect(auditCookie(c({ value: 'x'.repeat(4000) })).some((f) => /large/i.test(f.message))).toBe(true);
  });

  it('returns no flags for a well-formed cookie', () => {
    expect(auditCookie(c({ sameSite: 'lax', secure: true }))).toEqual([]);
  });
});
