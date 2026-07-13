import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'wafer:theme';

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>('system');
  useEffect(() => {
    void chrome.storage.local.get(KEY).then((r) => {
      const m = (r[KEY] as ThemeMode | undefined) ?? 'system';
      setMode(m);
      applyTheme(m);
    });
  }, []);
  const set = (m: ThemeMode): void => {
    setMode(m);
    applyTheme(m);
    // Persisted to chrome.storage.local (device-local only); theme does not sync across devices.
    void chrome.storage.local.set({ [KEY]: m });
  };
  return [mode, set];
}
