import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e/staging',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45000,
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['html', { outputFolder: './playwright-report-staging-comprehensive' }],
    ['json', { outputFile: './test-results/staging-comprehensive-results.json' }],
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
      name: 'staging-comprehensive-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'staging-comprehensive-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'staging-comprehensive-webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'staging-comprehensive-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'echo "Using remote staging server for comprehensive tests"',
    url: 'https://dex-frontend-test1.defi.gala.com',
    reuseExistingServer: true,
    timeout: 10 * 1000,
  },
  globalSetup: './src/tests/setup/staging-setup.ts',
});