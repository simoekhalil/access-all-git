import { test, expect } from '@playwright/test';
import { PageInteractions } from '../helpers/page-interactions';
import { WaitStrategies } from '../helpers/wait-strategies';
import { testSelectors } from '../helpers/test-selectors';

test.describe('Mobile Responsiveness', () => {
  const mobileDevices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Samsung Galaxy', width: 360, height: 640 },
  ];

  mobileDevices.forEach(device => {
    test(`should be responsive on ${device.name}`, async ({ page }) => {
      const interactions = new PageInteractions(page);
      const waitStrategies = new WaitStrategies(page);
      
      // Set mobile viewport
      await interactions.setMobileViewport(device.width, device.height);
      await interactions.setupPage();

      // Basic elements should be visible and properly sized
      await expect(page.getByText(testSelectors.heading)).toBeVisible();
      await expect(page.getByText(testSelectors.connectWallet)).toBeVisible();
      await expect(page.getByText(testSelectors.swapTokens)).toBeVisible();

      // Swap interface should fit in viewport - use a more reliable selector
      const swapCard = page.locator('text="Swap Tokens"').locator('..').first();
      
      await waitStrategies.retryAction(async () => {
        const cardBox = await swapCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThanOrEqual(device.width - 32);
          expect(cardBox.x).toBeGreaterThanOrEqual(0);
        }
      });

      // Form inputs should be accessible
      const fromInput = page.getByLabel(testSelectors.fromLabel);
      await expect(fromInput).toBeVisible();
      
      // Test input functionality
      await fromInput.fill('100');
      
      const toInput = page.getByLabel(testSelectors.toLabel);
      await expect(toInput).toHaveValue('2.500000', { timeout: 10000 });

      // Token selectors should work on mobile
      await waitStrategies.retryAction(async () => {
        const fromTokenSelect = page.locator(testSelectors.fromTokenSelect);
        await fromTokenSelect.click();
        
        // Dropdown should be visible and not overflow
        await expect(page.getByText('ETH', { exact: true })).toBeVisible({ timeout: 5000 });
        await page.keyboard.press('Escape'); // Close dropdown
      });

      console.log(`✓ ${device.name} (${device.width}x${device.height}) responsive test passed`);
    });
  });

  test('should handle touch interactions properly', async ({ page }) => {
    const interactions = new PageInteractions(page);
    const waitStrategies = new WaitStrategies(page);
    
    await interactions.setMobileViewport(375, 667);
    await interactions.setupPage();

    // Test touch-based amount input
    const fromAmountInput = page.getByLabel(testSelectors.fromLabel);
    await fromAmountInput.fill('100');

    await interactions.verifySwapCalculation('100', '2.500000');

    // Test dropdown interaction with touch
    await waitStrategies.retryAction(async () => {
      await interactions.selectToken('from', 'ETH');
      await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('ETH');
    });

    // Test directional swap with touch
    await interactions.swapTokens();

    // Verify tokens swapped properly
    await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('USDC');
    await expect(page.locator(testSelectors.toTokenSelect)).toContainText('ETH');
  });

  test('should scroll properly on small screens', async ({ page }) => {
    const interactions = new PageInteractions(page);
    
    await interactions.setMobileViewport(320, 568); // Very small screen
    await interactions.setupPage();

    // Page should be scrollable if content exceeds viewport
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 568;

    if (bodyHeight > viewportHeight) {
      // Test scrolling to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      
      // Should be able to interact with elements at bottom
      const swapButton = page.getByRole('button', { name: 'Swap' });
      await expect(swapButton).toBeVisible();

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await expect(page.getByText(testSelectors.heading)).toBeVisible();
    }
  });

  test('should maintain usability in landscape mode', async ({ page }) => {
    const interactions = new PageInteractions(page);
    const waitStrategies = new WaitStrategies(page);
    
    await interactions.setMobileViewport(667, 375); // Landscape
    await interactions.setupPage();

    // All key elements should still be accessible
    await expect(page.getByText(testSelectors.heading)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testSelectors.swapTokens)).toBeVisible({ timeout: 10000 });

    // Test form interactions in landscape
    await interactions.fillSwapAmount('100');
    await interactions.verifySwapCalculation('100', '2.500000');

    // Test token switching in landscape
    await waitStrategies.retryAction(async () => {
      await interactions.swapTokens();
      
      // Wait for tokens to swap and verify with proper timeout
      await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('USDC', { timeout: 10000 });
      await expect(page.locator(testSelectors.toTokenSelect)).toContainText('GALA', { timeout: 10000 });
    });
  });

  test('should handle text scaling appropriately', async ({ page }) => {
    const interactions = new PageInteractions(page);
    
    await interactions.setMobileViewport(375, 667);
    
    // Simulate increased text size (accessibility feature)
    await page.addInitScript(() => {
      document.documentElement.style.fontSize = '20px'; // Increased from default ~16px
    });

    await interactions.setupPage();

    // Elements should still be accessible and readable
    await expect(page.getByText(testSelectors.heading)).toBeVisible();
    await expect(page.getByText(testSelectors.swapTokens)).toBeVisible();
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible();

    // Form should still be functional with larger text
    await interactions.fillSwapAmount('100');
    await interactions.verifySwapCalculation('100', '2.500000');
  });
});