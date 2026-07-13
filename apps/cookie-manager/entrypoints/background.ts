import { createDebouncer } from '../lib/debounce';

export default defineBackground(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[wafer] setPanelBehavior failed', err));

  // Coalesce the remove-then-write double-fire ("overwrite" then "explicit") into one signal.
  const notify = createDebouncer(() => {
    chrome.runtime.sendMessage({ type: 'wafer:cookies-changed' }).catch(() => {
      // No receiver (panel closed) — safe to ignore.
    });
  }, 120);

  chrome.cookies.onChanged.addListener(() => notify.trigger());

  void chrome.alarms.get('wafer:entitlement').then((existing) => {
    if (!existing) chrome.alarms.create('wafer:entitlement', { periodInMinutes: 60 * 24 });
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'wafer:entitlement') void import('../lib/pay/sync').then((m) => m.syncEntitlementCache()).catch(() => {});
  });
});
