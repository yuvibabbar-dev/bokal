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
  try {
    // partitionKey:{} returns partitioned AND unpartitioned cookies (Chrome 119+);
    // getAll({}) alone silently omits CHIPS cookies. See MDN cookies.getAll.
    const cookies = await chrome.cookies.getAll({ partitionKey: {} });
    return cookies.map(fromChrome);
  } catch {
    // Chrome 114–118 floor: the partitionKey filter isn't supported — unpartitioned only.
    const cookies = await chrome.cookies.getAll({});
    return cookies.map(fromChrome);
  }
}

async function activePartitionSite(fallbackUrl: string): Promise<string | null> {
  const api = chrome.cookies as {
    getPartitionKey?: (d: { tabId: number; frameId: number }) => Promise<{ partitionKey: { topLevelSite?: string } }>;
  };
  if (typeof api.getPartitionKey === 'function') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id !== undefined) {
        const { partitionKey } = await api.getPartitionKey({ tabId: tab.id, frameId: 0 });
        if (partitionKey?.topLevelSite) return partitionKey.topLevelSite;
      }
    } catch {
      /* fall through to heuristic */
    }
  }
  return siteFromUrl(fallbackUrl);
}

export async function getPartitionedCookiesForUrl(url: string): Promise<CookieAttrs[]> {
  const site = await activePartitionSite(url);
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
