import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Store screenshots, captured from the REAL extension against a REAL site with REAL cookies.
//
// The previous version opened sidepanel.html as a lone page with no site tab, so every shot said
// "0 cookies · unknown site" over a mostly-blank frame. The panel actually resolves its target via
// tabs.query({active, lastFocusedWindow}) and re-reads on tabs.onActivated — so we open the panel,
// then front the SITE tab, and the panel binds to it exactly as the real side panel does.
//
// Run against the e2e build (host access pre-granted):
//   pnpm --filter @bokal/cookie-manager build:e2e
//   pnpm --filter @bokal/cookie-manager exec node scripts/gen-screenshots.mjs

const root = dirname(fileURLToPath(import.meta.url));
const DIST = join(root, '..', '.output', 'chrome-mv3');
const outDir = join(root, '..', '..', '..', 'docs', 'store', 'screenshots');
mkdirSync(outDir, { recursive: true });

const PORT = 39530;
const HOST = 'app.example.com'; // resolved to our local server, so the shots show a real hostname
const ORIGIN = `http://${HOST}`;

// A believable logged-in app's cookie jar.
const COOKIES = [
  'session_id=8f14e45fceea167a5a36dedd4bea2543; Path=/; SameSite=Lax',
  'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; Path=/; SameSite=Strict',
  'csrf_token=b1946ac92492d2347c6235b4d2611184; Path=/; SameSite=Strict',
  'refresh_token=9f2b1c8e4d6a7b3c5e0f1a2d3b4c5d6e; Path=/; SameSite=Lax',
  'user_prefs=theme%3Ddark%26density%3Dcompact; Path=/; SameSite=Lax',
  'locale=en-CA; Path=/; SameSite=Lax',
  'tz=America%2FToronto; Path=/; SameSite=Lax',
  'cart_id=c7f3a91b-2f44-4d1e-9a77-8b6c2e0d4f31; Path=/; SameSite=Lax',
  'ab_variant=checkout_v3; Path=/; SameSite=Lax',
  'consent=analytics%3D0%26marketing%3D0; Path=/; SameSite=Lax',
  'device_id=d41d8cd98f00b204e9800998ecf8427e; Path=/; SameSite=Lax',
  'last_seen=2026-07-14T12%3A30%3A00Z; Path=/; SameSite=Lax',
];

const server = createServer((_req, res) => {
  res.setHeader('Set-Cookie', COOKIES);
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><meta charset="utf-8"><title>Example App</title><h1>Example App</h1>');
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  viewport: { width: 1280, height: 800 },
  args: [
    `--disable-extensions-except=${DIST}`,
    `--load-extension=${DIST}`,
    `--host-resolver-rules=MAP ${HOST} 127.0.0.1:${PORT}`,
  ],
});

// Stand in for extensionpay.com so the Pro shot never touches the real billing server.
await context.route(/extensionpay\.com/, (route) => {
  const url = route.request().url();
  const json = (b) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
  if (url.includes('/api/new-key')) return json('shot-key');
  if (url.includes('/api/v2/user')) {
    const now = new Date().toISOString();
    return json({ paid: true, paidAt: now, installedAt: now, trialStartedAt: null });
  }
  return route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>checkout</h1>' });
});

let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');
const extId = sw.url().split('/')[2];

const site = await context.newPage();
await site.goto(ORIGIN);

const panel = await context.newPage();
await panel.goto(`chrome-extension://${extId}/sidepanel.html`);
await site.bringToFront(); // bind the panel to the site tab

const shot = async (name) => {
  await panel.waitForTimeout(500);
  await panel.screenshot({ path: join(outDir, `${name}.png`) });
  console.log('  ✓', name);
};

// 1 — the populated cookie list for a real site (the hero shot)
await panel.getByText('session_id').waitFor({ timeout: 15000 });
await shot('01-cookies');

// 2 — the editor, opened on a REAL cookie (not an empty form with a validation error)
await panel.getByRole('button', { name: /session_id/ }).first().click();
await panel.locator('textarea').waitFor();
await shot('02-editor');
await panel.getByRole('button', { name: /cancel/i }).click();

// 3 — all-sites view
await panel.getByLabel('Scope').selectOption('all');
await panel.waitForTimeout(800);
await shot('03-all-cookies');
await panel.getByLabel('Scope').selectOption('site');
await panel.waitForTimeout(500);

// 4 — rules + cleanup (protect / pin / block, whitelist sweep), expanded and in frame
await panel.locator('summary').first().click().catch(() => {});
await panel.locator('summary').nth(1).click().catch(() => {});
await panel.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await shot('04-rules-cleanup');

// 5 — Bokal Pro: encrypted cookie profiles, with one saved
await sw.evaluate(() => chrome.storage.local.set({ 'bokal:proEngaged': true }));
await sw.evaluate(() => chrome.storage.sync.set({ extensionpay_api_key: 'shot-key' }));
await panel.reload();
await site.bringToFront();
await panel.getByText('Cookie profiles (Pro)').waitFor({ timeout: 15000 });
await panel.getByPlaceholder('Profile name').fill('Test account A');
await panel.getByRole('checkbox', { name: 'Encrypt' }).check();
await panel.getByPlaceholder('Passphrase').fill('a-strong-passphrase');
await panel.getByRole('button', { name: /save current cookies/i }).click();
await panel.locator('li').filter({ hasText: 'Test account A' }).waitFor({ timeout: 10000 });
// The Pro panel sits below a long cookie list — scroll it into frame or the shot cuts it off.
await panel.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await shot('05-pro-profiles');

await context.close();
server.close();
console.log('screenshots written to', outDir);
