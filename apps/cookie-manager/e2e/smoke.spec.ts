import { test, expect } from './fixtures';

// Build-agnostic: the side panel must mount cleanly with no console errors in either permission
// state. Waits for a steady state (at least one button rendered) so async refresh()-time console
// errors are captured, not just the initial paint.
test('side panel mounts cleanly with no console errors', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.getByRole('button').first()).toBeVisible();
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

// Normal build only (no WAFER_E2E). Self-skips deterministically on the e2e build.
test('without host access, the panel shows the grant gate', async ({ context, extensionId }) => {
  test.skip(!!process.env.WAFER_E2E, 'normal (non-e2e) build only');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.getByRole('button', { name: /grant access/i })).toBeVisible();
});
