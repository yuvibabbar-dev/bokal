import { useRef, useState } from 'react';
import { useCookiesStore, cookiesStore } from '../stores/cookies-store';
import { toJson, toNetscape } from '../lib/io/export';
import { parseCookiesJson } from '../lib/io/import';
import { downloadText } from '../lib/io/download';

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
    const parsed = parseCookiesJson(text);
    if (parsed.cookies.length === 0) {
      setStatus(`Import failed: ${parsed.errors[0] ?? 'no cookies found'}`);
      return;
    }
    const res = await cookiesStore.getState().importCookies(parsed.cookies);
    const parseNote = parsed.errors.length ? ` (${parsed.errors.length} skipped)` : '';
    setStatus(`Imported ${res.imported}, failed ${res.failed}${parseNote}`);
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.json`, toJson(cookies, activeUrl ?? undefined))}>Export JSON</button>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.txt`, toNetscape(cookies), 'text/plain')}>Export Netscape</button>
      <button type="button" onClick={() => fileRef.current?.click()}>Import JSON</button>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} style={{ display: 'none' }} />
      {status && <span style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>{status}</span>}
    </div>
  );
}
