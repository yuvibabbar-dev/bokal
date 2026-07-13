import { useRef, useState } from 'react';
import { useCookiesStore, cookiesStore } from '../stores/cookies-store';
import { toJson, toNetscape } from '../lib/io/export';
import { parseCookiesJson } from '../lib/io/import';
import { downloadText } from '../lib/io/download';
import { toHeaderString, parseHeaderString } from '../lib/io/header';
import { copyText } from '../lib/clipboard';
import type { CookieAttrs } from '../lib/cookie-types';

// `cookies` is the list currently SHOWN (search-filtered) — so export/copy/delete-all act on
// exactly what the user sees, and the "Delete all N shown" confirmation is accurate.
export function IoBar({ cookies, scope }: { cookies: CookieAttrs[]; scope: 'site' | 'all' }) {
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  function hostSlug(): string {
    try { return activeUrl ? new URL(activeUrl).hostname : 'cookies'; } catch { return 'cookies'; }
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    let toImport = parseCookiesJson(text).cookies;
    let note = '';
    if (toImport.length === 0) {
      let domain = 'example.com';
      try { if (activeUrl) domain = new URL(activeUrl).hostname; } catch { /* keep default */ }
      toImport = parseHeaderString(text, domain);
      note = toImport.length ? ' (as header string)' : '';
    }
    if (toImport.length === 0) { setStatus('Import failed: not valid JSON or a cookie header'); return; }
    const res = await cookiesStore.getState().importCookies(toImport);
    setStatus(`Imported ${res.imported}, failed ${res.failed}${note}`);
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.json`, toJson(cookies, activeUrl ?? undefined))}>Export JSON</button>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.txt`, toNetscape(cookies), 'text/plain')}>Export Netscape</button>
      <button type="button" onClick={() => void copyText(toHeaderString(cookies)).then((ok) => setStatus(ok ? `Copied ${cookies.length} cookies as a header` : 'Copy failed'))}>Copy header</button>
      <button type="button" onClick={() => fileRef.current?.click()}>Import</button>
      <input ref={fileRef} type="file" accept="application/json,.json,.txt,text/plain" onChange={onImportFile} style={{ display: 'none' }} />
      <button type="button" onClick={() => { if (cookies.length && confirm(scope === 'all' ? `Delete all ${cookies.length} cookies across ALL sites? This cannot be undone.` : `Delete all ${cookies.length} cookies shown?`)) void cookiesStore.getState().deleteAllForSite(cookies).then((r) => setStatus(`Deleted ${r.removed}${r.failed ? `, ${r.failed} failed` : ''}`)); }}>Delete all</button>
      {status && <span style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>{status}</span>}
    </div>
  );
}
