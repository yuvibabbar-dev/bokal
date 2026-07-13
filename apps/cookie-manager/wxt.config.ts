import { defineConfig } from 'wxt';

// Wafer manifest — minimal install-time permissions; host access requested at runtime.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Wafer',
    version: '1.0.0',
    description: 'View, edit, add, delete, import, and export browser cookies.',
    minimum_chrome_version: '114',
    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage', 'alarms'],
    optional_host_permissions: ['<all_urls>'],
    action: { default_title: 'Wafer' },
    side_panel: { default_path: 'sidepanel.html' },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
});
