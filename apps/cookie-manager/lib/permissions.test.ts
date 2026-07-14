import { describe, it, expect, vi, beforeEach } from 'vitest';
import { siteOriginPatterns, hasSiteAccess, requestSiteAccess } from './permissions';

describe('siteOriginPatterns', () => {
  it('covers the host and each parent domain as EXACT patterns (no wildcard)', () => {
    expect(siteOriginPatterns('https://www.example.com/path?q=1')).toEqual(['https://www.example.com/*', 'https://example.com/*']);
  });
  it('walks deep subdomains', () => {
    expect(siteOriginPatterns('https://a.b.example.com/')).toEqual(['https://a.b.example.com/*', 'https://b.example.com/*', 'https://example.com/*']);
  });
  it('an apex host yields just itself', () => {
    expect(siteOriginPatterns('http://example.com/')).toEqual(['http://example.com/*']);
  });
  // The trust-critical property: NEVER emit a *.<suffix> wildcard, even for unknown ccTLDs.
  it('never over-grants to a public suffix for an unlisted multi-part ccTLD', () => {
    const p = siteOriginPatterns('https://mybank.co.il/');
    expect(p).toEqual(['https://mybank.co.il/*', 'https://co.il/*']);
    expect(p.some((x) => x.includes('*.'))).toBe(false);
  });
  it('handles IPv4/IPv6 with no subdomain wildcard', () => {
    expect(siteOriginPatterns('http://127.0.0.1:3000/')).toEqual(['http://127.0.0.1/*']);
    expect(siteOriginPatterns('http://[::1]:8080/')).toEqual(['http://[::1]/*']);
  });
  it('strips a trailing FQDN dot', () => {
    expect(siteOriginPatterns('https://example.com./')).toEqual(['https://example.com/*']);
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
    expect(chrome.permissions.contains).toHaveBeenCalledWith({ origins: ['https://a.example.com/*', 'https://example.com/*'] });
  });

  it('returns false for an unsupported url without touching chrome', async () => {
    expect(await hasSiteAccess('about:blank')).toBe(false);
    expect(chrome.permissions.contains).not.toHaveBeenCalled();
  });

  it('requestSiteAccess requests the site patterns', async () => {
    expect(await requestSiteAccess('https://www.example.com/')).toBe(true);
    expect(chrome.permissions.request).toHaveBeenCalledWith({ origins: ['https://www.example.com/*', 'https://example.com/*'] });
  });

  it('requestSiteAccess returns false for an unsupported url', async () => {
    expect(await requestSiteAccess('chrome://x')).toBe(false);
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });
});
