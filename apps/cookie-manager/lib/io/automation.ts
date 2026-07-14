import type { CookieAttrs, SameSite } from '../cookie-types';

// Playwright/Puppeteer cookie shape: expires in seconds (-1 = session), capitalized SameSite.
type PwSameSite = 'Strict' | 'Lax' | 'None';
interface AutomationCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: PwSameSite;
}

const SAME_SITE_OUT: Record<SameSite, PwSameSite | undefined> = {
  strict: 'Strict',
  lax: 'Lax',
  no_restriction: 'None',
  unspecified: undefined,
};

const SAME_SITE_IN: Record<PwSameSite, SameSite> = {
  Strict: 'strict',
  Lax: 'lax',
  None: 'no_restriction',
};

// NOTE: partitionKey (CHIPS) is intentionally not represented — the Playwright/Puppeteer cookie
// schemas have no field for it. A partitioned cookie exported here and re-imported into Bokal would
// come back unpartitioned (wider scope); use the native JSON export (toJson) for lossless Bokal↔Bokal
// round-trips of partitioned cookies. Do not "add" partitionKey here without a target-format field.
function toAutomationCookie(c: CookieAttrs): AutomationCookie {
  const out: AutomationCookie = {
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expirationDate !== undefined ? Math.floor(c.expirationDate) : -1,
    httpOnly: c.httpOnly,
    secure: c.secure,
  };
  const ss = SAME_SITE_OUT[c.sameSite];
  if (ss) out.sameSite = ss;
  return out;
}

/** Playwright storageState file: authenticate once, reuse across tests. Cookies only (no localStorage). */
export function toPlaywrightStorageState(cookies: CookieAttrs[]): string {
  return JSON.stringify({ cookies: cookies.map(toAutomationCookie), origins: [] }, null, 2);
}

/** The array Playwright's `context.addCookies(...)` accepts. */
export function toPlaywrightCookies(cookies: CookieAttrs[]): string {
  return JSON.stringify(cookies.map(toAutomationCookie), null, 2);
}

/** The array Puppeteer's `page.setCookie(...)` accepts (same core shape). */
export function toPuppeteerJson(cookies: CookieAttrs[]): string {
  return JSON.stringify(cookies.map(toAutomationCookie), null, 2);
}

function automationToAttrs(raw: unknown): CookieAttrs | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== 'string' || typeof o.domain !== 'string') return null;
  const domain = o.domain;
  const expires = typeof o.expires === 'number' ? o.expires : -1;
  const ss = typeof o.sameSite === 'string' && o.sameSite in SAME_SITE_IN ? SAME_SITE_IN[o.sameSite as PwSameSite] : 'unspecified';
  return {
    name: o.name,
    value: typeof o.value === 'string' ? o.value : '',
    domain,
    path: typeof o.path === 'string' ? o.path : '/',
    secure: o.secure === true,
    httpOnly: o.httpOnly === true,
    sameSite: ss,
    hostOnly: !domain.startsWith('.'),
    expirationDate: expires >= 0 ? expires : undefined,
  };
}

function looksLikeAutomationCookie(item: unknown): boolean {
  // Puppeteer/Playwright cookies carry `expires` (a number) and never `expirationDate`
  // (which is the Cookie-Editor / bokal field). This disambiguates a bare array.
  if (typeof item !== 'object' || item === null) return false;
  const o = item as Record<string, unknown>;
  return typeof o.expires === 'number' && !('expirationDate' in o);
}

/**
 * Recognize Playwright storageState objects and Puppeteer/Playwright cookie arrays.
 * Returns mapped cookies, or null if `data` is not an automation format (so the caller
 * falls through to the normal JSON path — Cookie-Editor arrays, bokal objects, etc.).
 */
export function fromAutomationJson(data: unknown): CookieAttrs[] | null {
  // storageState: { cookies: [...], origins: [...] }
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.cookies) && 'origins' in o) {
      return (o.cookies as unknown[]).map(automationToAttrs).filter((c): c is CookieAttrs => c !== null);
    }
    return null;
  }
  // bare Puppeteer/Playwright cookie array
  if (Array.isArray(data) && data.length > 0 && looksLikeAutomationCookie(data[0])) {
    return data.map(automationToAttrs).filter((c): c is CookieAttrs => c !== null);
  }
  return null;
}
