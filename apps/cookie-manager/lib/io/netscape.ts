import type { CookieAttrs } from '../cookie-types';
import type { ParseResult } from './import';

// curl and Python's MozillaCookieJar mark HttpOnly cookies by prefixing the domain field with
// "#HttpOnly_", which a strict reader would otherwise drop as a comment; yt-dlp, youtube-dl and
// Go's cookiestxt read it too. Case-sensitive everywhere. ./export emits it, so keep it exported.
export const HTTPONLY_PREFIX = '#HttpOnly_';

// Parse a Netscape cookies.txt file — the mirror of toNetscape in ./export.
//
//   domain \t includeSubdomains \t path \t secure \t expiry \t name \t value
//
// Lines with no tab at all are not records and are ignored silently, so this is safe to run
// speculatively on arbitrary text; lines that ARE tab-separated but malformed are reported.
export function parseNetscape(text: string): ParseResult {
  const cookies: CookieAttrs[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let httpOnly = false;
    let record = line;
    if (record.startsWith(HTTPONLY_PREFIX)) {
      httpOnly = true;
      record = record.slice(HTTPONLY_PREFIX.length);
    } else if (record.startsWith('#')) {
      return;
    }
    if (!record.includes('\t')) return;
    const fields = record.split('\t');
    if (fields.length === 6) fields.push('');
    if (fields.length !== 7) { errors.push(`Line ${i + 1}: expected 7 tab-separated fields, got ${fields.length}`); return; }
    const [domain, includeSub, path, secure, expiryRaw, name, value] = fields as [string, string, string, string, string, string, string];
    if (!name) { errors.push(`Line ${i + 1}: missing name`); return; }
    if (!domain) { errors.push(`Line ${i + 1}: missing domain`); return; }
    const expiry = Number(expiryRaw);
    if (!Number.isFinite(expiry)) { errors.push(`Line ${i + 1}: expiry "${expiryRaw}" is not a number`); return; }
    cookies.push({
      name,
      value,
      domain,
      path: path || '/',
      secure: secure.toUpperCase() === 'TRUE',
      httpOnly,
      sameSite: 'unspecified',
      hostOnly: !domain.startsWith('.') && includeSub.toUpperCase() !== 'TRUE',
      expirationDate: expiry > 0 ? expiry : undefined,
    });
  });
  return { cookies, errors };
}
