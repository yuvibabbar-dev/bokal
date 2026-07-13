import { useEffect, useState } from 'react';
import { useProfiles, profilesStore } from '../../stores/profiles-store';

export function ProfilesPanel() {
  const profiles = useProfiles((s) => s.profiles);
  const busy = useProfiles((s) => s.busy);
  const error = useProfiles((s) => s.error);
  const [name, setName] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [pass, setPass] = useState('');
  const [applyReplace, setApplyReplace] = useState(true);
  const [applyPass, setApplyPass] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void profilesStore.getState().load();
  }, []);

  async function onSave() {
    if (!name.trim()) return;
    await profilesStore.getState().save(name.trim(), encrypt ? pass : undefined);
    setName('');
    setPass('');
  }

  async function doApply(id: string, encrypted: boolean) {
    const res = await profilesStore.getState().apply(id, { passphrase: encrypted ? applyPass : undefined, replace: applyReplace });
    setApplyingId(null);
    setApplyPass('');
    if (res.applied || res.failed || res.removed) {
      setNotice(`Applied ${res.applied}${res.removed ? `, replaced ${res.removed}` : ''}${res.failed ? `, ${res.failed} failed` : ''}.`);
    }
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
      {!encrypt && (
        <div style={{ fontSize: 11, color: 'var(--wafer-muted)', marginBottom: 6 }}>
          ⚠ Saved unencrypted — cookie values are readable on this device. Enable Encrypt for auth/session cookies.
        </div>
      )}
      <label style={{ fontSize: 11, color: 'var(--wafer-muted)', display: 'block', marginBottom: 6 }}>
        <input type="checkbox" checked={applyReplace} onChange={(e) => setApplyReplace(e.target.checked)} /> Apply replaces (clears the site's current cookies first)
      </label>
      {error && <div style={{ color: 'var(--wafer-danger)', fontSize: 12 }}>{error}</div>}
      {notice && <div style={{ color: 'var(--wafer-muted)', fontSize: 12 }}>{notice}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {profiles.map((p) => (
          <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--wafer-border)' }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}{p.encrypted ? ' 🔒' : ''}
            </span>
            {p.encrypted && applyingId === p.id ? (
              <>
                <input
                  type="password"
                  value={applyPass}
                  onChange={(e) => setApplyPass(e.target.value)}
                  placeholder="Passphrase"
                  style={{ width: 100 }}
                />
                <button type="button" disabled={busy || !applyPass} onClick={() => void doApply(p.id, true)}>
                  Apply
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => (p.encrypted ? setApplyingId(p.id) : void doApply(p.id, false))}
              >
                Apply
              </button>
            )}
            <button type="button" onClick={() => void profilesStore.getState().remove(p.id)}>✕</button>
          </li>
        ))}
      </ul>
      {profiles.length === 0 && <div style={{ color: 'var(--wafer-muted)', fontSize: 12 }}>No profiles yet.</div>}
    </div>
  );
}
