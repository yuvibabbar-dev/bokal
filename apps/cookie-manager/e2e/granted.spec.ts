import { test, expect } from './fixtures';

// Runs against the WAFER_E2E build (host_permissions granted at install), so the grant CTA
// is skipped and cookie APIs work without the native dialog.
test('adds a cookie and shows it in the list', async ({ context, extensionId }) => {
  const site = await context.newPage();
  await site.goto('https://example.com');

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // If the grant CTA is present, this build wasn't the e2e build — skip.
  if (await panel.getByRole('button', { name: /grant access/i }).isVisible().catch(() => false)) {
    test.skip(true, 'run against build:e2e (host_permissions) to exercise CRUD');
  }

  await panel.getByRole('button', { name: /add cookie/i }).click();
  await panel.getByRole('textbox').first().fill('e2e_test');
  await panel.getByRole('button', { name: /^save$/i }).click();
  await expect(panel.getByText('e2e_test')).toBeVisible();
});
