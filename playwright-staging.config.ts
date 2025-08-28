import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['html', { outputFolder: './playwright-report-staging' }],
    ['json', { outputFile: './test-results/playwright-staging-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'https://dex-frontend-test1.defi.gala.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'staging-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'staging-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'staging-webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'staging-mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'staging-mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'echo "Using remote staging server"',
    url: 'https://dex-frontend-test1.defi.gala.com',
    reuseExistingServer: true,
    timeout: 5 * 1000, // 5 seconds
  },
  // Set environment variable for test environment detection
  globalSetup: require.resolve('./src/tests/setup/staging-setup.ts'),
});