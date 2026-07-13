import { useEffect, useState } from 'react';
import { useProfiles, profilesStore } from '../../stores/profiles-store';

export function ProfilesPanel() {
  const profiles = useProfiles((s) => s.profiles);
  const busy = useProfiles((s) => s.busy);
  const error = useProfiles((s) => s.error);
  const [name, setName] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [pass, setPass] = useState('');

  useEffect(() => {
    void profilesStore.getState().load();
  }, []);

  async function onSave() {
    if (!name.trim()) return;
    await profilesStore.getState().save(name.trim(), encrypt ? pass : undefined);
    setName('');
    setPass('');
  }

  async function onApply(id: string, encrypted: boolean) {
    const passphrase = encrypted ? (prompt('Passphrase to decrypt this profile:') ?? undefined) : undefined;
    if (encrypted && !passphrase) return;
    const res = await profilesStore.getState().apply(id, passphrase);
    if (res) alert(`Applied ${res.applied} cookies${res.failed ? `, ${res.failed} failed` : ''}.`);
  }

  return (
    <div style={{ padding: 12, font: '13px system-ui', borderTop: '1px solid var(--wafer-border)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Cookie profiles (Pro)</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" />
        <label style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>
          <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} /> Encrypt
        </label>
        {encrypt && <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passphrase" />}
        <button type="button" disabled={busy || !name.trim() || (encrypt && !pass)} onClick={() => void onSave()}>
          Save current cookies
        </button>
      </div>
      {error && <div style={{ color: 'var(--wafer-danger)', fontSize: 12 }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {profiles.map((p) => (
          <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--wafer-border)' }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}{p.encrypted ? ' 🔒' : ''}
            </span>
            <button type="button" onClick={() => void onApply(p.id, p.encrypted)}>Apply</button>
            <button type="button" onClick={() => void profilesStore.getState().remove(p.id)}>✕</button>
          </li>
        ))}
      </ul>
      {profiles.length === 0 && <div style={{ color: 'var(--wafer-muted)', fontSize: 12 }}>No profiles yet.</div>}
    </div>
  );
}
