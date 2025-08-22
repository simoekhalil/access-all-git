import { test, expect } from '@playwright/test';
import { PageInteractions } from '../helpers/page-interactions';
import { WaitStrategies } from '../helpers/wait-strategies';
import { testSelectors } from '../helpers/test-selectors';

test.describe('Complete Swap Workflow', () => {
  let interactions: PageInteractions;
  let waitStrategies: WaitStrategies;

  test.beforeEach(async ({ page }) => {
    interactions = new PageInteractions(page);
    waitStrategies = new WaitStrategies(page);
    await interactions.setupPage();
  });

  test('should complete full swap workflow with wallet connection', async ({ page }) => {
    // Check initial page load
    await expect(page.getByText(testSelectors.heading)).toBeVisible();
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible();
    
    // Connect wallet
    await interactions.connectWallet();

    // Verify swap interface is visible
    await expect(page.getByText(testSelectors.swapTokens)).toBeVisible();
    await expect(page.getByText(testSelectors.subheading)).toBeVisible();

    // Test token selection - check select trigger values
    await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('GALA');
    await expect(page.locator(testSelectors.toTokenSelect)).toContainText('USDC');

    // Enter swap amount
    await interactions.fillSwapAmount('100');

    // Verify calculation
    await interactions.verifySwapCalculation('100', '2.500000');

    // Verify exchange rate display
    await interactions.verifyExchangeRate('GALA', 'USDC', '0.025000');

    // Test swap execution
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeEnabled({ timeout: 5000 });
  });

  test('should handle token switching via dropdown', async ({ page }) => {
    // Initial state - check select trigger shows GALA
    await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('GALA');
    
    // Select ETH as from token
    await waitStrategies.retryAction(async () => {
      await interactions.selectToken('from', 'ETH');
      await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('ETH');
    });

    // Select TOWN as to token
    await waitStrategies.retryAction(async () => {
      await interactions.selectToken('to', 'TOWN');
      await expect(page.locator(testSelectors.toTokenSelect)).toContainText('TOWN');
    });

    // Test calculation with new pair
    await interactions.fillSwapAmount('1');
    
    const toAmountInput = page.getByLabel(testSelectors.toLabel);
    await expect(toAmountInput).toHaveValue('6666.670000', { timeout: 10000 });
  });

  test('should handle directional swap correctly', async ({ page }) => {
    // Set initial amounts
    await interactions.fillSwapAmount('1000');
    
    // Verify calculated amount
    await interactions.verifySwapCalculation('1000', '25.000000');

    // Click swap direction arrow
    await waitStrategies.retryAction(async () => {
      await interactions.swapTokens();

      // Verify tokens swapped using proper selectors with timeout
      await expect(page.locator(testSelectors.fromTokenSelect)).toContainText('USDC', { timeout: 10000 });
      await expect(page.locator(testSelectors.toTokenSelect)).toContainText('GALA', { timeout: 10000 });

      // Verify amounts swapped
      await expect(page.getByLabel(testSelectors.fromLabel)).toHaveValue('25.000000', { timeout: 10000 });
      await expect(page.getByLabel(testSelectors.toLabel)).toHaveValue('1000.000000', { timeout: 10000 });
    });

    // Verify new exchange rate
    await interactions.verifyExchangeRate('USDC', 'GALA', '40.000000');
  });

  test('should validate input and show appropriate errors', async ({ page }) => {
    // Try to swap without amount
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeDisabled();

    // Enter invalid amount (empty or zero)
    const fromAmountInput = page.getByLabel(testSelectors.fromLabel);
    await fromAmountInput.fill('0');
    
    // Should still be disabled
    await expect(swapButton).toBeDisabled();

    // Enter valid amount
    await fromAmountInput.fill('100');
    await expect(swapButton).toBeEnabled({ timeout: 5000 });
  });
});