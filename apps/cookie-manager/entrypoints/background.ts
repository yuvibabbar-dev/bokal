export default defineBackground(() => {
  // Open the side panel when the toolbar icon is clicked (no manifest field for this).
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[wafer] setPanelBehavior failed', err));
});
