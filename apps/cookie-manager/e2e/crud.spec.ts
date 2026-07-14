import { test, expect } from './fixtures';
import { createServer, type Server } from 'node:http';

// A real end-to-end run: a real page on a real origin, real cookies, driven entirely through the
// extension's own UI, with every result verified against chrome.cookies (ground truth) rather than
// just the DOM. This closes the gap the older specs called out — they could only assert that the
// granted UI *rendered*, never that CRUD actually worked through it.
//
// The trick that makes it possible: the panel resolves its target via
// chrome.tabs.query({active: true, lastFocusedWindow: true}) and re-reads on tabs.onActivated. So we
// open the panel in one tab, then bring the SITE tab to the front — the panel (now backgrounded)
// binds to the site exactly as the real side panel does when it sits beside the active tab.

const PORT = 39517;
const ORIGIN = `http://localhost:${PORT}`;

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

test('full cookie CRUD through the real UI, against a real site', async ({ context, extensionId }) => {
  test.skip(!process.env.BOKAL_E2E, 'needs the granted build (build:e2e + BOKAL_E2E=1)');

  // The flagship privacy claim, asserted in a real browser: a free user never touches the billing
  // server. Recorded across the whole run and checked at the end.
  const extpayHits: string[] = [];
  context.on('request', (r) => {
    if (r.url().includes('extensionpay.com')) extpayHits.push(r.url());
  });

  const site = await context.newPage();
  await site.goto(ORIGIN);

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Bind the panel to the site tab (see header comment).
  await site.bringToFront();

  const [sw] = context.serviceWorkers();
  const cookiesOnSite = async (): Promise<{ name: string; value: string }[]> =>
    sw!.evaluate(
      async (url) => (await chrome.cookies.getAll({ url })).map((c) => ({ name: c.name, value: c.value })),
      ORIGIN,
    );

  // ---- READ: the cookie the server set must show up in the panel ----
  await expect(panel.getByText('e2e_session')).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByText(/localhost/)).toBeVisible();

  // ---- CREATE: add a cookie through the UI ----
  await panel.getByRole('button', { name: /add cookie/i }).click();
  await panel.locator('input').first().fill('e2e_added'); // Name
  await panel.locator('textarea').fill('hello-bokal'); // Value
  // http://localhost is a secure origin, but keep the cookie plain so the http page can hold it.
  await panel.getByRole('checkbox', { name: 'Secure' }).uncheck();
  await panel.getByRole('button', { name: /^save$/i }).click();

  await expect(panel.getByText('e2e_added')).toBeVisible();
  await expect(panel.getByText('hello-bokal')).toBeVisible();
  // Ground truth: it really exists in Chrome's cookie jar, not just in the DOM.
  expect(await cookiesOnSite()).toContainEqual({ name: 'e2e_added', value: 'hello-bokal' });

  // ---- UPDATE: edit the value (edit-as-replace, no orphan duplicate) ----
  await panel.getByRole('button', { name: /e2e_added/ }).first().click();
  await panel.locator('textarea').fill('edited-value');
  await panel.getByRole('button', { name: /^save$/i }).click();

  await expect(panel.getByText('edited-value')).toBeVisible();
  const afterEdit = await cookiesOnSite();
  expect(afterEdit).toContainEqual({ name: 'e2e_added', value: 'edited-value' });
  // The edit must REPLACE, not duplicate.
  expect(afterEdit.filter((c) => c.name === 'e2e_added')).toHaveLength(1);

  // ---- PROTECT: a protected cookie cannot be deleted (the M9 Critical, enforced for real) ----
  await panel.getByRole('button', { name: /Protect e2e_added from deletion/i }).click();
  await expect(panel.getByRole('button', { name: /Delete e2e_added/i })).toBeDisabled();
  // Unprotect to continue.
  await panel.getByRole('button', { name: /Unprotect e2e_added/i }).click();
  await expect(panel.getByRole('button', { name: /Delete e2e_added/i })).toBeEnabled();

  // ---- DELETE: remove it through the UI (confirm() dialog) ----
  panel.once('dialog', (d) => void d.accept());
  await panel.getByRole('button', { name: /Delete e2e_added/i }).click();

  await expect(panel.getByText('e2e_added')).toHaveCount(0);
  expect((await cookiesOnSite()).map((c) => c.name)).not.toContain('e2e_added');
  // The server's cookie is untouched — we deleted precisely one thing.
  expect((await cookiesOnSite()).map((c) => c.name)).toContain('e2e_session');

  // ---- PRIVACY: a free user made zero requests to the billing server ----
  expect(extpayHits, `free user contacted extensionpay.com: ${extpayHits.join(', ')}`).toEqual([]);
});
