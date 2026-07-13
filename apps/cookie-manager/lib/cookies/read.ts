import type { CookieAttrs, SameSite } from '../cookie-types';
import { siteFromUrl } from '../site';

export function fromChrome(c: chrome.cookies.Cookie): CookieAttrs {
  return {
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: (c.sameSite ?? 'unspecified') as SameSite,
    hostOnly: c.hostOnly,
    expirationDate: c.expirationDate,
    storeId: c.storeId,
    partitionKey: c.partitionKey
      ? { topLevelSite: c.partitionKey.topLevelSite, hasCrossSiteAncestor: c.partitionKey.hasCrossSiteAncestor }
      : undefined,
  };
}

export async function getCookiesForUrl(url: string): Promise<CookieAttrs[]> {
  const cookies = await chrome.cookies.getAll({ url });
  return cookies.map(fromChrome);
}

export async function getAllCookies(): Promise<CookieAttrs[]> {
  const cookies = await chrome.cookies.getAll({});
  return cookies.map(fromChrome);
}

export async function getPartitionedCookiesForUrl(url: string): Promise<CookieAttrs[]> {
  const site = siteFromUrl(url);
  if (!site) return [];
  try {
    const cookies = await chrome.cookies.getAll({ url, partitionKey: { topLevelSite: site } });
    return cookies.map(fromChrome);
  } catch {
    return [];
  }
}

export async function getActiveTabUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  // tab.url is present only once <all_urls> host permission is granted (we don't declare "tabs").
  return tab?.url ?? null;
}
