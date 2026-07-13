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
});
