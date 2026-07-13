import { describe, it, expect } from 'vitest';
import { cookieId, cookieUrl } from './keys';

describe('cookieUrl', () => {
  it('builds an https url and strips a leading dot from the domain', () => {
    expect(cookieUrl({ domain: '.example.com', path: '/app', secure: true })).toBe('https://example.com/app');
  });
  it('builds an http url when not secure', () => {
    expect(cookieUrl({ domain: 'example.com', path: '/', secure: false })).toBe('http://example.com/');
  });
});

describe('cookieId', () => {
  it('is stable and distinguishes name/domain/path/store/partition', () => {
    const a = cookieId({ name: 'sid', domain: 'example.com', path: '/', storeId: '0' });
    const b = cookieId({ name: 'sid', domain: 'example.com', path: '/', storeId: '0' });
    const c = cookieId({ name: 'sid', domain: 'example.com', path: '/app', storeId: '0' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
  it('incorporates the partition top-level site', () => {
    const unpart = cookieId({ name: 'sid', domain: 'example.com', path: '/' });
    const part = cookieId({ name: 'sid', domain: 'example.com', path: '/', partitionKey: { topLevelSite: 'https://top.example' } });
    expect(unpart).not.toBe(part);
  });
  it('does not collide when a field contains the delimiter character', () => {
    const a = cookieId({ name: 'b', domain: 'example.com', path: '/a|', storeId: '0' });
    const b = cookieId({ name: 'b', domain: 'example.com', path: '/a', storeId: '0' });
    // Without escaping these would both be "0||example.com|/a|b".
    expect(a).not.toBe(b);
  });
});
