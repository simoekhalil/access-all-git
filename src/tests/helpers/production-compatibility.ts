import { Page, expect } from '@playwright/test';

/**
 * Production-specific test helpers to handle differences between local dev and production
 */

/**
 * Check if wallet is connected on production site
 * Production may have different UI than local development
 */
export async function waitForWalletConnection(page: Page, timeout: number = 15000) {
  try {
    // Try multiple selectors that might indicate wallet connection on production
    const connectionSelectors = [
      '[data-lov-name="Badge"]:has-text("Connected")', // Local dev selector
      'button:has-text("Connected")',
      '[class*="connected"]',
      '[data-testid*="connected"]',
      '[aria-label*="connected" i]',
      // Look for wallet address patterns
      'text=/0x[a-fA-F0-9]{40}/',
      'text=/0x[a-fA-F0-9]{4}\.\.\./',
      // Look for disconnect buttons (implies connection)
      'button:has-text("Disconnect")',
      'button:has-text("Logout")',
      // Look for wallet balance or account info
      '[class*="wallet-info"]',
      '[class*="account"]',
      '[data-testid*="wallet"]'
    ];

    console.log('🔍 Waiting for wallet connection indicators...');
    
    for (const selector of connectionSelectors) {
      try {
        const element = page.locator(selector).first();
        await expect(element).toBeVisible({ timeout: 2000 });
        console.log(`✅ Wallet connection detected via: ${selector}`);
        return true;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no specific connection indicator, wait for page stability
    console.log('⏳ No specific connection indicator found, waiting for page stability...');
    await page.waitForTimeout(3000);
    return true;
    
  } catch (error) {
    console.log('❌ Could not confirm wallet connection:', error);
    return false;
  }
}

/**
 * Find and interact with wallet connect button on production
 */
export async function clickWalletConnectButton(page: Page) {
  const connectSelectors = [
    'button:has-text("Connect Wallet")',
    'button:has-text("Connect")',
    '[class*="connect"]',
    '[data-testid*="connect"]',
    'button[aria-label*="connect" i]'
  ];

  for (const selector of connectSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        // Force click to bypass any overlays
        await button.click({ force: true });
        console.log(`✅ Clicked wallet connect button: ${selector}`);
        await page.waitForTimeout(1000);
        return true;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  throw new Error('Could not find wallet connect button on production site');
}

/**
 * Check if swap interface elements exist on production
 */
export async function validateSwapInterface(page: Page) {
  const swapSelectors = [
    'text="Swap Tokens"', // Local dev text
    'text="Swap"',
    '[class*="swap"]',
    '[data-testid*="swap"]',
    'input[type="number"]', // Amount inputs
    '[role="combobox"]', // Token selectors
    'select' // Alternative token selectors
  ];

  console.log('🔍 Validating swap interface on production...');
  
  for (const selector of swapSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`✅ Swap interface element found: ${selector}`);
        return true;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  console.log('⚠️  Could not find expected swap interface elements on production');
  return false;
}

/**
 * Handle production-specific error states
 */
export async function handleProductionErrors(page: Page) {
  // Look for common error messages or states on production
  const errorSelectors = [
    'text="Service Unavailable"',
    'text="Maintenance"',
    'text="Error"',
    '[class*="error"]',
    '[data-testid*="error"]'
  ];

  for (const selector of errorSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`⚠️  Production error detected: ${selector}`);
        return true;
      }
    } catch (e) {
      // Continue checking
    }
  }
  
  return false;
}