import type { CookieAttrs } from '../cookie-types';
import type { EncryptedBlob } from './crypto';

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  site?: string;
  encrypted: boolean;
  cookies?: CookieAttrs[]; // present when not encrypted
  blob?: EncryptedBlob; // present when encrypted
}
