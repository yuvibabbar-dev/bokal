const ALL_URLS: chrome.permissions.Permissions = { origins: ['<all_urls>'] };

export function hasAllUrlsPermission(): Promise<boolean> {
  return chrome.permissions.contains(ALL_URLS);
}

/** Must run synchronously inside a user gesture — do not await anything before calling this. */
export function requestAllUrls(): Promise<boolean> {
  return chrome.permissions.request(ALL_URLS);
}

// --- Per-site host access -----------------------------------------------------------------------
// Wafer requests host access for just the site the user is on, never <all_urls>, except for the
// genuinely broad features (all-cookies view, all-sites export, cleanup). Per Chrome's cookies API,
// per-origin host permission + "cookies" is sufficient to read/write that origin's cookies.

// Two-label public suffixes where the registrable domain is the last THREE labels. Not the full
// Public Suffix List — a pragmatic heuristic (same class as Cookie-Editor's); a real PSL is exact.
const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'gov.uk', 'ac.uk', 'org.uk', 'me.uk',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au',
  'co.nz', 'co.jp', 'co.kr', 'com.br', 'com.cn', 'co.in', 'co.za', 'com.mx', 'com.tr', 'com.sg',
]);

/** Best-effort registrable domain (eTLD+1) for a hostname. IPs / single labels are returned as-is. */
export function registrableDomain(host: string): string {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host; // IPv4
  const labels = host.split('.');
  if (labels.length <= 2) return host;
  const lastTwo = labels.slice(-2).join('.');
  return MULTI_PART_SUFFIXES.has(lastTwo) ? labels.slice(-3).join('.') : labels.slice(-2).join('.');
}

/** Host-permission match patterns covering the exact host plus the whole registrable domain. */
export function siteOriginPatterns(url: string): string[] {
  let u: URL;
  try { u = new URL(url); } catch { return []; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return [];
  const scheme = u.protocol; // includes the trailing ':'
  return [`${scheme}//${u.hostname}/*`, `${scheme}//*.${registrableDomain(u.hostname)}/*`];
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
