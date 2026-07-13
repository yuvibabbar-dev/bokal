// Best-effort schemeful "site" for a URL (scheme://host, no port or path).
// NOTE: a CHIPS partition topLevelSite is the registrable site (scheme + eTLD+1).
// Exact eTLD+1 derivation needs the Public Suffix List, and chrome.cookies.getPartitionKey()
// (Chrome 130+) returns the browser's real partition key without computing it ourselves.
// Both require a real browser to validate, so exact partition matching is deferred to the
// M5 Playwright E2E. This host-based value drops the port (closer than origin) but does not
// reduce a subdomain (www.example.com) to its apex, so the inspector may under-match there.
export function siteFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}
