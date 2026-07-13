// Best-effort schemeful "site" for a URL (scheme://host, no port or path).
// NOTE: a CHIPS partition topLevelSite is the registrable site (scheme + eTLD+1).
// Exact eTLD+1 derivation needs the Public Suffix List. lib/cookies/read.ts's
// activePartitionSite() now prefers chrome.cookies.getPartitionKey() (Chrome 130+),
// which returns the browser's real partition key without computing it ourselves,
// and falls back to this heuristic only when that API is unavailable or fails.
// This host-based value drops the port (closer than origin) but does not
// reduce a subdomain (www.example.com) to its apex, so the fallback may under-match there.
export function siteFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}
