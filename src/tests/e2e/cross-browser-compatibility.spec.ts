import { test, expect } from '@playwright/test';
import { PageInteractions } from '../helpers/page-interactions';
import { WaitStrategies } from '../helpers/wait-strategies';
import { testSelectors } from '../helpers/test-selectors';

test.describe('Cross-Browser Compatibility', () => {
  let interactions: PageInteractions;
  let waitStrategies: WaitStrategies;

  test.beforeEach(async ({ page }) => {
    interactions = new PageInteractions(page);
    waitStrategies = new WaitStrategies(page);
    await interactions.setupPage();
  });

  test('should work correctly across all browsers', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);

    // Basic functionality should work on all browsers
    await expect(page.getByText(testSelectors.heading)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testSelectors.swapTokens)).toBeVisible({ timeout: 10000 });

    // Test form interactions
    await interactions.fillSwapAmount('100');
    
    // Should calculate on all browsers
    await interactions.verifySwapCalculation('100', '2.500000');

    // Test dropdown functionality with proper selectors
    await waitStrategies.retryAction(async () => {
      await interactions.selectToken('from', 'ETH');
      await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('ETH', { timeout: 10000 });
    });

    // Test directional swap
    await waitStrategies.retryAction(async () => {
      await interactions.swapTokens();

      // Verify swap worked - wait for tokens to update  
      await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('USDC', { timeout: 10000 });
      await expect(page.locator(testSelectors.toTokenSelect)).toContainText('ETH', { timeout: 10000 });
    });
  });

  test('should handle wallet simulation consistently', async ({ page, browserName }) => {
    console.log(`Testing wallet on ${browserName}`);

    // Connect wallet
    await interactions.connectWallet();
    
    // Should work on all browsers - look for Connected badge
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 15000 });
    
    // Also verify the wallet address is displayed
    await expect(page.locator(testSelectors.walletAddress).first()).toBeVisible({ timeout: 5000 });

    console.log(`Wallet connection successful on ${browserName}`);
  });

  test('should maintain performance across browsers', async ({ page, browserName }) => {
    console.log(`Testing performance on ${browserName}`);
    
    const startTime = Date.now();
    
    // Test a series of interactions
    await interactions.fillSwapAmount('100');
    await interactions.swapTokens();
    await interactions.fillSwapAmount('50');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (adjust based on your needs)
    expect(duration).toBeLessThan(10000); // 10 seconds max
    
    console.log(`Performance test completed in ${duration}ms on ${browserName}`);
  });

  test('should support keyboard navigation', async ({ page, browserName }) => {
    console.log(`Testing keyboard navigation on ${browserName}`);
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Should focus on Connect Wallet button
    await page.keyboard.press('Tab'); // Should focus on first input
    
    const fromInput = page.getByLabel(testSelectors.fromLabel);
    await expect(fromInput).toBeFocused({ timeout: 5000 });
    
    // Type using keyboard
    await page.keyboard.type('123');
    await expect(fromInput).toHaveValue('123');
    
    console.log(`Keyboard navigation successful on ${browserName}`);
  });

  test('should handle edge cases consistently', async ({ page, browserName }) => {
    console.log(`Testing edge cases on ${browserName}`);
    
    // Test very large numbers
    await interactions.fillSwapAmount('999999999');
    
    // Should handle gracefully
    await waitStrategies.retryAction(async () => {
      const toInput = page.getByLabel(testSelectors.toLabel);
      const value = await toInput.inputValue();
      expect(parseFloat(value)).toBeGreaterThan(0);
    });
    
    // Test rapid interactions
    await interactions.swapTokens();
    await page.waitForTimeout(100);
    await interactions.swapTokens();
    
    // Should remain stable
    await expect(page.locator(testSelectors.fromTokenSelect)).toBeVisible();
    
    console.log(`Edge case testing passed on ${browserName}`);
  });
});