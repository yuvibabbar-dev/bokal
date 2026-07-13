// The DevTools page registers Wafer as a panel in the DevTools window. The panel HTML
// (devtools-panel.html) hosts the same React UI, bound to the inspected tab.
chrome.devtools.panels.create('Wafer', '', 'devtools-panel.html', () => {
  /* panel created */
});
