import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { config } from 'dotenv';

/**
 * Playwright Configuration
 * 
 * See https://playwright.dev/docs/test-configuration
 * 
 * Environment Variables:
 * - Loads from .env.test (test-specific) or .env (fallback)
 * - PLAYWRIGHT_TEST_BASE_URL: Override base URL for tests (default: http://localhost:3000)
 * - TEST_USER_EMAIL: Test user email (default: tochie+local@gmail.com)
 * - TEST_USER_PASSWORD: Test user password (default: Testing!123)
 * - ADMIN_PASSCODE: Admin portal passcode (default: 0000)
 */

// Load environment variables from .env.test (for tests) or .env (fallback)
// Playwright runs in Node.js, so we need to explicitly load .env files
const envFile = path.resolve(__dirname, '.env.test');
const fallbackEnvFile = path.resolve(__dirname, '.env');

// Try .env.test first, then fall back to .env
config({ path: envFile });
config({ path: fallbackEnvFile, override: false }); // Don't override if .env.test was loaded

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    /* Retain video only on failure for easier debugging */
    video: 'retain-on-failure',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and Webkit can be enabled later for cross-browser testing
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
