import { useEffect } from 'react';
import { GrantAccess } from '../../components/GrantAccess';
import { CookieList } from '../../components/CookieList';
import { useCookiesStore, cookiesStore, hydrateFromStorage } from '../../stores/cookies-store';
import { onPermissionsChanged } from '../../lib/permissions';

export function App() {
  const granted = useCookiesStore((s) => s.granted);
  const loading = useCookiesStore((s) => s.loading);
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const cookies = useCookiesStore((s) => s.cookies);

  useEffect(() => {
    void hydrateFromStorage().then(() => cookiesStore.getState().refresh());
    const unsub = onPermissionsChanged(() => void cookiesStore.getState().refresh());
    const onActivated = (): void => void cookiesStore.getState().refresh();
    chrome.tabs.onActivated.addListener(onActivated);
    return () => {
      unsub();
      chrome.tabs.onActivated.removeListener(onActivated);
    };
  }, []);

  if (!granted) return <GrantAccess onGrant={() => void cookiesStore.getState().refresh()} />;

  return (
    <main style={{ font: '13px system-ui', padding: 12 }}>
      <div style={{ color: '#555', marginBottom: 8 }}>
        {loading ? 'Loading…' : `${cookies.length} cookies · ${activeUrl ?? 'unknown site'}`}
      </div>
      <CookieList cookies={cookies} />
    </main>
  );
}
