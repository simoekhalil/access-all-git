import { test, expect } from '@playwright/test';

// Helper function to handle privacy consent banners
async function handlePrivacyConsent(page: any) {
  try {
    // Wait a bit for banners to load
    await page.waitForTimeout(2000);
    
    // Common privacy banner selectors - try multiple patterns
    const privacySelectors = [
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("Allow All")', 
      'button:has-text("I Accept")',
      'button:has-text("Agree")',
      'button:has-text("OK")',
      'button:has-text("Continue")',
      '[data-testid*="accept"]',
      '[id*="accept"]',
      '[class*="accept"]',
      '[aria-label*="accept" i]',
      'button[title*="accept" i]',
      // Cookie specific
      'button:has-text("Accept Cookies")',
      'button:has-text("Allow Cookies")',
      '[data-testid*="cookie"]',
      '[id*="cookie"]',
      // Close/dismiss buttons
      'button:has-text("×")',
      'button:has-text("✕")',
      '[aria-label*="close" i]',
      '[aria-label*="dismiss" i]'
    ];
    
    for (const selector of privacySelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          console.log(`Clicked privacy consent: ${selector}`);
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  } catch (error) {
    console.log('No privacy consent banner found or already dismissed');
  }
}

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock ethereum provider before navigation
    await page.addInitScript(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x1';
          }
          if (method === 'eth_getBalance') {
            return '0x1bc16d674ec80000'; // 2 ETH in wei
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
    
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
  });

  test('should work correctly across all browsers', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);

    // Basic functionality should work on all browsers
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    await expect(page.locator('h1, h2, h3').filter({ hasText: /swap/i }).or(page.getByText('Swap Tokens'))).toBeVisible();

    // Test form interactions
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    
    // Should calculate on all browsers
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue('2.500000');

    // Test dropdown functionality
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    
    await expect(page.getByText('ETH', { exact: true })).toBeVisible();
    await page.getByText('ETH', { exact: true }).click();

    await expect(page.locator('[role="combobox"]').first().getByText('ETH')).toBeVisible();

    // Test directional swap - using data-testid for reliability
    const swapArrow = page.getByTestId('swap-direction-button');
    await swapArrow.click();

    // Verify swap worked - wait for state updates to complete
    await page.waitForTimeout(1500);
    await expect(page.locator('[role="combobox"]').first()).toContainText('USDC');
    await expect(page.locator('[role="combobox"]').last()).toContainText('ETH');
  });

  test('should handle wallet simulation consistently', async ({ page, browserName }) => {
    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    
    // Should work on all browsers - look for Connected badge with more flexible timeout
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 15000 });
    
    // Also verify the wallet address is displayed
    await expect(page.locator('.text-sm.font-mono').first()).toBeVisible({ timeout: 5000 });
    
    console.log(`Wallet connection successful on ${browserName}`);
  });

  test('should maintain performance across browsers', async ({ page, browserName }) => {
    // Start performance monitoring
    const startTime = Date.now();

    // Load page and perform typical user actions
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
    await expect(page.getByText('Gala DEX')).toBeVisible();

    // Fill form multiple times to test responsiveness
    const fromAmountInput = page.getByLabel('From');
    
    for (let i = 1; i <= 5; i++) {
      await fromAmountInput.fill(`${i * 100}`);
      await expect(page.getByLabel('To')).toHaveValue(`${(i * 100 * 0.025).toFixed(6)}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Performance test completed in ${duration}ms on ${browserName}`);
    
    // Performance should be reasonable (under 5 seconds for this test)
    expect(duration).toBeLessThan(5000);
  });

  test('should handle edge cases consistently', async ({ page, browserName }) => {
    console.log(`Testing edge cases on ${browserName}`);

    // Test very large numbers
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('999999999');
    
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue('24999999.975000');

    // Test very small numbers
    await fromAmountInput.fill('0.000001');
    await expect(toAmountInput).toHaveValue('0.000000');

    // Test rapid input changes
    for (let i = 0; i < 10; i++) {
      await fromAmountInput.fill(`${Math.random() * 1000}`);
    }

    // Should still be functional
    await fromAmountInput.fill('100');
    await expect(toAmountInput).toHaveValue('2.500000');

    console.log(`Edge case testing passed on ${browserName}`);
  });

  test('should support keyboard navigation', async ({ page, browserName }) => {
    console.log(`Testing keyboard navigation on ${browserName}`);

    // Focus on from amount input explicitly
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.focus();
    await expect(fromAmountInput).toBeFocused();

    // Type amount
    await page.keyboard.type('100');
    await expect(fromAmountInput).toHaveValue('100');

    // Tab to token selector
    await page.keyboard.press('Tab');
    
    // Open dropdown with keyboard
    await page.keyboard.press('Enter');
    await expect(page.getByText('ETH', { exact: true })).toBeVisible();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    console.log(`Keyboard navigation successful on ${browserName}`);
  });
});