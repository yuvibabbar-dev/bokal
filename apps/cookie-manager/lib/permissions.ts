const ALL_URLS: chrome.permissions.Permissions = { origins: ['<all_urls>'] };

export function hasAllUrlsPermission(): Promise<boolean> {
  return chrome.permissions.contains(ALL_URLS);
}

/** Must run synchronously inside a user gesture — do not await anything before calling this. */
export function requestAllUrls(): Promise<boolean> {
  return chrome.permissions.request(ALL_URLS);
}

// --- Per-site host access -----------------------------------------------------------------------
// Bokal requests host access for just the site the user is on, never <all_urls>, except for the
// genuinely broad features (all-cookies view, all-sites export, cleanup). Per Chrome's cookies API,
// per-origin host permission + "cookies" is sufficient to read/write that origin's cookies.

/**
 * Host-permission match patterns covering the exact host plus each parent domain, as EXACT host
 * patterns (`scheme//domain/*`) — deliberately NOT `scheme//*.domain/*`. A `*.` wildcard would
 * over-grant to an entire public suffix (e.g. `*.co.il` covers every .co.il site) because we have
 * no Public Suffix List to know where the registrable domain begins. Walking parents as exact
 * patterns is safe even if we overshoot into a public-suffix level: `co.il/*` grants access only
 * to the (non-registrable, non-navigable) host `co.il`, i.e. nothing real. This still covers the
 * current URL's cookies, which live on the host or one of its parent domains. IPv4/IPv6 hosts have
 * no subdomains, so only the exact host is requested. Returns [] for non-http(s)/unparseable URLs.
 */
export function siteOriginPatterns(url: string): string[] {
  let u: URL;
  try { u = new URL(url); } catch { return []; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return [];
  const scheme = u.protocol; // includes the trailing ':'
  const host = u.hostname.replace(/\.$/, ''); // drop a trailing FQDN dot
  if (!host) return [];
  const patterns = [`${scheme}//${host}/*`];
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':'); // IPv4 or IPv6 literal
  if (!isIp) {
    const labels = host.split('.');
    // parent domains down to (and including) the two-label level; each as an exact host pattern
    for (let i = 1; i <= labels.length - 2; i++) {
      patterns.push(`${scheme}//${labels.slice(i).join('.')}/*`);
    }
  }
  return patterns;
}

export async function hasSiteAccess(url: string): Promise<boolean> {
  const origins = siteOriginPatterns(url);
  if (origins.length === 0) return false;
  return chrome.permissions.contains({ origins });
}

/** Must run synchronously inside a user gesture with the URL already known — no await before it. */
export function requestSiteAccess(url: string): Promise<boolean> {
  const origins = siteOriginPatterns(url);
  if (origins.length === 0) return Promise.resolve(false);
  return chrome.permissions.request({ origins });
}

export function onPermissionsChanged(cb: (granted: boolean) => void): () => void {
  const handler = (): void => {
    void hasAllUrlsPermission().then(cb);
  };
  chrome.permissions.onAdded.addListener(handler);
  chrome.permissions.onRemoved.addListener(handler);
  return () => {
    chrome.permissions.onAdded.removeListener(handler);
    chrome.permissions.onRemoved.removeListener(handler);
  };
}
