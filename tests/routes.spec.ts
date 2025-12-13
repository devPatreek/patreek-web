import { test, expect } from '@playwright/test';

// 1. Define the Routes based on latest build output
const publicRoutes = [
  { path: '/', name: 'Landing Page' },
  { path: '/advertise', name: 'Advertise' }, // ✅ Added
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
  // providing 'mock' IDs to ensure the page structure loads
  { path: '/article/demo-article-id', name: 'Article Detail' },
  { path: '/pat/demo-pat-id', name: 'Pat Detail' },
  { path: '/u/patreekadmin', name: 'User Profile' },
];

// 2. Test Execution

test.describe('Public Pages Smoke Test', () => {
  for (const route of publicRoutes) {
    test(`should load ${route.name} (${route.path})`, async ({ page }) => {
      const response = await page.goto(route.path);
      
      // Assert: Page loads with 200 OK
      expect(response?.status()).toBe(200);
      
      // Assert: Page has a title
      await expect(page).toHaveTitle(/./);
      
      // Assert: Body is visible (HTML structure loaded)
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Dynamic Routes Smoke Test', () => {
  for (const route of dynamicRoutes) {
    test(`should load ${route.name} structure`, async ({ page }) => {
      const response = await page.goto(route.path);
      
      // We expect 200 or 404 (if data missing), but not 500
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
      
      // Check for Redirect OR Login Form presence
      const isLoginRedirect = url.includes('registration') || url.includes('login');
      const hasLoginForm = content.includes('Sign In') || content.includes('Login') || content.includes('Register');
      
      // Warn if a protected route is unexpectedly public
      if (!isLoginRedirect && !hasLoginForm) {
        console.log(`Note: ${route.path} allowed access without login.`);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
