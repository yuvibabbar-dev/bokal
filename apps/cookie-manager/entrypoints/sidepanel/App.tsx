import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { GrantAccess } from '../../components/GrantAccess';
import { CookieList } from '../../components/CookieList';
import { SearchBar } from '../../components/SearchBar';
import { CookieEditor } from '../../components/CookieEditor';
import { IoBar } from '../../components/IoBar';
import { BlockRules } from '../../components/BlockRules';
import { ThemeToggle } from '../../components/ThemeToggle';
import { UpgradeButton } from '../../components/UpgradeButton';
import { useCookiesStore, cookiesStore, hydrateFromStorage } from '../../stores/cookies-store';
import { useEntitlement, entitlementStore } from '../../stores/entitlement-store';
import { useRules, rulesStore } from '../../stores/rules-store';
import { onPermissionsChanged } from '../../lib/permissions';
import { SOFT_DOMAIN_COOKIE_WARN } from '../../lib/cookies/validation';
import { shouldPromptReview, dismissReviewPrompt, reviewUrl } from '../../lib/review';
import type { CookieAttrs } from '../../lib/cookie-types';

export function App() {
  const granted = useCookiesStore((s) => s.granted);
  const ready = useCookiesStore((s) => s.ready);
  const loading = useCookiesStore((s) => s.loading);
  const activeUrl = useCookiesStore((s) => s.activeUrl);
  const cookies = useCookiesStore((s) => s.cookies);
  const query = useCookiesStore((s) => s.query);
  const showPartitioned = useCookiesStore((s) => s.showPartitioned);
  const scope = useCookiesStore((s) => s.scope);
  const [editing, setEditing] = useState<{ draft: CookieAttrs; original: CookieAttrs | null } | null>(null);
  const entitled = useEntitlement((s) => s.entitled);
  const rules = useRules((s) => s.rules);
  const [Pro, setPro] = useState<ComponentType | null>(null);
  const [showReview, setShowReview] = useState(false);
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
    void hydrateFromStorage().catch(() => {}).then(() => cookiesStore.getState().refresh());
    void entitlementStore.getState().refresh();
    void rulesStore.getState().refresh();
    const unsub = onPermissionsChanged(() => void cookiesStore.getState().refresh());
    const onActivated = (): void => void cookiesStore.getState().refresh();
    chrome.tabs.onActivated.addListener(onActivated);
    const onUpdated = (_tabId: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void => {
      if (info.status === 'complete' && tab.active) void cookiesStore.getState().refresh();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    const onMessage = (msg: unknown): void => {
      if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === 'wafer:cookies-changed') {
        void cookiesStore.getState().refresh();
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      unsub();
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  useEffect(() => {
    if (entitled && !Pro) {
      void import('../../components/pro/ProfilesPanel').then((m) => setPro(() => m.ProfilesPanel));
    }
  }, [entitled, Pro]);

  // Re-check the review nudge after each action (the cookie list changes on every refresh).
  useEffect(() => {
    if (!showReview) void shouldPromptReview().then((v) => { if (v) setShowReview(true); });
  }, [cookies, showReview]);

  if (!ready) {
    return <main style={{ font: '13px system-ui', padding: 12, color: 'var(--wafer-muted)' }}>Loading…</main>;
  }

  if (!granted) return <GrantAccess onGrant={() => void cookiesStore.getState().refresh()} />;

  if (granted && editing) {
    return <CookieEditor initial={editing.draft} original={editing.original} activeUrl={activeUrl} onDone={() => setEditing(null)} />;
  }

  return (
    <main style={{ font: '13px system-ui', padding: 12 }}>
      {showReview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 8, border: '1px solid var(--wafer-border)', borderRadius: 4, fontSize: 12 }}>
          <span style={{ flex: 1 }}>Enjoying Wafer? A quick review helps others find it.</span>
          <a href={reviewUrl()} target="_blank" rel="noreferrer" onClick={() => { void dismissReviewPrompt(); setShowReview(false); }}>Leave a review</a>
          <button type="button" onClick={() => { void dismissReviewPrompt(); setShowReview(false); }} aria-label="Dismiss">✕</button>
        </div>
      )}
      <IoBar cookies={filtered} scope={scope} />
      <button type="button" onClick={() => setEditing({ draft: newDraft(), original: null })} style={{ marginBottom: 8 }}>＋ Add cookie</button>
      <SearchBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--wafer-muted)', marginBottom: 8 }}>
        <span>{loading ? 'Loading…' : `${filtered.length} cookies · ${activeUrl ?? 'unknown site'}`}</span>
        <select aria-label="Scope" value={scope} onChange={(e) => cookiesStore.getState().setScope(e.target.value as 'site' | 'all')} style={{ fontSize: 11 }}>
          <option value="site">This site</option>
          <option value="all">All cookies</option>
        </select>
        <label style={{ fontSize: 11, color: 'var(--wafer-muted)' }}>
          <input type="checkbox" checked={showPartitioned} disabled={scope === 'all'} onChange={(e) => cookiesStore.getState().setShowPartitioned(e.target.checked)} /> Show partitioned (CHIPS)
        </label>
        <ThemeToggle />
      </div>
      {scope === 'site' && cookies.length >= SOFT_DOMAIN_COOKIE_WARN && (
        <div style={{ fontSize: 11, color: 'var(--wafer-muted)', marginBottom: 6 }}>⚠ {cookies.length} cookies — near Chrome's ~180-per-domain limit.</div>
      )}
      <CookieList
        cookies={filtered}
        rules={rules}
        onEdit={(c) => setEditing({ draft: c, original: c })}
        onDelete={(c) => { if (confirm(`Delete cookie "${c.name}"?`)) void cookiesStore.getState().deleteCookie(c).catch((e) => console.error('[wafer] delete failed', e)); }}
        onTogglePin={(c) => void rulesStore.getState().togglePin(c)}
        onToggleProtect={(c) => void rulesStore.getState().toggleProtect(c)}
      />
      <BlockRules />
      {entitled ? (Pro ? <Pro /> : null) : <div style={{ padding: '8px 12px' }}><UpgradeButton /></div>}
    </main>
  );
}
