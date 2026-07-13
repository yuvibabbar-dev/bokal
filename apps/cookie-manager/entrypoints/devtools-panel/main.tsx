import '@wafer/ui-kit/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../sidepanel/App';
import { setInspectedTab } from '../../lib/cookies/read';

// Bind cookie reads to the tab being inspected (not the DevTools window's own tab).
setInspectedTab(chrome.devtools.inspectedWindow.tabId);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
