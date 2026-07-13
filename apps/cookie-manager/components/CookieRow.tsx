import type { CookieAttrs } from '../lib/cookie-types';

export function CookieRow({ cookie }: { cookie: CookieAttrs }) {
  return (
    <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee', overflow: 'hidden' }}>
      <div style={{ fontWeight: 600 }}>{cookie.name}</div>
      {/* value is attacker-controlled → text node only, never HTML */}
      <div style={{ color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {cookie.value}
      </div>
    </div>
  );
}
