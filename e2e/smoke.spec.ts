import { test, expect } from '@playwright/test';

test('app shell loads with brand and the My Week home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'My Week' })).toBeVisible();
  await expect(page.getByText('Cadence').first()).toBeVisible();
});

test('unknown route shows the friendly not-found', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
});
