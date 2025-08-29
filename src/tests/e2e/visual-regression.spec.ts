import { test, expect } from '@playwright/test';
import { handlePrivacyConsent } from '../helpers/privacy-consent';
import { setupWalletMock } from '../helpers/wallet-mock';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup environment-aware wallet mock
    await setupWalletMock(page);
    
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
  });

  test('should match homepage layout', async ({ page }) => {
    // Wait for content to load
    await expect(page.getByText('Gala DEX')).toBeVisible();
    
    // Take full page screenshot - using update snapshots approach
    await expect(page).toHaveScreenshot('homepage.png', { threshold: 0.3 });
  });

  test('should match wallet connection states', async ({ page }) => {
    // Initial disconnected state
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    await expect(page.locator('main')).toHaveScreenshot('wallet-disconnected.png', { threshold: 0.3 });

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
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 10000 });
    
    // Connected state
    await expect(page.locator('main')).toHaveScreenshot('wallet-connected.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });

  test('should match swap interface states', async ({ page }) => {
    // Empty swap interface
    await expect(page.locator('h1, h2, h3').filter({ hasText: /swap/i }).or(page.getByText('Swap Tokens'))).toBeVisible();
    await expect(page.locator('main')).toHaveScreenshot('swap-empty.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // With amounts entered
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    
    // Wait for calculation and UI updates
    await expect(page.getByLabel('To')).toHaveValue('2.500000');
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toHaveScreenshot('swap-with-amounts.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // With exchange rate details visible
    await expect(page.getByText('Exchange Rate:')).toBeVisible();
    await expect(page.locator('main')).toHaveScreenshot('swap-with-details.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });

  test('should match token selection dropdowns', async ({ page }) => {
    // Open from token dropdown
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    
    // Screenshot of dropdown
    await expect(page.locator('body')).toHaveScreenshot('from-token-dropdown.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Close and open to token dropdown
    await page.keyboard.press('Escape');
    const toTokenSelect = page.locator('[role="combobox"]').last();
    await toTokenSelect.click();

    await expect(page.locator('body')).toHaveScreenshot('to-token-dropdown.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
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
        // Set from token if not GALA
        const fromTokenSelect = page.locator('[role="combobox"]').first();
        await fromTokenSelect.click();
        await page.getByRole('option', { name: pair.from }).click();
      }

      // Set to token if not USDC
      if (pair.to !== 'USDC') {
        // Set to token if not USDC
        const toTokenSelect = page.locator('[role="combobox"]').last();
        await toTokenSelect.click();
        await page.getByRole('option', { name: pair.to }).click();
      }

      // Enter amount
      const fromAmountInput = page.getByLabel('From');
      await fromAmountInput.fill(pair.amount);

      // Wait for calculation
      await page.waitForTimeout(500);

      // Screenshot
      await expect(page.locator('main')).toHaveScreenshot(`swap-${pair.from}-to-${pair.to}.png`, { 
        threshold: 0.3,
        timeout: 10000 
      });

      // Reset for next iteration
      await page.reload();
      await expect(page.getByText('Gala DEX')).toBeVisible();
    }
  });

  test('should match responsive design on mobile', async ({ page }) => {
    // Set mobile viewport and wait for layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
    await page.waitForTimeout(500);
    
    // Mobile layout
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-homepage.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Mobile swap interface
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    await expect(page.getByLabel('To')).toHaveValue('2.500000');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('mobile-swap-interface.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Mobile token dropdown
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('mobile-token-dropdown.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });

  test('should match dark mode appearance', async ({ page }) => {
    // Set dark color scheme and add dark class for comprehensive dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);

    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page).toHaveScreenshot('dark-mode-homepage.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Dark mode swap interface with interaction
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    await expect(page.getByLabel('To')).toHaveValue('2.500000');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('dark-mode-swap.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });
});