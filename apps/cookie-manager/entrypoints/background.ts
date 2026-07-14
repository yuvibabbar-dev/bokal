import { createDebouncer } from '../lib/debounce';
import { loadRules, matchesBlock, isProtected, computeCleanup, RULES_KEY, type Rules } from '../lib/rules/rules';
import { fromChrome, getAllCookies } from '../lib/cookies/read';
import { removeCookie } from '../lib/cookies/write';

const CLEANUP_ALARM = 'wafer:cleanup';

export default defineBackground(() => {
  // Cache rules within the service-worker lifetime to avoid a storage read per cookie change;
  // invalidate whenever the rules are edited.
  let cachedRules: Rules | null = null;
  const currentRules = (): Promise<Rules> => (cachedRules ? Promise.resolve(cachedRules) : loadRules().then((r) => (cachedRules = r)));

  // Keep the daily cleanup alarm in sync with the autoSweep flag. Only arm it when there is a
  // non-empty keep-list — auto-sweep with an empty keep-list would silently wipe ALL cookies, which
  // is never a safe default. Guard the create() with alarms.get so re-running on every SW wake
  // doesn't reset the 24h countdown (that bug would keep the sweep from ever firing).
  const syncCleanupAlarm = async (): Promise<void> => {
    const { autoSweep, keepDomains } = await loadRules();
    const existing = await chrome.alarms.get(CLEANUP_ALARM);
    if (autoSweep && keepDomains.length > 0) {
      if (!existing) await chrome.alarms.create(CLEANUP_ALARM, { periodInMinutes: 60 * 24 });
    } else if (existing) {
      await chrome.alarms.clear(CLEANUP_ALARM);
    }
  };

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[RULES_KEY]) {
      cachedRules = null;
      void syncCleanupAlarm();
    }
  });
  void syncCleanupAlarm();
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
    if (alarm.name === CLEANUP_ALARM) {
      // Daily sweep: remove everything not on the keep-list (never a protected cookie). No value logging.
      // Re-check the flags at fire time (defense-in-depth against a stale alarm): never wipe-all on
      // an empty keep-list or a disabled sweep.
      void loadRules()
        .then(async (rules) => {
          if (!rules.autoSweep || rules.keepDomains.length === 0) return;
          for (const c of computeCleanup(await getAllCookies(), rules)) {
            await removeCookie(c).catch(() => {});
          }
        })
        .catch(() => {});
    }
  });
});
