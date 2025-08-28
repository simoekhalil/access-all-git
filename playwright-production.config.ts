import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 45000, // Longer timeout for production
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['html', { outputFolder: './playwright-report-production' }],
    ['json', { outputFile: './test-results/playwright-production-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'https://swap.gala.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'production-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'production-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'production-webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'production-mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'production-mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'echo "Using remote production server"',
    url: 'https://swap.gala.com',
    reuseExistingServer: true,
    timeout: 5 * 1000, // 5 seconds
  },
  // Set environment variable for test environment detection
  globalSetup: './src/tests/setup/production-setup.ts',
});