import type { CookieAttrs } from '../lib/cookie-types';
import { copyText } from '../lib/clipboard';
import { auditCookie } from '../lib/audit';

export function CookieRow({
  cookie,
  onEdit,
  onDelete,
  pinned,
  locked,
  onTogglePin,
  onToggleProtect,
}: {
  cookie: CookieAttrs;
  onEdit?: (c: CookieAttrs) => void;
  onDelete?: (c: CookieAttrs) => void;
  pinned?: boolean;
  locked?: boolean; // protected from deletion
  onTogglePin?: (c: CookieAttrs) => void;
  onToggleProtect?: (c: CookieAttrs) => void;
}) {
  const flags = auditCookie(cookie);
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
          {flags.length > 0 && (
            <span title={flags.map((f) => f.message).join('\n')} aria-label={`${flags.length} audit note${flags.length > 1 ? 's' : ''}`} style={{ fontSize: 10, color: 'var(--wafer-muted)', marginLeft: 4 }}>⚠</span>
          )}
        </div>
        {/* value is attacker-controlled → text node only, never HTML */}
        <div style={{ color: 'var(--wafer-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cookie.value}</div>
      </button>
      {onTogglePin && (
        <button type="button" aria-label={pinned ? `Unpin ${cookie.name}` : `Pin ${cookie.name} to top`} title={pinned ? 'Unpin' : 'Pin to top'} onClick={() => onTogglePin(cookie)} style={{ flexShrink: 0, opacity: pinned ? 1 : 0.4 }}>📌</button>
      )}
      {onToggleProtect && (
        <button type="button" aria-label={locked ? `Unprotect ${cookie.name}` : `Protect ${cookie.name} from deletion`} title={locked ? 'Protected — click to unprotect' : 'Protect from deletion'} onClick={() => onToggleProtect(cookie)} style={{ flexShrink: 0, opacity: locked ? 1 : 0.4 }}>{locked ? '🔒' : '🔓'}</button>
      )}
      <button type="button" aria-label={`Copy value of ${cookie.name}`} title="Copy value" onClick={() => void copyText(cookie.value)} style={{ flexShrink: 0 }}>⧉</button>
      <button type="button" aria-label={`Delete ${cookie.name}`} title={locked ? 'Protected — unprotect to delete' : 'Delete'} disabled={locked} onClick={() => onDelete?.(cookie)} style={{ flexShrink: 0, opacity: locked ? 0.3 : 1, cursor: locked ? 'not-allowed' : 'pointer' }}>✕</button>
    </div>
  );
}
