import { test, expect } from './fixtures';

// This is the BOKAL_E2E build iff the run sets BOKAL_E2E=1 (CI does, after build:e2e). Gating the
// skip on the env var — not a transient DOM read — makes the decision deterministic and avoids the
// grant-gate-then-refresh render flash that could otherwise make this test silently self-skip.
//
// This spec only asserts that the granted-state UI renders. Full CRUD through the UI against a real
// site — including the cookie jar as ground truth — is covered by crud.spec.ts, which binds the
// panel to a live tab by fronting the site tab (the panel re-reads on tabs.onActivated).
test('with host access granted, the cookie-management UI renders (no grant gate)', async ({ context, extensionId }) => {
  test.skip(!process.env.BOKAL_E2E, 'run against build:e2e with BOKAL_E2E=1 to exercise the granted UI');

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Auto-retrying assertions: wait for refresh() to resolve the granted state and render the UI.
  await expect(page.getByRole('button', { name: /add cookie/i })).toBeVisible();
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  // The grant gate must be absent in the granted state.
  await expect(page.getByRole('button', { name: /grant access/i })).toHaveCount(0);
});
