import { createDebouncer } from '../lib/debounce';
import { loadRules, matchesBlock, isProtected, RULES_KEY, type Rules } from '../lib/rules/rules';
import { fromChrome } from '../lib/cookies/read';
import { removeCookie } from '../lib/cookies/write';

export default defineBackground(() => {
  // Cache rules within the service-worker lifetime to avoid a storage read per cookie change;
  // invalidate whenever the rules are edited.
  let cachedRules: Rules | null = null;
  const currentRules = (): Promise<Rules> => (cachedRules ? Promise.resolve(cachedRules) : loadRules().then((r) => (cachedRules = r)));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[RULES_KEY]) cachedRules = null;
  });
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
    void currentRules()
      .then((rules) => {
        const c = fromChrome(info.cookie);
        // Protect wins over block: never auto-remove a cookie the user protected.
        if (matchesBlock(rules, c) && !isProtected(rules, c)) return removeCookie(c);
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
