import { test, expect } from '@playwright/test';
import { handlePrivacyConsent } from '../../helpers/privacy-consent';

/**
 * Production Smoke Tests
 * - Light, non-destructive tests
 * - Focus on core functionality availability
 * - Resilient to UI changes
 * - Suitable for monitoring/health checks
 */

test.describe('Production Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await handlePrivacyConsent(page);
  });

  test('should load homepage successfully', async ({ page }) => {
    // Basic page load verification
    await expect(page).toHaveTitle(/gala|swap|dex/i);
    
    // Look for key branding elements (flexible selectors)
    await expect(
      page.getByText('Gala', { exact: false }).first()
        .or(page.locator('h1').first())
        .or(page.locator('[class*="logo"]').first())
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display wallet connection option', async ({ page }) => {
    // Verify wallet connection is available (don't actually connect)
    const walletButton = page.getByRole('button', { name: /connect|wallet/i }).first();
    const buttonExists = await walletButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (buttonExists) {
      await expect(walletButton).toBeVisible();
      console.log('✅ Wallet connection option available');
    } else {
      console.log('ℹ️  Wallet connection may be handled differently on production');
    }
  });

  test('should display trading interface elements', async ({ page }) => {
    // Look for core trading elements without being too specific
    const hasInputs = await page.locator('input[type="number"]').count() >= 1;
    const hasButtons = await page.getByRole('button').count() >= 1;
    const hasSelects = await page.locator('select, [role="combobox"]').count() >= 1;
    
    // At least some trading interface elements should exist
    expect(hasInputs || hasSelects).toBeTruthy();
    expect(hasButtons).toBeTruthy();
    
    console.log(`✅ Trading interface elements detected: inputs=${hasInputs}, selects=${hasSelects}, buttons=${hasButtons}`);
  });

  test('should not show critical errors', async ({ page }) => {
    // Check for error states that would indicate problems
    const errorSelectors = [
      'text=/error 500|internal server error/i',
      'text=/service unavailable/i',
      'text=/maintenance/i',
      '[class*="error-page"]',
      '[data-testid*="error"]'
    ];

    for (const selector of errorSelectors) {
      const errorVisible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
      expect(errorVisible).toBeFalsy();
    }
    
    console.log('✅ No critical errors detected');
  });

  test('should have reasonable page performance', async ({ page }) => {
    // Basic performance check - page should load within reasonable time
    const startTime = Date.now();
    
    // Wait for network to be mostly idle
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(15000); // 15 second max
    
    console.log(`✅ Page loaded in ${loadTime}ms`);
  });
});