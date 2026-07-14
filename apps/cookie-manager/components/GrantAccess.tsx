import { useState } from 'react';
import { requestSiteAccess, requestAllUrls, siteOriginPatterns } from '../lib/permissions';

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname; } catch { return null; }
}

// Per-site by default: request access for JUST the active origin. <all_urls> is an explicit opt-in
// (the all-cookies scope, or a fallback when Wafer can't yet read the active site's URL).
export function GrantAccess({ activeUrl, scope, onGrant }: { activeUrl: string | null; scope: 'site' | 'all'; onGrant: () => void }) {
  const host = hostOf(activeUrl);
  // Only offer the per-site path for http(s) sites (siteOriginPatterns is empty otherwise).
  const canGrantSite = !!activeUrl && siteOriginPatterns(activeUrl).length > 0;
  const [error, setError] = useState<string | null>(null);
  // Each request must be called synchronously in the click (URL already known) — no await before it.
  const grant = (p: Promise<boolean>): void => {
    void p.then((g) => { if (g) onGrant(); }).catch(() => setError('Couldn’t request access — try “Allow all sites”.'));
  };
  const allowSite = (): void => { if (activeUrl) grant(requestSiteAccess(activeUrl)); };
  const allowAll = (): void => grant(requestAllUrls());

  const linkStyle = { background: 'none', border: 'none', color: 'var(--wafer-muted)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' as const };

  return (
    <div style={{ padding: 16, font: '13px system-ui' }}>
      <h1 style={{ fontSize: 15, margin: '0 0 8px' }}>Wafer</h1>
      {scope === 'all' ? (
        <>
          <p style={{ margin: '0 0 12px', color: 'var(--wafer-muted)' }}>
            The all-cookies view needs access to every site. Nothing is requested until you allow it.
          </p>
          <button type="button" onClick={allowAll} style={{ padding: '6px 12px', cursor: 'pointer' }}>Allow all sites</button>
        </>
      ) : canGrantSite ? (
        <>
          <p style={{ margin: '0 0 12px', color: 'var(--wafer-muted)' }}>
            Allow Wafer to read and edit cookies for <b>{host}</b> — just this site, nothing else.
          </p>
          <button type="button" onClick={allowSite} style={{ padding: '6px 12px', cursor: 'pointer' }}>Allow cookies for {host}</button>
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={allowAll} style={linkStyle}>Allow all sites instead</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 12px', color: 'var(--wafer-muted)' }}>
            Open Wafer from the toolbar icon on the site you want to manage, or allow access to all sites.
          </p>
          <button type="button" onClick={allowAll} style={{ padding: '6px 12px', cursor: 'pointer' }}>Allow all sites</button>
        </>
      )}
      {error && <p style={{ marginTop: 8, fontSize: 12, color: 'var(--wafer-accent)' }}>{error}</p>}
      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--wafer-muted)' }}>
        Wafer lives in the side panel — click the toolbar icon any time to open it here.
      </p>
    </div>
  );
}
