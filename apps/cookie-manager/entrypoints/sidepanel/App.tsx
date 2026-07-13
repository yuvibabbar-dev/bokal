import { useEffect } from 'react';
import { GrantAccess } from '../../components/GrantAccess';
import { CookieList } from '../../components/CookieList';
import { SearchBar } from '../../components/SearchBar';
import { useCookiesStore, cookiesStore, hydrateFromStorage } from '../../stores/cookies-store';
import { onPermissionsChanged } from '../../lib/permissions';

export function App() {
  const granted = useCookiesStore((s) => s.granted);
  const loading = useCookiesStore((s) => s.loading);
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const cookies = useCookiesStore((s) => s.cookies);
  const query = useCookiesStore((s) => s.query);
  const filtered = query
    ? cookies.filter((c) => {
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.value.toLowerCase().includes(q);
      })
    : cookies;

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

  return (
    <main style={{ font: '13px system-ui', padding: 12 }}>
      <SearchBar />
      <div style={{ color: '#555', marginBottom: 8 }}>
        {loading ? 'Loading…' : `${filtered.length} cookies · ${activeUrl ?? 'unknown site'}`}
      </div>
      <CookieList cookies={filtered} />
    </main>
  );
}
