import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should work correctly across all browsers', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);

    // Basic functionality should work on all browsers
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.getByText('Connect Wallet')).toBeVisible();
    await expect(page.getByText('Swap Tokens')).toBeVisible();

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

    // Test directional swap
    const swapArrow = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await swapArrow.click();

    // Verify swap worked
    await expect(page.locator('[role="combobox"]').first().getByText('USDC')).toBeVisible();
    await expect(page.locator('[role="combobox"]').last().getByText('ETH')).toBeVisible();
  });

  test('should handle wallet simulation consistently', async ({ page, browserName }) => {
    // Mock MetaMask for all browsers
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
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    await page.reload();

    // Connect wallet
    await page.getByText('Connect Wallet').click();
    
    // Should work on all browsers - use more specific selector to avoid toast text
    await expect(page.locator('.text-sm.font-mono').getByText('0x1234...7890')).toBeVisible({ timeout: 10000 });
    
    console.log(`Wallet connection successful on ${browserName}`);
  });

  test('should maintain performance across browsers', async ({ page, browserName }) => {
    // Start performance monitoring
    const startTime = Date.now();

    // Load page and perform typical user actions
    await page.goto('/');
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

    // Tab through interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

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