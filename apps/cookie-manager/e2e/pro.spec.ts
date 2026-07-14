import { test, expect } from './fixtures';
import type { BrowserContext } from '@playwright/test';
import { createServer, type Server } from 'node:http';

// End-to-end for the paid tier, in a real browser, through the REAL ExtPayBilling adapter.
//
// We do not fake entitlement by writing the cache — that would skip the very code we need to trust.
// Instead we mock the extensionpay.com BACKEND and let the real adapter do its real work: create an
// API key, open the payment page, poll for the purchase, parse `paid`, write the cache, and unlock.
// That is the same sequence a live Stripe checkout produces, so this exercises the M12 billing
// integration end-to-end without needing a registered ExtPay app or a real card.
//
// It also pins down two invariants that only a real browser run can show:
//   1. The Pro chunk is genuinely lazy — it is fetched ONLY once the user becomes entitled.
//   2. A WRONG PASSPHRASE CANNOT DESTROY COOKIES. apply() decrypts before it removes anything, so a
//      failed decrypt must leave the cookie jar untouched (the invariant behind the M9 Critical).

const PORT = 39519;
const ORIGIN = `http://localhost:${PORT}`;
const PASS = 'correct horse battery staple';

let server: Server;

test.beforeAll(async () => {
  server = createServer((_req, res) => {
    res.setHeader('Set-Cookie', 'e2e_session=abc123; Path=/; SameSite=Lax');
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><meta charset="utf-8"><title>Bokal E2E</title><h1>bokal e2e fixture</h1>');
  });
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', resolve));
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

/** Stand in for the extensionpay.com backend. `state.paid` flips when the "purchase" completes. */
async function mockExtPay(context: BrowserContext, state: { paid: boolean }): Promise<void> {
  await context.route(/extensionpay\.com/, async (route) => {
    const url = route.request().url();
    const json = (body: unknown): Promise<void> =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('/api/new-key')) return json('e2e-api-key');
    if (url.includes('/api/v2/user')) {
      const now = new Date().toISOString();
      return json({
        paid: state.paid,
        paidAt: state.paid ? now : null,
        installedAt: now,
        trialStartedAt: null,
      });
    }
    // The checkout page ExtPay opens in a tab (stands in for Stripe's hosted form).
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>mock checkout</h1>' });
  });
}

test('Pro: the real purchase flow unlocks Pro and lazily loads the Pro chunk', async ({ context, extensionId }) => {
  test.skip(!process.env.BOKAL_E2E, 'needs the granted build (build:e2e + BOKAL_E2E=1)');

  const billing = { paid: false };
  await mockExtPay(context, billing);

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Free state: the upsell is shown and the Pro panel is NOT in the DOM (chunk never fetched).
  await expect(panel.getByRole('button', { name: /unlock pro/i })).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByText('Cookie profiles (Pro)')).toHaveCount(0);

  // The user clicks Unlock Pro → engagement is recorded, a key is minted, checkout opens, polling starts.
  await panel.getByRole('button', { name: /unlock pro/i }).click();

  // …the purchase completes on the (mocked) payment page.
  billing.paid = true;

  // The bounded poll must notice and unlock without the user reopening the panel.
  await expect(panel.getByText('Cookie profiles (Pro)')).toBeVisible({ timeout: 25_000 });
  await expect(panel.getByRole('button', { name: /unlock pro/i })).toHaveCount(0);
});

test('Pro: encrypted profile snapshots and restores cookies; a wrong passphrase destroys nothing', async ({
  context,
  extensionId,
}) => {
  test.skip(!process.env.BOKAL_E2E, 'needs the granted build (build:e2e + BOKAL_E2E=1)');

  await mockExtPay(context, { paid: true });

  const site = await context.newPage();
  await site.goto(ORIGIN);

  const [sw] = context.serviceWorkers();
  const names = async (): Promise<string[]> =>
    sw!.evaluate(async (url) => (await chrome.cookies.getAll({ url })).map((c) => c.name), ORIGIN);

  // A user who has already bought Pro: engaged, and holding the ExtPay API key that a completed
  // checkout mints. Without the key, ExtPay short-circuits to paid:false and never calls the server.
  await sw!.evaluate(() => chrome.storage.local.set({ 'bokal:proEngaged': true }));
  await sw!.evaluate(() => chrome.storage.sync.set({ extensionpay_api_key: 'e2e-api-key' }));

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await site.bringToFront();

  await expect(panel.getByText('Cookie profiles (Pro)')).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByText('e2e_session')).toBeVisible();

  // ---- SNAPSHOT: save the site's cookies as an encrypted profile ----
  await panel.getByPlaceholder('Profile name').fill('acct-a');
  await panel.getByRole('checkbox', { name: 'Encrypt' }).check();
  await panel.getByPlaceholder('Passphrase').fill(PASS);
  await panel.getByRole('button', { name: /save current cookies/i }).click();

  const row = panel.locator('li').filter({ hasText: 'acct-a' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('🔒'); // encrypted at rest

  // ---- SAFETY: a WRONG passphrase must not remove a single cookie ----
  expect(await names()).toContain('e2e_session');
  await row.getByRole('button', { name: /^apply$/i }).click(); // encrypted → reveals a passphrase field
  await row.getByPlaceholder('Passphrase').fill('totally-wrong-passphrase');
  await row.getByRole('button', { name: /^apply$/i }).click();

  // apply() decrypts BEFORE it removes, so a failed decrypt must leave the jar untouched.
  await expect
    .poll(names, { timeout: 10_000, message: 'a wrong passphrase deleted cookies — decrypt-before-remove is broken' })
    .toContain('e2e_session');

  // ---- RESTORE: delete the cookie, then apply the profile with the RIGHT passphrase ----
  await sw!.evaluate(async (url) => { await chrome.cookies.remove({ url, name: 'e2e_session' }); }, ORIGIN);
  expect(await names()).not.toContain('e2e_session');

  await row.getByRole('button', { name: /^apply$/i }).click();
  await row.getByPlaceholder('Passphrase').fill(PASS);
  await row.getByRole('button', { name: /^apply$/i }).click();

  // Restored from the encrypted blob.
  await expect.poll(names, { timeout: 10_000 }).toContain('e2e_session');
});
