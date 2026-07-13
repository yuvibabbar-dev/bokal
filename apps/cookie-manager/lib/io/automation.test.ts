import { describe, it, expect } from 'vitest';
import { toPlaywrightStorageState, toPuppeteerJson, toPlaywrightCookies, fromAutomationJson } from './automation';
import type { CookieAttrs } from '../cookie-types';

const c: CookieAttrs = {
  name: 's', value: 't', domain: '.ex.com', path: '/', secure: true, httpOnly: true,
  sameSite: 'no_restriction', hostOnly: false, expirationDate: 1893456000,
};

describe('automation formats', () => {
  it('storageState has cookies + empty origins, None sameSite, expires in seconds', () => {
    const o = JSON.parse(toPlaywrightStorageState([c]));
    expect(o.origins).toEqual([]);
    expect(o.cookies[0]).toMatchObject({ name: 's', sameSite: 'None', secure: true, httpOnly: true, expires: 1893456000 });
  });

  it('session cookie → expires -1 in the playwright cookie array', () => {
    const o = JSON.parse(toPlaywrightCookies([{ ...c, expirationDate: undefined }]));
    expect(o[0].expires).toBe(-1);
  });

  it('puppeteer array carries the mapped sameSite', () => {
    const a = JSON.parse(toPuppeteerJson([c]));
    expect(a[0]).toMatchObject({ name: 's', sameSite: 'None' });
  });

  it('omits sameSite for unspecified', () => {
    const o = JSON.parse(toPlaywrightCookies([{ ...c, sameSite: 'unspecified' }]));
    expect('sameSite' in o[0]).toBe(false);
  });

  it('round-trips storageState back to CookieAttrs', () => {
    const back = fromAutomationJson(JSON.parse(toPlaywrightStorageState([c])));
    expect(back?.[0]).toMatchObject({ name: 's', sameSite: 'no_restriction', httpOnly: true, expirationDate: 1893456000 });
  });

  it('parses a bare puppeteer/playwright cookie array', () => {
    const back = fromAutomationJson(JSON.parse(toPuppeteerJson([c])));
    expect(back?.[0]?.name).toBe('s');
    expect(back?.[0]?.sameSite).toBe('no_restriction');
  });

  it('returns null for the wafer-cookies object (no origins, not an automation array)', () => {
    expect(fromAutomationJson({ format: 'wafer-cookies', cookies: [] })).toBeNull();
  });

  it('returns null for a Cookie-Editor-style array (uses expirationDate, not expires)', () => {
    expect(fromAutomationJson([{ name: 'x', domain: 'a.com', expirationDate: 123 }])).toBeNull();
  });
});
