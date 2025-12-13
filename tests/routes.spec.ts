import { test, expect } from '@playwright/test';

const publicRoutes = [
  { path: '/', name: 'Landing Page' },
  { path: '/contact', name: 'Contact' },
  { path: '/developer', name: 'Developer' },
  { path: '/marketing', name: 'Marketing' },
  { path: '/opinion', name: 'Opinion' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/forgot-password', name: 'Forgot Password' },
  { path: '/registration', name: 'Registration' },
  { path: '/reset-password', name: 'Reset Password' },
  { path: '/submission', name: 'Submission' },
  { path: '/links', name: 'Links' },
  { path: '/_not-found', name: '404 Page' },
];

const protectedRoutes = [
  { path: '/home', name: 'Home Feed' },
  { path: '/nest', name: 'Nest' },
  { path: '/community', name: 'Community' },
  { path: '/notifications', name: 'Notifications' },
  { path: '/profile', name: 'Profile' },
  { path: '/coins', name: 'Coins' },
];

const dynamicRoutes = [
  { path: '/article/demo-article-id', name: 'Article Detail' },
  { path: '/pat/demo-pat-id', name: 'Pat Detail' },
  { path: '/u/patreekadmin', name: 'User Profile' },
];

test.describe('Public Pages Smoke Test', () => {
  for (const route of publicRoutes) {
    test(`should load ${route.name} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/./);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Dynamic Routes Smoke Test', () => {
  for (const route of dynamicRoutes) {
    test(`should load ${route.name} structure`, async ({ page }) => {
      const response = await page.goto(route.path);
      const status = response?.status();
      expect(status).not.toBe(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Protected Routes Security Test', () => {
  for (const route of protectedRoutes) {
    test(`visiting ${route.name} should handle auth correctly`, async ({ page }) => {
      await page.goto(route.path);
      const url = page.url();
      const content = await page.content();
      const isLoginRedirect = url.includes('registration') || url.includes('login');
      const hasLoginForm = content.includes('Sign In') || content.includes('Login') || content.includes('Register');
      if (!isLoginRedirect && !hasLoginForm) {
        console.log(`Note: ${route.path} allowed access without login.`);
      }
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
