import { test, expect } from '@playwright/test';

const patButtonSelector = 'button[class*="patButton"]';
const filterPillSelector = 'button[class*="filterPill"]';

test.describe('Guest Experience', () => {
  test('Home feed renders for guests', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('Interaction buttons prompt auth modal', async ({ page }) => {
    await page.goto('/');

    const patButton = page.locator(patButtonSelector).first();
    await patButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /go home/i }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const subscribeButton = page.getByRole('button', { name: /subscribe/i }).first();
    await subscribeButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Search and category filters update the URL', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder*="Search"]', 'Crypto');
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page).toHaveURL(/query=Crypto/i);

    const categoryPill = page.locator(filterPillSelector).nth(1);
    await categoryPill.waitFor();
    await categoryPill.click();
    await expect(page).toHaveURL(/categoryId=/);
  });

  test('Restricted community page shows auth wall', async ({ page }) => {
    await page.goto('/community');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/unlock this/i)).toBeVisible();
  });
});
