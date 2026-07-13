import { entitlementStore } from '../stores/entitlement-store';

export function UpgradeButton() {
  return (
    <button
      type="button"
      onClick={() => void entitlementStore.getState().openUpgrade()}
      style={{ marginBottom: 8 }}
      title="Named cookie profiles + encryption"
    >
      ★ Unlock Pro — cookie profiles
    </button>
  );
}
