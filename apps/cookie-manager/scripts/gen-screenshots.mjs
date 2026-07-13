import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const DIST = join(root, '..', '.output', 'chrome-mv3');
const outDir = join(root, '..', '..', '..', 'docs', 'store', 'screenshots');
mkdirSync(outDir, { recursive: true });

const context = await chromium.launchPersistentContext('', {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
});
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker');
const id = sw.url().split('/')[2];
const url = `chrome-extension://${id}/sidepanel.html`;

async function shot(name, prep) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url);
  await page.waitForTimeout(400);
  if (prep) await prep(page);
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  await page.close();
}

// 1: whatever the current build shows on first open (grant gate on normal build, mgmt UI on e2e build)
await shot('01-panel', null);
// 2: the add/edit cookie form
await shot('02-editor', async (p) => {
  const add = p.getByRole('button', { name: /add cookie/i });
  if (await add.isVisible().catch(() => false)) await add.click();
});
// 3: Pro profiles (mock-unlock, then the panel lazy-loads)
await shot('03-pro-profiles', async (p) => {
  const unlock = p.getByRole('button', { name: /unlock pro/i });
  if (await unlock.isVisible().catch(() => false)) { await unlock.click(); await p.waitForTimeout(600); }
});

await context.close();
console.log('screenshots written to', outDir);
