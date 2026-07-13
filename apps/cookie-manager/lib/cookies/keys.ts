import type { CookieAttrs } from '../cookie-types';

export function cookieUrl(c: Pick<CookieAttrs, 'domain' | 'path' | 'secure'>): string {
  const host = c.domain.replace(/^\./, '');
  return `${c.secure ? 'https' : 'http'}://${host}${c.path}`;
}

export function cookieId(
  c: Pick<CookieAttrs, 'name' | 'domain' | 'path' | 'storeId' | 'partitionKey' | 'hostOnly'>,
): string {
  const store = c.storeId ?? '0';
  const top = c.partitionKey?.topLevelSite ?? '';
  const anc = String(c.partitionKey?.hasCrossSiteAncestor);
  return [store, top, anc, c.domain, c.path, c.name, String(c.hostOnly)].map(encodeURIComponent).join('|');
}
