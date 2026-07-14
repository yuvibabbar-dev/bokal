import { useState } from 'react';
import { useRules, rulesStore } from '../stores/rules-store';

export function BlockRules() {
  const blocked = useRules((s) => s.rules.blockedDomains);
  const [input, setInput] = useState('');

  function add() {
    const d = input.trim();
    if (!d) return;
    void rulesStore.getState().addBlock(d);
    setInput('');
  }

  return (
    <details style={{ marginTop: 8, fontSize: 12 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--bokal-muted)' }}>Blocked domains ({blocked.length})</summary>
      <div style={{ padding: '6px 2px' }}>
        <p style={{ margin: '0 0 6px', color: 'var(--bokal-muted)' }}>
          Bokal deletes cookies from these domains as soon as a site sets them. This is reactive
          cleanup (set-then-removed), not network-level blocking.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="e.g. doubleclick.net"
            aria-label="Domain to block"
            style={{ flex: 1, fontSize: 12 }}
          />
          <button type="button" onClick={add}>Block</button>
        </div>
        {blocked.length === 0 ? (
          <div style={{ color: 'var(--bokal-muted)' }}>No blocked domains.</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {blocked.map((d) => (
              <li key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>{d}</span>
                <button type="button" aria-label={`Unblock ${d}`} title="Unblock" onClick={() => void rulesStore.getState().removeBlock(d)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
