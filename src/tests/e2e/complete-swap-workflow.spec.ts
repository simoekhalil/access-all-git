import { test, expect } from '@playwright/test';

test.describe('Complete Swap Workflow', () => {
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
  });

  test('should complete full swap workflow with wallet connection', async ({ page }) => {
    // Check initial page load
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.getByText('Connect Wallet')).toBeVisible();
    
    // Mock wallet connection
    await page.evaluate(() => {
      // Mock MetaMask
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

    // Verify swap interface is visible
    await expect(page.getByText('Swap Tokens')).toBeVisible();
    await expect(page.getByText('Trade your tokens instantly')).toBeVisible();

    // Test token selection - check select trigger values
    await expect(page.getByTestId('from-token-select')).toContainText('GALA');
    await expect(page.getByTestId('to-token-select')).toContainText('USDC');

    // Enter swap amount
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');

    // Verify calculation
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue('2.500000');

    // Verify exchange rate display
    await expect(page.getByText('1 GALA = 0.025000 USDC')).toBeVisible();

    // Verify slippage display
    await expect(page.getByText('0.5%')).toBeVisible();

    // Test swap button becomes enabled
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeEnabled();

    // Execute swap
    await swapButton.click();
    await expect(page.getByText('Swapping...')).toBeVisible();

    // Verify success message appears - use first match to avoid strict mode violation
    await expect(page.getByText('Swap Successful').first()).toBeVisible({ timeout: 5000 });

    // Verify form reset
    await expect(fromAmountInput).toHaveValue('');
    await expect(toAmountInput).toHaveValue('');
  });

  test('should handle token switching via dropdown', async ({ page }) => {
    // Initial state - check select trigger shows GALA
    await expect(page.getByTestId('from-token-select')).toContainText('GALA');
    
    // Click from token dropdown
    const fromTokenSelect = page.getByTestId('from-token-select');
    await fromTokenSelect.click();
    
    // Select ETH
    await page.getByText('ETH', { exact: true }).click();
    await expect(page.getByTestId('from-token-select')).toContainText('ETH');

    // Click to token dropdown
    const toTokenSelect = page.getByTestId('to-token-select');
    await toTokenSelect.click();
    
    // Verify GALA is available (not filtered out)
    await expect(page.getByText('GALA', { exact: true })).toBeVisible();
    
    // Select TOWN
    await page.getByText('TOWN', { exact: true }).click();
    await expect(page.getByTestId('to-token-select')).toContainText('TOWN');

    // Test calculation with new pair
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('1');
    
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue('6666.670000');
  });

  test('should handle directional swap correctly', async ({ page }) => {
    // Set initial amounts
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('1000');
    
    // Verify calculated amount
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue('25.000000', { timeout: 10000 });

    // Click swap direction arrow
    const swapArrow = page.getByTestId('swap-tokens-button');
    await swapArrow.click();

    // Verify tokens swapped using proper selectors with timeout
    await expect(page.getByTestId('from-token-select')).toContainText('USDC', { timeout: 10000 });
    await expect(page.getByTestId('to-token-select')).toContainText('GALA', { timeout: 10000 });

    // Verify amounts swapped
    await expect(page.getByLabel('From')).toHaveValue('25.000000', { timeout: 10000 });
    await expect(page.getByLabel('To')).toHaveValue('1000.000000', { timeout: 10000 });

    // Verify new exchange rate
    await expect(page.getByText('1 USDC = 40.000000 GALA')).toBeVisible({ timeout: 10000 });
  });

  test('should validate input and show appropriate errors', async ({ page }) => {
    // Try to swap without amount
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeDisabled();

    // Enter invalid amount (empty or zero)
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('0');
    
    // Should still be disabled
    await expect(swapButton).toBeDisabled();

    // Enter valid amount
    await fromAmountInput.fill('100');
    await expect(swapButton).toBeEnabled();

    // Mock wallet connection for error test
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    await page.getByText('Connect Wallet').click();
    await page.waitForTimeout(1000);

    // Try swap without connecting wallet properly (simulate error)
    await swapButton.click();
    await expect(page.getByText('Swapping...')).toBeVisible();
  });
});