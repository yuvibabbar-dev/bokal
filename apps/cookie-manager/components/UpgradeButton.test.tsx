import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// entitlement-store touches chrome.storage at import time — fake it before the hoisted import.
vi.hoisted(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    // runtime.id satisfies webextension-polyfill's "am I in an extension?" load check
    // (pulled in transitively via lib/pay/billing → extpay).
    runtime: { id: 'bokal-test-suite' },
    storage: {
      local: { get: async () => ({}), set: async () => {} },
      onChanged: { addListener: () => {} },
    },
  };
});

import { UpgradeButton } from './UpgradeButton';
import { entitlementStore } from '../stores/entitlement-store';

beforeEach(() => {
  // vitest isn't configured with `globals`, so RTL's automatic afterEach cleanup never registers —
  // without this, renders pile up in document.body and role queries match earlier tests' output.
  cleanup();
  entitlementStore.setState({ entitled: false, loading: false, upgradeError: null });
});

describe('UpgradeButton', () => {
  it('shows no error message by default', () => {
    const { container } = render(<UpgradeButton />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  // An existing customer on a new machine must have a way back to Pro without paying twice.
  it('offers a restore path for someone who already bought Pro', () => {
    const { getByRole } = render(<UpgradeButton />);
    expect(getByRole('button', { name: /restore/i })).toBeTruthy();
  });

  it('surfaces the store upgradeError so a failed open is never silent', () => {
    entitlementStore.setState({ upgradeError: 'Couldn’t open the upgrade page.' });
    const { container } = render(<UpgradeButton />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('Couldn’t open the upgrade page.');
  });

  // The compact variant lives in the header so the upsell is visible without scrolling; the full
  // section at the bottom keeps Restore + the error alert.
  describe('compact', () => {
    it('renders only the Unlock Pro chip — no restore link', () => {
      const { getByRole, queryByRole } = render(<UpgradeButton compact />);
      expect(getByRole('button', { name: /unlock pro/i })).toBeTruthy();
      expect(queryByRole('button', { name: /restore/i })).toBeNull();
    });

    it('opens the upgrade flow on click', () => {
      const spy = vi.spyOn(entitlementStore.getState(), 'openUpgrade').mockImplementation(async () => {});
      const { getByRole } = render(<UpgradeButton compact />);
      getByRole('button', { name: /unlock pro/i }).click();
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it('never duplicates the error alert — the full section owns role="alert"', () => {
      entitlementStore.setState({ upgradeError: 'Couldn’t open the upgrade page.' });
      const { container } = render(<UpgradeButton compact />);
      expect(container.querySelector('[role="alert"]')).toBeNull();
    });
  });
});
