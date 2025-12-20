import { expect, Page } from '@playwright/test';

/**
 * Test Credentials Configuration
 * 
 * Uses environment variables from .env files for security.
 * Falls back to safe defaults for local development only.
 * 
 * Set these in your .env.local or .env.test file:
 * - TEST_USER_EMAIL: Email for test user login
 * - TEST_USER_PASSWORD: Password for test user login
 * - ADMIN_PASSCODE: Admin portal passcode (if different from default)
 */
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'testeradmin@patreek.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Chrys0st0M';
const ADMIN_LOGIN_EMAIL = process.env.ADMIN_LOGIN_EMAIL || 'testeradmin@patreek.com';
const ADMIN_LOGIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || 'Chrys0st0M';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? '0000';

async function performSignIn(page: Page, email: string, password: string) {
  await page.goto('/registration');

  const signInToggle = page.getByRole('button', { name: /sign in/i });
  if (await signInToggle.isVisible()) {
    await signInToggle.click();
  }

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  await expect(page).toHaveURL(/\/u\//);
}

export async function loginUser(page: Page) {
  await performSignIn(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
}

export async function loginAsAdmin(page: Page) {
  await performSignIn(page, ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD);
}

export async function loginAdmin(page: Page) {
  await page.goto('/admin/passcode');

  const passcodeInput = page.getByLabel(/passcode/i);
  await passcodeInput.fill(ADMIN_PASSCODE);
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/admin\/dashboard/);
}
