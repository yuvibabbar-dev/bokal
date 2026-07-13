import { describe, it, expect } from 'vitest';
import { validateCookie, validateForImport, NAME_VALUE_MAX } from './validation';
import type { CookieAttrs } from '../cookie-types';

function base(overrides: Partial<CookieAttrs> = {}): CookieAttrs {
  return {
    name: 'sid',
    value: 'abc',
    domain: 'example.com',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'lax',
    hostOnly: false,
    ...overrides,
  };
}

describe('validateCookie', () => {
  it('accepts a normal cookie on a secure origin', () => {
    expect(validateCookie(base(), { isSecureOrigin: true })).toEqual([]);
  });

  it('rejects __Host- without Path=/', () => {
    const issues = validateCookie(base({ name: '__Host-sid', hostOnly: true, path: '/app' }), { isSecureOrigin: true });
    expect(issues.map((i) => i.field)).toContain('path');
  });

  it('rejects __Host- that is not host-only (has Domain)', () => {
    const issues = validateCookie(base({ name: '__Host-sid', hostOnly: false, path: '/' }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'domain')).toBe(true);
  });

  it('rejects __Host- without Secure', () => {
    const issues = validateCookie(base({ name: '__Host-sid', hostOnly: true, path: '/', secure: false }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'secure')).toBe(true);
  });

  it('rejects __Secure- without Secure', () => {
    const issues = validateCookie(base({ name: '__Secure-sid', secure: false }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'secure')).toBe(true);
  });

  it('rejects __Secure- on a non-secure origin', () => {
    const issues = validateCookie(base({ name: '__Secure-sid' }), { isSecureOrigin: false });
    expect(issues.some((i) => i.field === 'name')).toBe(true);
  });

  it('rejects SameSite=None without Secure', () => {
    const issues = validateCookie(base({ sameSite: 'no_restriction', secure: false }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'sameSite')).toBe(true);
  });

  it('rejects name+value over the byte limit', () => {
    const issues = validateCookie(base({ value: 'x'.repeat(NAME_VALUE_MAX) }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'value')).toBe(true);
  });

  it('rejects an empty name', () => {
    const issues = validateCookie(base({ name: '' }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'name')).toBe(true);
  });

  it('rejects an over-long path', () => {
    const issues = validateCookie(base({ path: '/' + 'x'.repeat(1024) }), { isSecureOrigin: true });
    expect(issues.some((i) => i.field === 'path')).toBe(true);
  });
});

describe('validateForImport', () => {
  it('separates valid cookies from invalid ones with reasons', () => {
    const good = base();
    const bad = base({ name: '__Host-sid', hostOnly: false, path: '/' }); // __Host- must be host-only
    const { valid, invalid } = validateForImport([good, bad]);
    expect(valid).toEqual([good]);
    expect(invalid).toHaveLength(1);
    expect(invalid[0]?.cookie).toBe(bad);
    expect(invalid[0]?.message).toMatch(/__Host-/);
  });

  it('treats an https-target cookie as a secure origin', () => {
    // __Secure- on a secure cookie should pass (its own scheme is the origin signal).
    const { valid, invalid } = validateForImport([base({ name: '__Secure-sid', secure: true })]);
    expect(invalid).toHaveLength(0);
    expect(valid).toHaveLength(1);
  });
});
