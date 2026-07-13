import type { CookieAttrs } from '../cookie-types';

export const NAME_VALUE_MAX = 4096;
export const ATTR_VALUE_MAX = 1024;
export const SOFT_DOMAIN_COOKIE_WARN = 180;

export interface ValidationIssue {
  field: keyof CookieAttrs;
  message: string;
}

const byteLen = (s: string): number => new TextEncoder().encode(s).length;

export function validateCookie(c: CookieAttrs, ctx: { isSecureOrigin: boolean }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (byteLen(c.name) + byteLen(c.value) > NAME_VALUE_MAX) {
    issues.push({ field: 'value', message: `name + value exceeds ${NAME_VALUE_MAX} bytes` });
  }

  if (byteLen(c.domain) > ATTR_VALUE_MAX) issues.push({ field: 'domain', message: `domain exceeds ${ATTR_VALUE_MAX} bytes` });
  if (byteLen(c.path) > ATTR_VALUE_MAX) issues.push({ field: 'path', message: `path exceeds ${ATTR_VALUE_MAX} bytes` });

  if (c.name.trim() === '') {
    issues.push({ field: 'name', message: 'Name is required' });
  }

  if (c.name.startsWith('__Secure-')) {
    if (!c.secure) issues.push({ field: 'secure', message: '__Secure- cookies must be Secure' });
    if (!ctx.isSecureOrigin) issues.push({ field: 'name', message: '__Secure- requires an HTTPS origin' });
  }

  if (c.name.startsWith('__Host-')) {
    if (!c.secure) issues.push({ field: 'secure', message: '__Host- cookies must be Secure' });
    if (c.path !== '/') issues.push({ field: 'path', message: '__Host- cookies must have Path=/' });
    if (!c.hostOnly) issues.push({ field: 'domain', message: '__Host- cookies must not set a Domain' });
  }

  if (c.sameSite === 'no_restriction' && !c.secure) {
    issues.push({ field: 'sameSite', message: 'SameSite=None requires Secure' });
  }

  return issues;
}

export interface ImportInvalid {
  cookie: CookieAttrs;
  message: string;
}

/**
 * Split a batch of to-be-imported cookies into those that pass validation and those that don't.
 * A cookie's own `secure` flag is used as the secure-origin signal (an import targeting an https
 * cookie is treated as a secure origin), so `__Secure-`/`__Host-` rules are enforced pre-write.
 */
export function validateForImport(cookies: CookieAttrs[]): { valid: CookieAttrs[]; invalid: ImportInvalid[] } {
  const valid: CookieAttrs[] = [];
  const invalid: ImportInvalid[] = [];
  for (const c of cookies) {
    const issues = validateCookie(c, { isSecureOrigin: c.secure });
    if (issues.length) invalid.push({ cookie: c, message: issues.map((i) => i.message).join('; ') });
    else valid.push(c);
  }
  return { valid, invalid };
}
