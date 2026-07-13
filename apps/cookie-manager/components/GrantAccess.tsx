import { requestAllUrls } from '../lib/permissions';

export function GrantAccess({ onGrant }: { onGrant: () => void }) {
  // requestAllUrls() is called synchronously in the click handler — no await before it.
  const handleClick = (): void => {
    void requestAllUrls().then((granted) => {
      if (granted) onGrant();
    });
  };
  return (
    <div style={{ padding: 16, font: '13px system-ui' }}>
      <h1 style={{ fontSize: 15, margin: '0 0 8px' }}>Wafer</h1>
      <p style={{ margin: '0 0 12px', color: 'var(--wafer-muted)' }}>
        Grant access to read cookies for this site. Wafer requests no site access until you allow it.
      </p>
      <button type="button" onClick={handleClick} style={{ padding: '6px 12px', cursor: 'pointer' }}>
        Grant access
      </button>
    </div>
  );
}
