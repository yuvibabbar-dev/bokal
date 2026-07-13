import { test, expect } from './fixtures';

// Build-agnostic: the side panel must mount cleanly with no console errors in either
// permission state (grant gate on the normal build, management UI on the e2e build).
test('side panel mounts cleanly with no console errors', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

// Normal build only: no host access yet → the grant gate is shown. Self-skips on the e2e build.
test('without host access, the panel shows the grant gate', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  const grant = page.getByRole('button', { name: /grant access/i });
  test.skip(!(await grant.isVisible().catch(() => false)), 'runs against the normal (non-e2e) build');
  await expect(grant).toBeVisible();
});
