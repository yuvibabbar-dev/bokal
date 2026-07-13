const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isSecureOrigin(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'http:' && LOOPBACK.has(u.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}
