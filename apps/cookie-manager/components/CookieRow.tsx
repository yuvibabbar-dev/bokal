import type { CookieAttrs } from '../lib/cookie-types';

export function CookieRow({
  cookie,
  onEdit,
  onDelete,
}: {
  cookie: CookieAttrs;
  onEdit?: (c: CookieAttrs) => void;
  onDelete?: (c: CookieAttrs) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderBottom: '1px solid var(--wafer-border)' }}>
      <button
        type="button"
        onClick={() => onEdit?.(cookie)}
        style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
      >
        <div style={{ fontWeight: 600 }}>
          {cookie.name}
          {cookie.partitionKey?.topLevelSite && (
            <span title={`Partitioned: ${cookie.partitionKey.topLevelSite}`} style={{ fontSize: 10, color: 'var(--wafer-accent)', border: '1px solid var(--wafer-border)', borderRadius: 3, padding: '0 3px', marginLeft: 4 }}>CHIPS</span>
          )}
        </div>
        {/* value is attacker-controlled → text node only, never HTML */}
        <div style={{ color: 'var(--wafer-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cookie.value}</div>
      </button>
      <button type="button" aria-label={`Delete ${cookie.name}`} title="Delete" onClick={() => onDelete?.(cookie)} style={{ flexShrink: 0 }}>✕</button>
    </div>
  );
}
