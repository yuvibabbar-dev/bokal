import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CookieAttrs } from '../lib/cookie-types';
import { cookieId } from '../lib/cookies/keys';
import { isPinned, isProtected, sortPinned, type Rules } from '../lib/rules/rules';
import { CookieRow } from './CookieRow';

export function CookieList({
  cookies,
  onEdit,
  onDelete,
  rules,
  onTogglePin,
  onToggleProtect,
}: {
  cookies: CookieAttrs[];
  onEdit: (c: CookieAttrs) => void;
  onDelete: (c: CookieAttrs) => void;
  rules?: Rules;
  onTogglePin?: (c: CookieAttrs) => void;
  onToggleProtect?: (c: CookieAttrs) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const ordered = rules ? sortPinned(cookies, rules) : cookies;
  const virtualizer = useVirtualizer({
    count: ordered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 8,
    useFlushSync: false, // avoids flushSync scroll warnings under React 19
  });

  if (ordered.length === 0) return <div style={{ color: 'var(--bokal-muted)', padding: 8 }}>No cookies.</div>;

  return (
    <div ref={parentRef} style={{ height: 'calc(100vh - 90px)', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const cookie = ordered[item.index]!;
          return (
            <div
              key={cookieId(cookie)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
            >
              <CookieRow
                cookie={cookie}
                onEdit={onEdit}
                onDelete={onDelete}
                pinned={rules ? isPinned(rules, cookie) : undefined}
                locked={rules ? isProtected(rules, cookie) : undefined}
                onTogglePin={onTogglePin}
                onToggleProtect={onToggleProtect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
