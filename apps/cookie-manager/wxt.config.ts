import { defineConfig } from 'wxt';

// Bokal manifest — minimal install-time permissions; host access requested at runtime.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    // The Chrome Web Store takes the listing's TITLE and SUMMARY from the manifest — they are NOT
    // editable in the dashboard. So the SEO-front-loaded title from docs/store/listing.md has to
    // live here, or the listing ships as the bare word "Bokal", which nobody searches for.
    // name: 58/75 chars · description: 126/132 chars.
    name: 'Bokal - Cookie Editor & Manager (Open Source, No Tracking)',
    version: '1.0.2',
    description:
      'Edit, add, view & delete cookies incl. HttpOnly. JSON/Netscape export, JSON import, CHIPS inspector. Open source, no tracking.',
    // Product homepage. (GPL source-pointing is satisfied by the in-panel Source link, README, and
    // THIRD-PARTY-NOTICES, which all reference the GitHub repo.)
    homepage_url: 'https://bokal.dev',
    minimum_chrome_version: '114',
    icons: { '16': 'icon/16.png', '32': 'icon/32.png', '48': 'icon/48.png', '128': 'icon/128.png' },
    // activeTab lets the panel read the active tab's URL after the toolbar-click that opens it, so
    // Bokal can request host access for JUST that site — without the `tabs` permission and with no
    // install warning. It does NOT grant chrome.cookies access; per-site host permission does that.
    permissions: ['cookies', 'storage', 'sidePanel', 'unlimitedStorage', 'alarms', 'activeTab'],
    optional_host_permissions: ['<all_urls>'],
    action: { default_title: 'Bokal' },
    side_panel: { default_path: 'sidepanel.html' },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    // TEST-ONLY: in E2E builds, grant host access at install so specs bypass the runtime dialog.
    // Never set for the published build.
    ...(process.env.BOKAL_E2E ? { host_permissions: ['<all_urls>'] } : {}),
  },
});
