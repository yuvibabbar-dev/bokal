import { entitlementStore, useEntitlement } from '../stores/entitlement-store';

export function UpgradeButton() {
  const upgradeError = useEntitlement((s) => s.upgradeError);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => void entitlementStore.getState().openUpgrade()}
        title="Named cookie profiles + encryption"
      >
        ★ Unlock Pro — cookie profiles
      </button>
      {upgradeError && (
        <div role="alert" style={{ color: 'var(--bokal-danger)', fontSize: 12, marginTop: 4 }}>
          {upgradeError}
        </div>
      )}
    </div>
  );
}
