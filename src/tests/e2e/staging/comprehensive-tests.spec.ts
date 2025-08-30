import { test, expect } from '@playwright/test';
import { handlePrivacyConsent } from '../../helpers/privacy-consent';
import { setupWalletMock } from '../../helpers/wallet-mock';

/**
 * Staging Comprehensive Tests
 * - Full feature testing
 * - Exact UI validation
 * - Edge cases and error scenarios
 * - Can be destructive - staging is safe environment
 */

test.describe('Staging Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupWalletMock(page);
    await page.goto('/');
    await handlePrivacyConsent(page);
  });

  test('should complete full swap workflow with exact validation', async ({ page }) => {
    // Exact staging validation - we know the exact UI structure
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    
    // Mock wallet connection
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x742d35Cc6764C4532B4C2C4f2c7C6D6D6af3f3f3'];
          }
          if (method === 'eth_chainId') {
            return '0xaa36a7';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Verify exact swap interface
    await expect(page.getByText('Swap Tokens')).toBeVisible();
    await expect(page.getByText('Trade your tokens instantly')).toBeVisible();

    // Test exact token selection
    await expect(page.locator('[role="combobox"]').first().getByText('GALA')).toBeVisible();
    await expect(page.locator('[role="combobox"]').last().getByText('USDC')).toBeVisible();

    // Test exact calculations
    const fromAmountInput = page.getByRole('spinbutton').first();
    await fromAmountInput.fill('100');
    await page.waitForTimeout(500);

    const toAmountInput = page.getByRole('spinbutton').last();
    await expect(toAmountInput).toHaveValue('2.500000');

    // Verify exact exchange rate
    await expect(page.getByText('1 GALA = 0.025000 USDC')).toBeVisible();

    // Test swap execution
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeEnabled();
    await swapButton.click();
    await expect(page.getByText('Swapping...')).toBeVisible();
    await expect(page.getByText('Swap Successful').first()).toBeVisible({ timeout: 5000 });

    // Verify form reset
    await expect(fromAmountInput).toHaveValue('');
    await expect(toAmountInput).toHaveValue('');
  });

  test('should handle token switching with exact validation', async ({ page }) => {
    // Connect wallet first
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') return ['0x742d35Cc6764C4532B4C2C4f2c7C6D6D6af3f3f3'];
          if (method === 'eth_chainId') return '0xaa36a7';
          return null;
        },
        on: () => {}, removeListener: () => {},
      };
    });
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Test exact token switching
    await expect(page.locator('[role="combobox"]').first().getByText('GALA')).toBeVisible();
    
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    await page.getByText('ETH', { exact: true }).click();
    await expect(page.locator('[role="combobox"]').first().getByText('ETH')).toBeVisible();

    // Test calculation with new pair
    const fromAmountInput = page.getByRole('spinbutton').first();
    await fromAmountInput.fill('1');
    await page.waitForTimeout(500);
    
    const toAmountInput = page.getByRole('spinbutton').last();
    await expect(toAmountInput).toHaveValue('6666.670000');
  });

  test('should validate input errors exactly', async ({ page }) => {
    // Connect wallet
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') return ['0x742d35Cc6764C4532B4C2C4f2c7C6D6D6af3f3f3'];
          return null;
        },
        on: () => {}, removeListener: () => {},
      };
    });
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await page.waitForTimeout(1000);

    // Test exact validation behavior
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeDisabled();

    const fromAmountInput = page.getByRole('spinbutton').first();
    await fromAmountInput.fill('0');
    await expect(swapButton).toBeDisabled();

    await fromAmountInput.fill('100');
    await expect(swapButton).toBeEnabled();
  });

  test('should handle edge cases and large numbers', async ({ page }) => {
    // Connect wallet
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') return ['0x742d35Cc6764C4532B4C2C4f2c7C6D6D6af3f3f3'];
          return null;
        },
        on: () => {}, removeListener: () => {},
      };
    });
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await page.waitForTimeout(1000);

    // Test large numbers
    const fromAmountInput = page.getByRole('spinbutton').first();
    await fromAmountInput.fill('999999999');
    await page.waitForTimeout(500);
    
    const toAmountInput = page.getByRole('spinbutton').last();
    await expect(toAmountInput).toHaveValue('24999999.975000');

    // Test very small numbers
    await fromAmountInput.fill('0.000001');
    await page.waitForTimeout(500);
    await expect(toAmountInput).toHaveValue('0.000000');
  });
});