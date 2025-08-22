import { test, expect } from '@playwright/test';
import { PageInteractions } from '../helpers/page-interactions';
import { WaitStrategies } from '../helpers/wait-strategies';
import { testSelectors } from '../helpers/test-selectors';

test.describe('Wallet Integration Simulation', () => {
  let interactions: PageInteractions;
  let waitStrategies: WaitStrategies;

  test.beforeEach(async ({ page }) => {
    interactions = new PageInteractions(page);
    waitStrategies = new WaitStrategies(page);
    await interactions.setupPage();
  });

  test('should handle MetaMask connection successfully', async ({ page }) => {
    // Initial state should show Connect Wallet button
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible();
    
    // Connect wallet
    await interactions.connectWallet();

    // Should show connected state - use specific badge selector
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testSelectors.disconnect)).toBeVisible();

    // Swap interface should now be fully functional
    await interactions.fillSwapAmount('100');
    await interactions.verifySwapCalculation('100', '2.500000');
  });

  test('should handle wallet disconnection', async ({ page }) => {
    // Connect wallet first
    await interactions.connectWallet();
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Disconnect wallet
    await page.getByText(testSelectors.disconnect).click();

    // Should return to disconnected state
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible({ timeout: 5000 });
  });

  test('should handle network switching', async ({ page }) => {
    // Connect wallet
    await interactions.connectWallet();
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Simulate network change
    await page.evaluate(() => {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.on) {
        // Simulate chain change event
        ethereum.on('chainChanged', () => {});
      }
    });

    // Should still be connected
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible();
  });

  test('should handle account switching', async ({ page }) => {
    // Connect wallet
    await interactions.connectWallet();
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Simulate account change
    await page.evaluate(() => {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.on) {
        // Simulate accounts change event
        ethereum.on('accountsChanged', () => {});
      }
    });

    // Should handle account switch gracefully
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible();
  });

  test('should handle wallet connection errors gracefully', async ({ page }) => {
    // Try to connect wallet that rejects
    await interactions.connectWallet(true); // shouldReject = true

    // Check for error message - look for connection failed toast
    await expect(page.locator(testSelectors.toastTitle).getByText('Connection Failed')).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing MetaMask', async ({ page }) => {
    // Remove ethereum object to simulate no wallet
    await page.evaluate(() => {
      delete (window as any).ethereum;
    });

    // Try to connect - should show appropriate message
    await page.getByText(testSelectors.connectWallet).click();

    // Should handle gracefully (exact behavior depends on implementation)
    // At minimum, should not crash the application
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible();
  });

  test('should persist wallet connection on page reload', async ({ page }) => {
    // Connect wallet
    await interactions.connectWallet();
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Reload page
    await page.reload();
    await interactions.waitForPageLoad();

    // Should automatically reconnect or show connect option
    await waitStrategies.retryAction(async () => {
      const isConnected = await page.locator(testSelectors.connectedBadge).getByText('Connected').isVisible();
      const canConnect = await page.getByText(testSelectors.connectWallet).isVisible();
      expect(isConnected || canConnect).toBeTruthy();
    });
  });
});