import { useCookiesStore, cookiesStore } from '../stores/cookies-store';

export function SearchBar() {
  const query = useCookiesStore((s) => s.query);
  return (
    <input
      type="search"
      value={query}
      onChange={(e) => cookiesStore.getState().setQuery(e.target.value)}
      placeholder="Search name, domain, value…"
      style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', marginBottom: 8 }}
    />
  );
}
