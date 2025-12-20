import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';

const patButtonSelector = 'button[class*="patButton"]';

test.describe('Member Experience', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Patting content succeeds without auth modal', async ({ page }) => {
    await page.goto('/');
    const patButton = page.locator(patButtonSelector).first();
    await patButton.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(patButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('Summary editor enforces context scoring and PATCHes updates', async ({ page }) => {
    await page.goto('/');
    const firstLink = page.locator('a[href^="/pat/"]').first();
    const targetHref = await firstLink.getAttribute('href');
    expect(targetHref).toBeTruthy();
    await page.goto(targetHref!);

    const editButton = page.getByRole('button', { name: /refine summary/i });
    await editButton.waitFor();
    await editButton.click();

    const textarea = page.getByRole('textbox');
    await textarea.fill('Short text');
    const saveButton = page.getByRole('button', { name: /save summary/i });
    await expect(saveButton).toBeDisabled();

    const articleBody = await page.locator('div[class*="content"]').first().innerText();
    const contextualSummary = articleBody.slice(0, 240) || 'Patreek contextual summary drawn from article body.';
    await textarea.fill(contextualSummary);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(page.getByText(/Summary updated! You earned Pat Coins/i)).toBeVisible();
  });

  test('Members can access gated pages', async ({ page }) => {
    await page.goto('/community');
    await expect(page.getByText(/Community Standings/i)).toBeVisible();

    await page.goto('/u/testeradmin');
    await expect(page.getByText('@testeradmin', { exact: false })).toBeVisible();
  });
});
