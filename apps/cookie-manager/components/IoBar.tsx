import { useRef, useState } from 'react';
import { useCookiesStore, cookiesStore } from '../stores/cookies-store';
import { toJson, toNetscape } from '../lib/io/export';
import { parseCookiesJson } from '../lib/io/import';
import { downloadText } from '../lib/io/download';
import { toHeaderString, parseHeaderString } from '../lib/io/header';
import { copyText } from '../lib/clipboard';

export function IoBar() {
  const cookies = useCookiesStore((s) => s.cookies);
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
    let cookies = parseCookiesJson(text).cookies;
    let note = '';
    if (cookies.length === 0) {
      let domain = 'example.com';
      try { if (activeUrl) domain = new URL(activeUrl).hostname; } catch { /* keep default */ }
      cookies = parseHeaderString(text, domain);
      note = cookies.length ? ' (as header string)' : '';
    }
    if (cookies.length === 0) { setStatus('Import failed: not valid JSON or a cookie header'); return; }
    const res = await cookiesStore.getState().importCookies(cookies);
    setStatus(`Imported ${res.imported}, failed ${res.failed}${note}`);
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.json`, toJson(cookies, activeUrl ?? undefined))}>Export JSON</button>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.txt`, toNetscape(cookies), 'text/plain')}>Export Netscape</button>
      <button type="button" onClick={() => void copyText(toHeaderString(cookies)).then((ok) => setStatus(ok ? `Copied ${cookies.length} cookies as a header` : 'Copy failed'))}>Copy header</button>
      <button type="button" onClick={() => fileRef.current?.click()}>Import</button>
      <input ref={fileRef} type="file" accept="application/json,.json,.txt,text/plain" onChange={onImportFile} style={{ display: 'none' }} />
      <button type="button" onClick={() => { if (cookies.length && confirm(`Delete all ${cookies.length} cookies shown?`)) void cookiesStore.getState().deleteAllForSite(cookies).then((r) => setStatus(`Deleted ${r.removed}${r.failed ? `, ${r.failed} failed` : ''}`)); }}>Delete all</button>
      {status && <span style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>{status}</span>}
    </div>
  );
}
