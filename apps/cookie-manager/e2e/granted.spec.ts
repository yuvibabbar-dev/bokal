import { test, expect } from './fixtures';

// Runs against the WAFER_E2E build (host_permissions granted at install), so the grant gate is
// skipped and the cookie-management UI renders directly. Self-skips on the normal build.
//
// Note: full CRUD-through-the-UI E2E (add a cookie, see it listed) requires a real side-panel
// binding to an active tab, which a standalone-page harness cannot model — the panel's
// active-tab resolution is ambiguous when it is opened as its own page. That interactive path is
// covered by unit/integration tests (validation, write wrapper, round-trips) and is a documented
// follow-up for a richer harness. Here we assert the granted-state UI renders.
test('with host access granted, the cookie-management UI renders (no grant gate)', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  const grant = page.getByRole('button', { name: /grant access/i });
  test.skip(await grant.isVisible().catch(() => false), 'run against build:e2e (host_permissions) to exercise the granted UI');

  await expect(page.getByRole('button', { name: /add cookie/i })).toBeVisible();
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});
