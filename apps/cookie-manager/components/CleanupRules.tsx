import { useState } from 'react';
import { useRules, rulesStore } from '../stores/rules-store';
import { cookiesStore } from '../stores/cookies-store';

export function CleanupRules() {
  const keep = useRules((s) => s.rules.keepDomains);
  const autoSweep = useRules((s) => s.rules.autoSweep);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  function add() {
    const d = input.trim();
    if (!d) return;
    void rulesStore.getState().addKeep(d);
    setInput('');
  }

  function cleanNow() {
    if (!confirm('Delete all cookies except your keep-list? Protected cookies are always kept.')) return;
    void cookiesStore.getState().cleanupNow().then((r) => setStatus(`Removed ${r.removed}${r.failed ? `, ${r.failed} failed` : ''}`));
  }

  return (
    <details style={{ marginTop: 8, fontSize: 12 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--wafer-muted)' }}>Cleanup — keep-list ({keep.length})</summary>
      <div style={{ padding: '6px 2px' }}>
        <p style={{ margin: '0 0 6px', color: 'var(--wafer-muted)' }}>
          "Clean now" deletes every cookie except the domains below (protected cookies are always
          kept). Auto-sweep repeats this once a day while your browser is open — Wafer has no "tabs"
          permission, so it can't clear cookies the moment you close a tab.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="Keep cookies for… e.g. github.com"
            aria-label="Domain to keep"
            style={{ flex: 1, fontSize: 12 }}
          />
          <button type="button" onClick={add}>Keep</button>
        </div>
        {keep.length === 0 ? (
          <div style={{ color: 'var(--wafer-muted)', marginBottom: 6 }}>No keep-list — "Clean now" would remove everything unprotected.</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: '0 0 6px', padding: 0 }}>
            {keep.map((d) => (
              <li key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>{d}</span>
                <button type="button" aria-label={`Remove ${d} from keep-list`} title="Remove" onClick={() => void rulesStore.getState().removeKeep(d)}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={cleanNow}>Clean now</button>
          <label style={{ color: 'var(--wafer-muted)' }}>
            <input type="checkbox" checked={autoSweep} onChange={(e) => void rulesStore.getState().setAutoSweep(e.target.checked)} /> Auto-sweep daily
          </label>
          {status && <span style={{ color: 'var(--wafer-muted)' }}>{status}</span>}
        </div>
        {autoSweep && keep.length === 0 && (
          <div style={{ color: 'var(--wafer-accent)', marginTop: 4 }}>Add at least one keep-domain — auto-sweep won't run with an empty keep-list (it would wipe everything).</div>
        )}
      </div>
    </details>
  );
}
