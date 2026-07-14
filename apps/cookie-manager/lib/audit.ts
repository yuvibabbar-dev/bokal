import type { CookieAttrs } from './cookie-types';
import { NAME_VALUE_MAX } from './cookies/validation';

export interface AuditFlag {
  level: 'info' | 'warn';
  message: string;
}

const encoder = new TextEncoder();
const byteLen = (s: string): number => encoder.encode(s).length;

// Attribute-only hints derived from the cookie itself (no network knowledge). A lightweight
// "what might bite you" aid for developers, not a security verdict.
export function auditCookie(c: CookieAttrs): AuditFlag[] {
  const flags: AuditFlag[] = [];

  if (c.sameSite === 'unspecified') {
    flags.push({ level: 'warn', message: 'No SameSite attribute (Chrome treats it as Lax).' });
  }
  if (c.sameSite === 'no_restriction' && !c.partitionKey) {
    flags.push({ level: 'warn', message: 'Cross-site (SameSite=None) but not partitioned (CHIPS).' });
  }
  if (!c.secure) {
    flags.push({ level: 'info', message: 'Not marked Secure (can be sent over HTTP).' });
  }
  if (byteLen(c.name) + byteLen(c.value) >= NAME_VALUE_MAX * 0.8) {
    flags.push({ level: 'info', message: 'Large cookie (near the 4096-byte limit).' });
  }

  return flags;
}
