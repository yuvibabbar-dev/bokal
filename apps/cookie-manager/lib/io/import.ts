import type { CookieAttrs, SameSite } from '../cookie-types';
import { fromAutomationJson } from './automation';

const SAME_SITES: SameSite[] = ['no_restriction', 'lax', 'strict', 'unspecified'];

export interface ParseResult {
  cookies: CookieAttrs[];
  errors: string[];
}

function parsePartition(raw: unknown): CookieAttrs['partitionKey'] {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.topLevelSite !== 'string') return undefined;
  return {
    topLevelSite: o.topLevelSite,
    hasCrossSiteAncestor: typeof o.hasCrossSiteAncestor === 'boolean' ? o.hasCrossSiteAncestor : undefined,
  };
}

function coerce(raw: unknown, index: number, errors: string[]): CookieAttrs | null {
  if (typeof raw !== 'object' || raw === null) { errors.push(`Entry ${index}: not an object`); return null; }
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== 'string' || o.name === '') { errors.push(`Entry ${index}: missing name`); return null; }
  if (typeof o.domain !== 'string' || o.domain === '') { errors.push(`Entry ${index}: missing domain`); return null; }
  const sameSite: SameSite = SAME_SITES.includes(o.sameSite as SameSite) ? (o.sameSite as SameSite) : 'unspecified';
  return {
    name: o.name,
    value: typeof o.value === 'string' ? o.value : '',
    domain: o.domain,
    path: typeof o.path === 'string' ? o.path : '/',
    secure: o.secure === true,
    httpOnly: o.httpOnly === true,
    sameSite,
    hostOnly: o.hostOnly === true,
    expirationDate: typeof o.expirationDate === 'number' ? o.expirationDate : undefined,
    storeId: typeof o.storeId === 'string' ? o.storeId : undefined,
    partitionKey: parsePartition(o.partitionKey),
  };
}

export function parseCookiesJson(text: string): ParseResult {
  const errors: string[] = [];
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { cookies: [], errors: ['Invalid JSON'] }; }
  // Playwright storageState / Puppeteer-Playwright cookie arrays take priority over the generic
  // path so their capitalized SameSite + `expires` seconds are mapped correctly.
  const automation = fromAutomationJson(data);
  if (automation) return { cookies: automation, errors: [] };
  let arr: unknown;
  if (Array.isArray(data)) arr = data;
  else if (typeof data === 'object' && data !== null && Array.isArray((data as Record<string, unknown>).cookies)) {
    arr = (data as Record<string, unknown>).cookies;
  } else {
    return { cookies: [], errors: ['Expected a cookie array or an object with a "cookies" array'] };
  }
  const cookies: CookieAttrs[] = [];
  (arr as unknown[]).forEach((raw, i) => {
    const c = coerce(raw, i, errors);
    if (c) cookies.push(c);
  });
  return { cookies, errors };
}
