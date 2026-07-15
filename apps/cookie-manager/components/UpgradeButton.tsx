import { entitlementStore, useEntitlement } from '../stores/entitlement-store';

export function UpgradeButton({ compact = false }: { compact?: boolean } = {}) {
  const upgradeError = useEntitlement((s) => s.upgradeError);
  if (compact) {
    // Header chip: keeps the upsell visible without scrolling. Restore and the role="alert" error
    // stay in the full bottom section so the alert exists exactly once in the DOM.
    return (
      <button
        type="button"
        onClick={() => void entitlementStore.getState().openUpgrade()}
        title="Named cookie profiles + encryption"
        style={{ fontSize: 11 }}
      >
        ★ Unlock Pro
      </button>
    );
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => void entitlementStore.getState().openUpgrade()}
        title="Named cookie profiles + encryption"
      >
        ★ Unlock Pro — cookie profiles
      </button>
      {/* Someone who already bought Pro (new machine, reinstall, cleared storage) must be able to
          get it back without paying twice — ExtPay only knows them by a key held in this browser. */}
      <button
        type="button"
        onClick={() => void entitlementStore.getState().restore()}
        title="Already bought Pro? Sign in to restore it on this device"
        style={{ marginLeft: 6, background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: 12, color: 'var(--bokal-muted)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Restore purchase
      </button>
      {upgradeError && (
        <div role="alert" style={{ color: 'var(--bokal-danger)', fontSize: 12, marginTop: 4 }}>
          {upgradeError}
        </div>
      )}
    </div>
  );
}
