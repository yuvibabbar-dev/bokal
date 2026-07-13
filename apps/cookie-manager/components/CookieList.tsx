import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CookieAttrs } from '../lib/cookie-types';
import { cookieId } from '../lib/cookies/keys';
import { CookieRow } from './CookieRow';

export function CookieList({ cookies }: { cookies: CookieAttrs[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: cookies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 8,
    useFlushSync: false, // avoids flushSync scroll warnings under React 19
  });

  if (cookies.length === 0) return <div style={{ color: '#888', padding: 8 }}>No cookies.</div>;

  return (
    <div ref={parentRef} style={{ height: 'calc(100vh - 90px)', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const cookie = cookies[item.index]!;
          return (
            <div
              key={cookieId(cookie)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
            >
              <CookieRow cookie={cookie} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
