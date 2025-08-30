import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e/production',
  fullyParallel: false, // Run sequentially for production
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // More retries for production flakiness
  workers: 1, // Single worker for production to avoid rate limiting
  timeout: 60000, // Longer timeout for production
  expect: {
    timeout: 20000,
  },
  reporter: [
    ['html', { outputFolder: './playwright-report-production-smoke' }],
    ['json', { outputFile: './test-results/production-smoke-results.json' }],
    ['list'],
    ['github'] // Good for CI monitoring
  ],
  use: {
    baseURL: 'https://swap.gala.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // More conservative settings for production
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'production-smoke-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    // Only test Chrome on production to minimize load
    // Add other browsers only if needed for critical monitoring
  ],
  webServer: {
    command: 'echo "Using remote production server for smoke tests"',
    url: 'https://swap.gala.com',
    reuseExistingServer: true,
    timeout: 10 * 1000,
  },
  globalSetup: './src/tests/setup/production-setup.ts',
});