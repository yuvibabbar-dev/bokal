import { useEffect, useState } from 'react';
import { GrantAccess } from '../../components/GrantAccess';
import { CookieList } from '../../components/CookieList';
import { SearchBar } from '../../components/SearchBar';
import { CookieEditor } from '../../components/CookieEditor';
import { IoBar } from '../../components/IoBar';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useCookiesStore, cookiesStore, hydrateFromStorage } from '../../stores/cookies-store';
import { onPermissionsChanged } from '../../lib/permissions';
import type { CookieAttrs } from '../../lib/cookie-types';

export function App() {
  const granted = useCookiesStore((s) => s.granted);
  const loading = useCookiesStore((s) => s.loading);
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const cookies = useCookiesStore((s) => s.cookies);
  const query = useCookiesStore((s) => s.query);
  const [editing, setEditing] = useState<{ draft: CookieAttrs; original: CookieAttrs | null } | null>(null);
  const filtered = query
    ? cookies.filter((c) => {
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.value.toLowerCase().includes(q);
      })
    : cookies;

  function newDraft(): CookieAttrs {
    let domain = 'example.com';
    try { if (activeUrl) domain = new URL(activeUrl).hostname; } catch { /* keep default */ }
    return { name: '', value: '', domain, path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: false };
  }

  useEffect(() => {
    void hydrateFromStorage().then(() => cookiesStore.getState().refresh());
    const unsub = onPermissionsChanged(() => void cookiesStore.getState().refresh());
    const onActivated = (): void => void cookiesStore.getState().refresh();
    chrome.tabs.onActivated.addListener(onActivated);
    const onMessage = (msg: unknown): void => {
      if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === 'wafer:cookies-changed') {
        void cookiesStore.getState().refresh();
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      unsub();
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  if (!granted) return <GrantAccess onGrant={() => void cookiesStore.getState().refresh()} />;

  if (granted && editing) {
    return <CookieEditor initial={editing.draft} original={editing.original} activeUrl={activeUrl} onDone={() => setEditing(null)} />;
  }

  return (
    <main style={{ font: '13px system-ui', padding: 12 }}>
      <IoBar />
      <button type="button" onClick={() => setEditing({ draft: newDraft(), original: null })} style={{ marginBottom: 8 }}>＋ Add cookie</button>
      <SearchBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--wafer-muted)', marginBottom: 8 }}>
        <span>{loading ? 'Loading…' : `${filtered.length} cookies · ${activeUrl ?? 'unknown site'}`}</span>
        <ThemeToggle />
      </div>
      <CookieList
        cookies={filtered}
        onEdit={(c) => setEditing({ draft: c, original: c })}
        onDelete={(c) => { if (confirm(`Delete cookie "${c.name}"?`)) void cookiesStore.getState().deleteCookie(c).catch((e) => console.error('[wafer] delete failed', e)); }}
      />
    </main>
  );
}
