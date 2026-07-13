import { useState } from 'react';
import type { CookieAttrs, SameSite } from '../lib/cookie-types';
import { validateCookie } from '../lib/cookies/validation';
import { isSecureOrigin } from '../lib/origin';
import { cookieUrl } from '../lib/cookies/keys';
import { cookiesStore } from '../stores/cookies-store';

const SAME_SITE: SameSite[] = ['unspecified', 'lax', 'strict', 'no_restriction'];

// datetime-local <-> epoch seconds
function toLocalInput(epochSeconds?: number): string {
  if (epochSeconds === undefined) return '';
  const d = new Date(epochSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): number | undefined {
  if (!v) return undefined;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
}

const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 };
const labelStyle: React.CSSProperties = { fontSize: 11, color: '#666' };

export function CookieEditor({ initial, original, activeUrl, onDone }: { initial: CookieAttrs; original: CookieAttrs | null; activeUrl: string | null; onDone: () => void }) {
  const [draft, setDraft] = useState<CookieAttrs>(initial);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const secureOrigin = isSecureOrigin(cookieUrl(draft));
  const issues = validateCookie(draft, { isSecureOrigin: secureOrigin });
  const isSession = draft.expirationDate === undefined;

  function update<K extends keyof CookieAttrs>(k: K, v: CookieAttrs[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function onSave() {
    setSaveError(null);
    setBusy(true);
    const res = await cookiesStore.getState().saveCookie(draft, original ?? undefined);
    setBusy(false);
    if (res.ok) onDone();
    else setSaveError(res.error ?? 'Failed to save');
  }

  return (
    <div style={{ padding: 12, font: '13px system-ui' }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Name</label>
        <input value={draft.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Value</label>
        <textarea rows={3} value={draft.value} onChange={(e) => update('value', e.target.value)} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Domain</label>
        <input value={draft.domain} disabled={draft.hostOnly} onChange={(e) => update('domain', e.target.value)} />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Path</label>
        <input value={draft.path} onChange={(e) => update('path', e.target.value)} />
      </div>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input type="checkbox" checked={draft.hostOnly} onChange={(e) => update('hostOnly', e.target.checked)} /> Host-only (no Domain attribute)
      </label>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input type="checkbox" checked={draft.secure} onChange={(e) => update('secure', e.target.checked)} /> Secure
      </label>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input type="checkbox" checked={draft.httpOnly} onChange={(e) => update('httpOnly', e.target.checked)} /> HttpOnly
      </label>
      <div style={rowStyle}>
        <label style={labelStyle}>SameSite</label>
        <select value={draft.sameSite} onChange={(e) => update('sameSite', e.target.value as SameSite)}>
          {SAME_SITE.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>
      <label style={{ display: 'block', marginBottom: 4 }}>
        <input
          type="checkbox"
          checked={isSession}
          onChange={(e) => update('expirationDate', e.target.checked ? undefined : Math.floor(Date.now() / 1000) + 86400)}
        /> Session cookie (expires when browser closes)
      </label>
      {!isSession && (
        <div style={rowStyle}>
          <label style={labelStyle}>Expires</label>
          <input type="datetime-local" value={toLocalInput(draft.expirationDate)} onChange={(e) => update('expirationDate', fromLocalInput(e.target.value))} />
        </div>
      )}

      {issues.length > 0 && (
        <ul style={{ color: '#b00', fontSize: 12, margin: '8px 0', paddingLeft: 18 }}>
          {issues.map((i) => (<li key={`${i.field}:${i.message}`}>{i.message}</li>))}
        </ul>
      )}
      {saveError && <div style={{ color: '#b00', fontSize: 12, margin: '4px 0' }}>{saveError}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" disabled={issues.length > 0 || busy} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
