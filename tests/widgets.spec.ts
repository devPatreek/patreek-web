import { test, expect } from '@playwright/test';

test.describe('Widget Rendering', () => {
  test('Weather and Crypto widgets mount', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#weather-widget')).toBeVisible();
    await expect(page.locator('#crypto-widget')).toBeVisible();
  });
});
