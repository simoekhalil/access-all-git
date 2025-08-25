import { test, expect } from '@playwright/test';

/**
 * Real Wallet Testing
 * 
 * These tests work with actual browser wallet extensions (Gala Wallet, MetaMask, etc.)
 * instead of mocked implementations.
 * 
 * Prerequisites:
 * 1. Install Gala Wallet or MetaMask extension in your browser
 * 2. Set up test accounts with Sepolia ETH for staging
 * 3. Run tests in headed mode: npx playwright test --headed
 */

test.describe('Real Wallet Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Don't mock ethereum - use real wallet extension
    await page.goto('/');
    
    // Wait for wallet extension to load
    await page.waitForTimeout(2000);
  });

  test('should detect and connect real Gala Wallet', async ({ page }) => {
    // Check if wallet extension is detected
    const hasWallet = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    
    if (!hasWallet) {
      console.log('⚠️  No wallet extension detected. Please install Gala Wallet or MetaMask.');
      test.skip();
    }

    // Check wallet type
    const walletType = await page.evaluate(() => {
      if (window.ethereum?.isGala) return 'Gala Wallet';
      if (window.ethereum?.isMetaMask) return 'MetaMask';
      return 'Unknown Wallet';
    });
    
    console.log(`🔗 Detected wallet: ${walletType}`);

    // Initial state
    await expect(page.getByText('Connect Wallet')).toBeVisible();

    // Click connect - this will open the real wallet popup
    await page.getByText('Connect Wallet').click();

    // Note: Manual intervention needed here for real wallet connection
    // The test will pause to allow manual wallet approval
    await page.pause(); // Remove this line for automated testing

    // After connection (manual or automated)
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ 
      timeout: 30000 
    });
    
    await expect(page.getByText('Disconnect')).toBeVisible();
  });

  test('should work with real network switching', async ({ page }) => {
    // This test requires manual network switching in the wallet
    const hasWallet = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    
    if (!hasWallet) {
      test.skip();
    }

    console.log('🌐 Test network switching manually in your wallet extension');
    
    // Connect first
    await page.getByText('Connect Wallet').click();
    await page.pause(); // Allow manual connection
    
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ 
      timeout: 30000 
    });

    // Check current network display
    const networkText = await page.getByText(/Sepolia|Mainnet|Test Network/).first().textContent();
    console.log(`📡 Current network: ${networkText}`);
    
    // Manual test: Switch networks in wallet extension and verify UI updates
    await page.pause(); // Allow manual network switching
  });

  test('should handle real transaction signing', async ({ page }) => {
    const hasWallet = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    
    if (!hasWallet) {
      test.skip();
    }

    // Connect wallet
    await page.getByText('Connect Wallet').click();
    await page.pause(); // Allow manual connection
    
    await expect(page.locator('[data-lov-name="Badge"]').getByText('Connected')).toBeVisible({ 
      timeout: 30000 
    });

    // Set up a swap
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('0.001'); // Small amount for testing
    
    const toAmountInput = page.getByLabel('To');
    await expect(toAmountInput).toHaveValue(/\d+\.\d+/);

    // Attempt swap - this will trigger real transaction signing
    const swapButton = page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeEnabled();
    
    console.log('💱 Click Swap to test real transaction signing');
    await swapButton.click();
    
    // Note: This will open real wallet transaction confirmation
    await page.pause(); // Allow manual transaction approval/rejection
    
    // Check for success or error handling
    const isSwapping = await page.getByText('Swapping...').isVisible();
    if (isSwapping) {
      console.log('🔄 Transaction submitted, waiting for confirmation...');
      await expect(page.getByText('Swapping...')).toBeVisible();
    }
  });
});

test.describe('Automated Real Wallet Tests', () => {
  // These tests don't require manual intervention but need wallet extension
  
  test('should display correct wallet information', async ({ page }) => {
    await page.goto('/');
    
    const hasWallet = await page.evaluate(() => {
      return typeof window.ethereum !== 'undefined';
    });
    
    if (hasWallet) {
      const walletInfo = await page.evaluate(() => {
        return {
          isGala: window.ethereum?.isGala || false,
          isMetaMask: window.ethereum?.isMetaMask || false,
          chainId: window.ethereum?.chainId,
        };
      });
      
      console.log('💳 Wallet info:', walletInfo);
      
      // UI should show appropriate wallet type
      if (walletInfo.isGala) {
        await expect(page.getByText('Gala Wallet')).toBeVisible();
      } else if (walletInfo.isMetaMask) {
        await expect(page.getByText('MetaMask')).toBeVisible();
      }
    } else {
      await expect(page.getByText('Connect Wallet')).toBeVisible();
    }
  });
});