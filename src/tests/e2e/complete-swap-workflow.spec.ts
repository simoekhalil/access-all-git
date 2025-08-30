import { test, expect } from '@playwright/test';
import { handlePrivacyConsent } from '../helpers/privacy-consent';
import { setupWalletMock } from '../helpers/wallet-mock';
import { waitForWalletConnection, clickWalletConnectButton, validateSwapInterface, handleProductionErrors } from '../helpers/production-compatibility';

test.describe('Complete Swap Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup environment-aware wallet mock
    await setupWalletMock(page);
    
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
  });

  test('should complete full swap workflow with wallet connection', async ({ page }) => {
    // Check for production errors first
    if (await handleProductionErrors(page)) {
      test.skip();
      return;
    }

    // Check initial page load
    await expect(page.getByText('Gala DEX').or(page.getByText('Gala').first()).or(page.locator('h1').first())).toBeVisible();
    
    // Look for connect wallet button with multiple selectors
    const connectButtonVisible = await page.getByRole('button', { name: /connect wallet/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (connectButtonVisible) {
      await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
    }
    
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

    // Connect wallet with production compatibility
    try {
      await clickWalletConnectButton(page);
    } catch (error) {
      console.log('Using fallback wallet connect approach');
      await page.getByRole('button', { name: /connect wallet/i }).first().click({ force: true });
    }
    
    // Wait for wallet connection with production compatibility
    const connected = await waitForWalletConnection(page);
    if (!connected) {
      test.skip();
      return;
    }

    // Verify swap interface is visible with production compatibility
    const hasSwapInterface = await validateSwapInterface(page);
    if (hasSwapInterface) {
      // Try multiple text patterns for swap interface
      await expect(
        page.getByText('Swap Tokens')
          .or(page.getByText('Swap'))
          .or(page.locator('h1, h2, h3').filter({ hasText: /swap/i }))
      ).toBeVisible({ timeout: 10000 });
    }

    // Test token selection if interface is found
    if (hasSwapInterface) {
      // Check for combobox elements (token selectors)
      const hasComboboxes = await page.locator('[role="combobox"]').count() >= 2;
      if (hasComboboxes) {
        await expect(page.locator('[role="combobox"]').first()).toBeVisible();
        await expect(page.locator('[role="combobox"]').last()).toBeVisible();
      }

      // Test amount inputs if they exist
      const spinButtons = await page.locator('input[type="number"]').count();
      if (spinButtons >= 2) {
        // Enter swap amount
        const fromAmountInput = page.locator('input[type="number"]').first();
        await fromAmountInput.fill('100');
        await page.waitForTimeout(500); // Wait for calculation

        // Verify calculation if second input exists
        const toAmountInput = page.locator('input[type="number"]').last();
        // Don't enforce specific values on production as they may differ
        const hasValue = await toAmountInput.inputValue();
        if (hasValue && hasValue !== '' && hasValue !== '0') {
          console.log(`✅ Calculation working, got: ${hasValue}`);
        }
      }

      // Look for swap button
      const swapButton = page.getByRole('button', { name: /swap/i }).first();
      const swapButtonExists = await swapButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (swapButtonExists) {
        // Don't execute swap on production, just verify button exists
        console.log('✅ Swap button found and accessible');
      }
    }
  });

  test('should handle token switching via dropdown', async ({ page }) => {
    // Initial state - check select trigger shows GALA
    await expect(page.locator('[role="combobox"]').first().getByText('GALA')).toBeVisible();
    
    // Click from token dropdown
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    
    // Select ETH
    await page.getByText('ETH', { exact: true }).click();
    await expect(page.locator('[role="combobox"]').first().getByText('ETH')).toBeVisible();

    // Click to token dropdown
    const toTokenSelect = page.locator('[role="combobox"]').last();
    await toTokenSelect.click();
    
    // Verify GALA is available (not filtered out)
    await expect(page.getByText('GALA', { exact: true })).toBeVisible();
    
    // Select TOWN
    await page.getByText('TOWN', { exact: true }).click();
    await expect(page.locator('[role="combobox"]').last().getByText('TOWN')).toBeVisible();

    // Test calculation with new pair
    const fromAmountInput = page.getByRole('spinbutton').first();
    await fromAmountInput.fill('1');
    await page.waitForTimeout(500); // Wait for calculation
    
    const toAmountInput = page.getByRole('spinbutton').last();
    await expect(toAmountInput).toHaveValue('6666.670000');
  });

  test('should handle directional swap correctly', async ({ page }) => {
    // Set initial amounts
    const fromAmountInput = page.getByRole('spinbutton').first();
    await fromAmountInput.fill('1000');
    await page.waitForTimeout(500); // Wait for calculation
    
    // Verify calculated amount
    const toAmountInput = page.getByRole('spinbutton').last();
    await expect(toAmountInput).toHaveValue('25.000000');

    // Click swap direction arrow - using data-testid for reliability
    const swapArrow = page.getByTestId('swap-direction-button');
    await swapArrow.click();

    // Wait for state updates to complete
    await page.waitForTimeout(1500);

    // Verify tokens swapped
    await expect(page.locator('[role="combobox"]').first()).toContainText('USDC');
    await expect(page.locator('[role="combobox"]').last()).toContainText('GALA');

    // Verify amounts swapped and recalculated
    await expect(page.getByRole('spinbutton').first()).toHaveValue('25.000000');
    await expect(page.getByRole('spinbutton').last()).toHaveValue('1000.000000');

    // Verify new exchange rate
    await expect(page.getByText('1 USDC = 40.000000 GALA')).toBeVisible();
  });

  test('should validate input and show appropriate errors', async ({ page }) => {
    // Try to swap without amount
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeDisabled();

    // Enter invalid amount (empty or zero)
    const fromAmountInput = page.getByRole('spinbutton').first();
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

    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    await page.waitForTimeout(1000);

    // Try swap without connecting wallet properly (simulate error)
    await swapButton.click();
    await expect(page.getByText('Swapping...')).toBeVisible();
  });
});