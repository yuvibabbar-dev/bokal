import { test, expect } from './fixtures';

test('side panel loads and shows the grant CTA', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.getByRole('button', { name: /grant access/i })).toBeVisible();
  expect(errors).toEqual([]);
});
