export type SameSite = 'no_restriction' | 'lax' | 'strict' | 'unspecified';

export interface PartitionKey {
  topLevelSite?: string;
  hasCrossSiteAncestor?: boolean;
}

export interface CookieAttrs {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSite;
  /** true = no Domain attribute (locked to the exact host). */
  hostOnly: boolean;
  /** absent = session cookie. */
  expirationDate?: number;
  storeId?: string;
  partitionKey?: PartitionKey;
}
