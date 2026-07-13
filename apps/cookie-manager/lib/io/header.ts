import type { CookieAttrs } from '../cookie-types';

// "name=value; name2=value2" — no attributes, order preserved.
export function toHeaderString(cookies: Pick<CookieAttrs, 'name' | 'value'>[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

// Parse a Cookie header (or a raw "a=b; c=d" string) into cookies scoped to `domain`.
export function parseHeaderString(text: string, domain: string): CookieAttrs[] {
  const body = text.replace(/^\s*cookie\s*:/i, '').trim();
  const out: CookieAttrs[] = [];
  for (const part of body.split(';')) {
    const seg = part.trim();
    if (!seg) continue;
    const eq = seg.indexOf('=');
    if (eq <= 0) continue;
    const name = seg.slice(0, eq).trim();
    const value = seg.slice(eq + 1).trim();
    if (!name) continue;
    out.push({ name, value, domain, path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false });
  }
  return out;
}
