import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CookieRow } from './CookieRow';
import type { CookieAttrs } from '../lib/cookie-types';

const malicious: CookieAttrs = {
  name: 'x',
  value: '<img src=x onerror="window.__pwned=1">',
  domain: 'example.com',
  path: '/',
  secure: true,
  httpOnly: false,
  sameSite: 'lax',
  hostOnly: false,
};

describe('CookieRow', () => {
  it('renders a malicious value as literal text, not HTML', () => {
    const { container } = render(<CookieRow cookie={malicious} />);
    // No <img> element should be created from the value.
    expect(container.querySelector('img')).toBeNull();
    // The literal string is present as text.
    expect(container.textContent).toContain('<img src=x onerror=');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });
});
