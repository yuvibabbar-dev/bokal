import { defineConfig } from 'wxt';

// Wafer manifest — minimal install-time permissions; host access requested at runtime.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Wafer',
    version: '1.0.0',
    description: 'View, edit, add, delete, import, and export browser cookies.',
    minimum_chrome_version: '114',
    icons: { '16': 'icon/16.png', '32': 'icon/32.png', '48': 'icon/48.png', '128': 'icon/128.png' },
    // activeTab lets the panel read the active tab's URL after the toolbar-click that opens it, so
    // Wafer can request host access for JUST that site — without the `tabs` permission and with no
    // install warning. It does NOT grant chrome.cookies access; per-site host permission does that.
    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage', 'alarms', 'activeTab'],
    optional_host_permissions: ['<all_urls>'],
    action: { default_title: 'Wafer' },
    side_panel: { default_path: 'sidepanel.html' },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    // TEST-ONLY: in E2E builds, grant host access at install so specs bypass the runtime dialog.
    // Never set for the published build.
    ...(process.env.WAFER_E2E ? { host_permissions: ['<all_urls>'] } : {}),
  },
});
