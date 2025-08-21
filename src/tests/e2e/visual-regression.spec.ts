import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should match homepage layout', async ({ page }) => {
    // Wait for content to load
    await expect(page.getByText('Gala DEX')).toBeVisible();
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should match wallet connection states', async ({ page }) => {
    // Initial disconnected state
    await expect(page.getByText('Connect Wallet')).toBeVisible();
    await expect(page.locator('main')).toHaveScreenshot('wallet-disconnected.png');

    // Mock wallet connection
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x1';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // Connect wallet
    await page.getByText('Connect Wallet').click();
    await expect(page.getByText('0x1234...7890')).toBeVisible({ timeout: 5000 });
    
    // Connected state
    await expect(page.locator('main')).toHaveScreenshot('wallet-connected.png');
  });

  test('should match swap interface states', async ({ page }) => {
    // Empty swap interface
    await expect(page.getByText('Swap Tokens')).toBeVisible();
    await expect(page.locator('[data-testid="swap-interface"]').or(page.locator('main'))).toHaveScreenshot('swap-empty.png');

    // With amounts entered
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    
    // Wait for calculation
    await expect(page.getByLabel('To')).toHaveValue('2.500000');
    await expect(page.locator('main')).toHaveScreenshot('swap-with-amounts.png');

    // With exchange rate details visible
    await expect(page.getByText('Exchange Rate:')).toBeVisible();
    await expect(page.locator('main')).toHaveScreenshot('swap-with-details.png');
  });

  test('should match token selection dropdowns', async ({ page }) => {
    // Open from token dropdown
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    
    // Screenshot of dropdown
    await expect(page.locator('body')).toHaveScreenshot('from-token-dropdown.png');
    
    // Close and open to token dropdown
    await page.keyboard.press('Escape');
    const toTokenSelect = page.locator('[role="combobox"]').last();
    await toTokenSelect.click();
    
    await expect(page.locator('body')).toHaveScreenshot('to-token-dropdown.png');
  });

  test('should match different token pair combinations', async ({ page }) => {
    const tokenPairs = [
      { from: 'GALA', to: 'ETH', amount: '66666.67' },
      { from: 'USDC', to: 'GALA', amount: '100' },
      { from: 'ETH', to: 'TOWN', amount: '1' },
      { from: 'TOWN', to: 'USDC', amount: '100' },
    ];

    for (const pair of tokenPairs) {
      // Set from token if not GALA
      if (pair.from !== 'GALA') {
        const fromTokenSelect = page.locator('[role="combobox"]').first();
        await fromTokenSelect.click();
        await page.getByText(pair.from, { exact: true }).click();
      }

      // Set to token if not USDC
      if (pair.to !== 'USDC') {
        const toTokenSelect = page.locator('[role="combobox"]').last();
        await toTokenSelect.click();
        await page.getByText(pair.to, { exact: true }).click();
      }

      // Enter amount
      const fromAmountInput = page.getByLabel('From');
      await fromAmountInput.fill(pair.amount);

      // Wait for calculation
      await page.waitForTimeout(500);

      // Screenshot
      await expect(page.locator('main')).toHaveScreenshot(`swap-${pair.from}-to-${pair.to}.png`);

      // Reset for next iteration
      await page.reload();
      await expect(page.getByText('Gala DEX')).toBeVisible();
    }
  });

  test('should match responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile layout
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-homepage.png');

    // Mobile swap interface
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('mobile-swap-interface.png');

    // Mobile token dropdown
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    
    await expect(page).toHaveScreenshot('mobile-token-dropdown.png');
  });

  test('should match dark mode appearance', async ({ page }) => {
    // Toggle to dark mode (assuming there's a theme toggle)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page).toHaveScreenshot('dark-mode-homepage.png');

    // Dark mode swap interface
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('dark-mode-swap.png');
  });
});