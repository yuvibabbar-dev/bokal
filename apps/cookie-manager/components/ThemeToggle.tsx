import { useTheme, type ThemeMode } from '@wafer/ui-kit';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export function ThemeToggle() {
  const [mode, setMode] = useTheme();
  return (
    <select aria-label="Theme" value={mode} onChange={(e) => setMode(e.target.value as ThemeMode)} style={{ fontSize: 11 }}>
      {MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
    </select>
  );
}
