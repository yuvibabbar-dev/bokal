import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrableDomain, siteOriginPatterns, hasSiteAccess, requestSiteAccess } from './permissions';

describe('registrableDomain', () => {
  it('reduces a subdomain to eTLD+1', () => {
    expect(registrableDomain('www.example.com')).toBe('example.com');
    expect(registrableDomain('a.b.c.example.com')).toBe('example.com');
  });
  it('handles a multi-part public suffix', () => {
    expect(registrableDomain('shop.example.co.uk')).toBe('example.co.uk');
    expect(registrableDomain('example.co.uk')).toBe('example.co.uk');
  });
  it('leaves an apex domain', () => {
    expect(registrableDomain('example.com')).toBe('example.com');
  });
  it('leaves an IP or single-label host', () => {
    expect(registrableDomain('localhost')).toBe('localhost');
    expect(registrableDomain('127.0.0.1')).toBe('127.0.0.1');
  });
});

describe('siteOriginPatterns', () => {
  it('covers the host and *.registrableDomain', () => {
    expect(siteOriginPatterns('https://www.example.com/path?q=1')).toEqual(['https://www.example.com/*', 'https://*.example.com/*']);
  });
  it('works for http and an apex host', () => {
    expect(siteOriginPatterns('http://example.com/')).toEqual(['http://example.com/*', 'http://*.example.com/*']);
  });
  it('returns [] for a non-http(s) url', () => {
    expect(siteOriginPatterns('chrome://extensions')).toEqual([]);
    expect(siteOriginPatterns('not a url')).toEqual([]);
  });
});

describe('hasSiteAccess / requestSiteAccess', () => {
  beforeEach(() => {
    (globalThis as unknown as { chrome: unknown }).chrome = {
      permissions: { contains: vi.fn(async () => true), request: vi.fn(async () => true) },
    };
  });

  it('checks contains() with the site patterns', async () => {
    expect(await hasSiteAccess('https://a.example.com/')).toBe(true);
    expect(chrome.permissions.contains).toHaveBeenCalledWith({ origins: ['https://a.example.com/*', 'https://*.example.com/*'] });
  });

  it('returns false for an unsupported url without touching chrome', async () => {
    expect(await hasSiteAccess('about:blank')).toBe(false);
    expect(chrome.permissions.contains).not.toHaveBeenCalled();
  });

  it('requestSiteAccess requests the site patterns', async () => {
    expect(await requestSiteAccess('https://example.com/')).toBe(true);
    expect(chrome.permissions.request).toHaveBeenCalledWith({ origins: ['https://example.com/*', 'https://*.example.com/*'] });
  });

  it('requestSiteAccess returns false for an unsupported url', async () => {
    expect(await requestSiteAccess('chrome://x')).toBe(false);
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });
});
