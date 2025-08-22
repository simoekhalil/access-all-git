import { test, expect } from '@playwright/test';
import { PageInteractions } from '../helpers/page-interactions';
import { WaitStrategies } from '../helpers/wait-strategies';
import { testSelectors } from '../helpers/test-selectors';

test.describe('Visual Regression Tests', () => {
  let interactions: PageInteractions;
  let waitStrategies: WaitStrategies;

  test.beforeEach(async ({ page }) => {
    interactions = new PageInteractions(page);
    waitStrategies = new WaitStrategies(page);
    await interactions.setupPage();
  });

  test('should match homepage layout', async ({ page }) => {
    // Wait for content to load
    await expect(page.getByText(testSelectors.heading)).toBeVisible();
    
    // Take full page screenshot - using update snapshots approach
    await expect(page).toHaveScreenshot('homepage.png', { threshold: 0.3 });
  });

  test('should match wallet connection states', async ({ page }) => {
    // Initial disconnected state
    await expect(page.getByText(testSelectors.connectWallet)).toBeVisible();
    await expect(page.locator(testSelectors.mainContent)).toHaveScreenshot('wallet-disconnected.png', { threshold: 0.3 });

    // Connect wallet
    await interactions.connectWallet();
    await expect(page.locator(testSelectors.connectedBadge).getByText('Connected')).toBeVisible({ timeout: 10000 });
    
    // Connected state
    await expect(page.locator(testSelectors.mainContent)).toHaveScreenshot('wallet-connected.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });

  test('should match swap interface states', async ({ page }) => {
    // Empty swap interface
    await expect(page.getByText(testSelectors.swapTokens)).toBeVisible();
    await expect(page.locator(testSelectors.mainContent)).toHaveScreenshot('swap-empty.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // With amounts entered
    await interactions.fillSwapAmount('100');
    
    // Wait for calculation and UI updates
    await interactions.verifySwapCalculation('100', '2.500000');
    await page.waitForTimeout(500);
    await expect(page.locator(testSelectors.mainContent)).toHaveScreenshot('swap-with-amounts.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // With exchange rate details visible
    await expect(page.getByText('Exchange Rate:')).toBeVisible();
    await expect(page.locator(testSelectors.mainContent)).toHaveScreenshot('swap-with-details.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });

  test('should match token selection dropdowns', async ({ page }) => {
    // Open from token dropdown
    await waitStrategies.retryAction(async () => {
      const fromTokenSelect = page.locator(testSelectors.fromTokenSelect);
      await fromTokenSelect.click();
      
      // Screenshot of dropdown
      await expect(page.locator('body')).toHaveScreenshot('from-token-dropdown.png', { 
        threshold: 0.3,
        timeout: 10000 
      });

      // Close and open to token dropdown
      await page.keyboard.press('Escape');
      const toTokenSelect = page.locator(testSelectors.toTokenSelect);
      await toTokenSelect.click();

      await expect(page.locator('body')).toHaveScreenshot('to-token-dropdown.png', { 
        threshold: 0.3,
        timeout: 10000 
      });
      
      await page.keyboard.press('Escape'); // Close for next test
    });
  });

  test('should match different token pair combinations', async ({ page }) => {
    const tokenPairs = [
      { from: 'GALA', to: 'ETH', amount: '66666.67' },
      { from: 'USDC', to: 'GALA', amount: '100' },
      { from: 'ETH', to: 'TOWN', amount: '1' },
      { from: 'TOWN', to: 'USDC', amount: '100' },
    ];

    for (const pair of tokenPairs) {
      // Set from token if not GALA
      if (pair.from !== 'GALA') {
        await waitStrategies.retryAction(async () => {
          await interactions.selectToken('from', pair.from);
        });
      }

      // Set to token if not USDC
      if (pair.to !== 'USDC') {
        await waitStrategies.retryAction(async () => {
          await interactions.selectToken('to', pair.to);
        });
      }

      // Enter amount
      await interactions.fillSwapAmount(pair.amount);

      // Wait for calculation
      await page.waitForTimeout(500);

      // Screenshot
      await expect(page.locator(testSelectors.mainContent)).toHaveScreenshot(`swap-${pair.from}-to-${pair.to}.png`, { 
        threshold: 0.3,
        timeout: 10000 
      });

      // Reset for next iteration
      await page.reload();
      await interactions.waitForPageLoad();
    }
  });

  test('should match responsive design on mobile', async ({ page }) => {
    // Set mobile viewport and wait for layout
    await interactions.setMobileViewport(375, 667);
    await interactions.setupPage();
    
    // Mobile layout
    await expect(page.getByText(testSelectors.heading)).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-homepage.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Mobile swap interface
    await interactions.fillSwapAmount('100');
    await interactions.verifySwapCalculation('100', '2.500000');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('mobile-swap-interface.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Mobile token dropdown
    await waitStrategies.retryAction(async () => {
      const fromTokenSelect = page.locator(testSelectors.fromTokenSelect);
      await fromTokenSelect.click();
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('mobile-token-dropdown.png', { 
        threshold: 0.3,
        timeout: 10000 
      });
      
      await page.keyboard.press('Escape'); // Close dropdown
    });
  });

  test('should match dark mode appearance', async ({ page }) => {
    // Set dark mode
    await interactions.enableDarkMode();

    await expect(page.getByText(testSelectors.heading)).toBeVisible();
    await expect(page).toHaveScreenshot('dark-mode-homepage.png', { 
      threshold: 0.3,
      timeout: 10000 
    });

    // Dark mode swap interface with interaction
    await interactions.fillSwapAmount('100');
    await interactions.verifySwapCalculation('100', '2.500000');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('dark-mode-swap.png', { 
      threshold: 0.3,
      timeout: 10000 
    });
  });
});