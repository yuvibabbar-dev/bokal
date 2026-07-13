import { describe, it, expect } from 'vitest';
import { siteFromUrl } from './site';

describe('siteFromUrl', () => {
  it('returns scheme://host without port or path', () => {
    expect(siteFromUrl('https://www.example.com:8443/a/b?x=1')).toBe('https://www.example.com');
  });
  it('returns null for a non-url', () => {
    expect(siteFromUrl('nope')).toBeNull();
  });
});
