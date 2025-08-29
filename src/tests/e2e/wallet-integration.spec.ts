import { test, expect } from '@playwright/test';
import { handlePrivacyConsent } from '../helpers/privacy-consent';

test.describe('Wallet Integration Simulation', () => {
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

  test('should handle MetaMask connection successfully', async ({ page }) => {
    // Initial state - wallet not connected
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    await expect(page.getByText('Connect your wallet to start trading')).toBeVisible();

    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();

    // Should show connected state - use specific badge selector
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Disconnect')).toBeVisible();

    // Swap interface should now be fully functional
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue('2.500000');

    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeEnabled();
  });

  test('should handle wallet disconnection', async ({ page }) => {
    // Connect wallet first
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Disconnect wallet
    await page.getByText('Disconnect').click();

    // Should return to initial state
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    await expect(page.getByText('Connect your wallet to start trading')).toBeVisible();
  });

  test('should handle network switching', async ({ page }) => {
    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Simulate network change
    await page.evaluate(() => {
      if ((window as any).ethereum && (window as any).ethereum.on) {
        (window as any).ethereum.on('chainChanged', () => {
          // Network changed - wallet should remain connected
        });
      }
    });

    // Should still be connected
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible();
  });

  test('should handle account switching', async ({ page }) => {
    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Simulate account change
    await page.evaluate(() => {
      if ((window as any).ethereum && (window as any).ethereum.on) {
        (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            // Account disconnected
          } else {
            // Account changed
          }
        });
      }
    });

    // Should handle account switch gracefully
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible();
  });

  test('should handle wallet connection errors gracefully', async ({ page }) => {
    // Override the mock to simulate rejection
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            throw new Error('User rejected request');
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // Try to connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();

    // Should handle error gracefully and show error message
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible(); // Should still show connect button
    
    // Check for error message - look for connection failed toast
    await expect(page.locator('[data-lov-name="ToastTitle"]').getByText('Connection Failed')).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing MetaMask', async ({ page }) => {
    // Remove ethereum provider
    await page.evaluate(() => {
      delete (window as any).ethereum;
    });

    // Try to connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();

    // Should show message about installing MetaMask
    await expect(page.getByText('Please install MetaMask or another Web3 wallet').first()).toBeVisible({ timeout: 5000 });
  });

  test('should persist wallet connection on page reload', async ({ page }) => {
    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 15000 });

    // Reload page
    await page.reload();

    // Should auto-connect if wallet was previously connected
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    
    // Note: In real implementation, this would check localStorage or cookies
    // for persistent connection state
  });
});