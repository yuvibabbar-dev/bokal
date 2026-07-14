import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// entitlement-store touches chrome.storage at import time — fake it before the hoisted import.
vi.hoisted(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    // runtime.id satisfies webextension-polyfill's "am I in an extension?" load check
    // (pulled in transitively via lib/pay/billing → extpay).
    runtime: { id: 'wafer-test-suite' },
    storage: {
      local: { get: async () => ({}), set: async () => {} },
      onChanged: { addListener: () => {} },
    },
  };
});

import { UpgradeButton } from './UpgradeButton';
import { entitlementStore } from '../stores/entitlement-store';

beforeEach(() => {
  entitlementStore.setState({ entitled: false, loading: false, upgradeError: null });
});

describe('UpgradeButton', () => {
  it('shows no error message by default', () => {
    const { container } = render(<UpgradeButton />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('surfaces the store upgradeError so a failed open is never silent', () => {
    entitlementStore.setState({ upgradeError: 'Couldn’t open the upgrade page.' });
    const { container } = render(<UpgradeButton />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Couldn’t open the upgrade page.');
  });
});
