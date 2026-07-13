import { createDebouncer } from '../lib/debounce';
import { loadRules, matchesBlock } from '../lib/rules/rules';
import { fromChrome } from '../lib/cookies/read';
import { removeCookie } from '../lib/cookies/write';

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

  chrome.cookies.onChanged.addListener((info) => {
    notify.trigger();
    // Reactive block: when a site SETS a cookie whose domain is on the blocklist, remove it.
    // We only act on additions (removed === false); our own removal fires removed === true, which
    // we ignore — that's the loop guard. Never log the value.
    if (info.removed) return;
    void loadRules()
      .then((rules) => {
        const c = fromChrome(info.cookie);
        if (matchesBlock(rules, c)) return removeCookie(c);
      })
      .catch(() => {});
  });

  void chrome.alarms.get('wafer:entitlement').then((existing) => {
    if (!existing) chrome.alarms.create('wafer:entitlement', { periodInMinutes: 60 * 24 });
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'wafer:entitlement') void import('../lib/pay/sync').then((m) => m.syncEntitlementCache()).catch(() => {});
  });
});
