import { useRef, useState } from 'react';
import { useCookiesStore, cookiesStore } from '../stores/cookies-store';
import { toJson, toNetscape } from '../lib/io/export';
import { toPlaywrightStorageState, toPuppeteerJson, toPlaywrightCookies } from '../lib/io/automation';
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
    if (scope === 'all') return 'all-sites';
    try { return activeUrl ? new URL(activeUrl).hostname : 'cookies'; } catch { return 'cookies'; }
  }

  function onAutomationExport(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    e.target.value = '';
    const slug = hostSlug();
    if (v === 'pw-state') {
      downloadText(`${slug}-storageState.json`, toPlaywrightStorageState(cookies));
      setStatus('Exported Playwright storageState — cookies only (no localStorage)');
    } else if (v === 'pptr') {
      downloadText(`${slug}-cookies.puppeteer.json`, toPuppeteerJson(cookies));
      setStatus('Exported Puppeteer cookies — cookies only (no localStorage)');
    } else if (v === 'pw-cookies') {
      downloadText(`${slug}-cookies.playwright.json`, toPlaywrightCookies(cookies));
      setStatus('Exported Playwright addCookies — cookies only (no localStorage)');
    }
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const parsed = parseCookiesJson(text);
    let toImport = parsed.cookies;
    let note = '';
    if (toImport.length === 0) {
      let domain = 'example.com';
      try { if (activeUrl) domain = new URL(activeUrl).hostname; } catch { /* keep default */ }
      toImport = parseHeaderString(text, domain);
      note = toImport.length ? ' (as header string)' : '';
    }
    if (toImport.length === 0) {
      setStatus(`Import failed: ${parsed.errors[0] ?? 'not valid JSON or a cookie header'}`);
      return;
    }
    // Importing while viewing "All cookies" writes across many domains — confirm the blast radius.
    if (scope === 'all' && !confirm(`Import ${toImport.length} cookies? They will be written to their own domains across all sites.`)) return;
    const res = await cookiesStore.getState().importCookies(toImport);
    if (res.failed > 0) {
      const more = res.errors.length > 1 ? ` (+${res.errors.length - 1} more)` : '';
      setStatus(`Imported ${res.imported}, failed ${res.failed}${note} — ${res.errors[0] ?? ''}${more}`);
    } else {
      setStatus(`Imported ${res.imported}${note}`);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.json`, toJson(cookies, activeUrl ?? undefined))}>Export JSON</button>
      <button type="button" onClick={() => downloadText(`${hostSlug()}-cookies.txt`, toNetscape(cookies), 'text/plain')}>Export Netscape</button>
      <button type="button" onClick={() => void copyText(toHeaderString(cookies)).then((ok) => setStatus(ok ? `Copied ${cookies.length} cookies as a header` : 'Copy failed'))}>Copy header</button>
      <select aria-label="Export for automation" defaultValue="" onChange={onAutomationExport} title="Export cookies for Playwright or Puppeteer (cookies only — no localStorage)" style={{ fontSize: 11 }}>
        <option value="" disabled>Export for…</option>
        <option value="pw-state">Playwright storageState</option>
        <option value="pw-cookies">Playwright addCookies</option>
        <option value="pptr">Puppeteer</option>
      </select>
      <button type="button" onClick={() => fileRef.current?.click()}>Import</button>
      <input ref={fileRef} type="file" accept="application/json,.json,.txt,text/plain" onChange={onImportFile} style={{ display: 'none' }} />
      <button type="button" onClick={() => { if (cookies.length && confirm(scope === 'all' ? `Delete all ${cookies.length} cookies across ALL sites? This cannot be undone.` : `Delete all ${cookies.length} cookies shown?`)) void cookiesStore.getState().deleteAllForSite(cookies).then((r) => setStatus(`Deleted ${r.removed}${r.failed ? `, ${r.failed} failed` : ''}`)); }}>Delete all</button>
      {status && <span style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>{status}</span>}
    </div>
  );
}
