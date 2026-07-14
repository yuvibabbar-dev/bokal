import { entitlementStore, useEntitlement } from '../stores/entitlement-store';

/**
 * Shown to entitled users. Opens the same ExtPay account page as "Restore purchase" — that is where
 * a subscriber cancels or updates their card. Shipping a paid tier with no cancel path is both
 * hostile and a support burden.
 */
export function ManageBilling() {
  const upgradeError = useEntitlement((s) => s.upgradeError);
  return (
    <div style={{ padding: '4px 12px' }}>
      <button
        type="button"
        onClick={() => void entitlementStore.getState().restore()}
        title="Manage or cancel your Bokal Pro subscription"
        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: 12, color: 'var(--bokal-muted)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Manage subscription
      </button>
      {upgradeError && (
        <div role="alert" style={{ color: 'var(--bokal-danger)', fontSize: 12, marginTop: 4 }}>
          {upgradeError}
        </div>
      )}
    </div>
  );
}
