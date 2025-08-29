import { test, expect, devices } from '@playwright/test';

// Helper function to handle privacy consent banners
async function handlePrivacyConsent(page: any) {
  try {
    // Wait a bit for banners to load
    await page.waitForTimeout(2000);
    
    // Common privacy banner selectors - try multiple patterns
    const privacySelectors = [
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("Allow All")', 
      'button:has-text("I Accept")',
      'button:has-text("Agree")',
      'button:has-text("OK")',
      'button:has-text("Continue")',
      '[data-testid*="accept"]',
      '[id*="accept"]',
      '[class*="accept"]',
      '[aria-label*="accept" i]',
      'button[title*="accept" i]',
      // Cookie specific
      'button:has-text("Accept Cookies")',
      'button:has-text("Allow Cookies")',
      '[data-testid*="cookie"]',
      '[id*="cookie"]',
      // Close/dismiss buttons
      'button:has-text("×")',
      'button:has-text("✕")',
      '[aria-label*="close" i]',
      '[aria-label*="dismiss" i]'
    ];
    
    for (const selector of privacySelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          console.log(`Clicked privacy consent: ${selector}`);
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  } catch (error) {
    console.log('No privacy consent banner found or already dismissed');
  }
}

test.describe('Mobile Responsiveness', () => {
  const mobileDevices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Samsung Galaxy', width: 360, height: 640 },
  ];

  mobileDevices.forEach(device => {
    test(`should be responsive on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      
      // Handle privacy/cookie consent banners
      await handlePrivacyConsent(page);

    // Basic elements should be visible and properly sized
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();
      await expect(page.getByText('Swap Tokens')).toBeVisible();

      // Swap interface should fit in viewport
      const swapCard = page.locator('text=Swap Tokens').locator('..');
      const cardBox = await swapCard.boundingBox();
      
      if (cardBox) {
        expect(cardBox.width).toBeLessThanOrEqual(device.width - 32); // Account for padding
        expect(cardBox.x).toBeGreaterThanOrEqual(0);
      }

      // Form inputs should be accessible
      const fromAmountInput = page.getByLabel('From');
      await fromAmountInput.fill('100');
      
      const toAmountInput = page.getByLabel('To');
      await expect(toAmountInput).toHaveValue('2.500000');

      // Token selectors should work on mobile
      const fromTokenSelect = page.locator('[role="combobox"]').first();
      await fromTokenSelect.click();
      
      // Dropdown should be visible and not overflow
      await expect(page.getByText('ETH', { exact: true })).toBeVisible();
      
      const dropdown = page.locator('[role="listbox"]').or(page.locator('[role="menu"]'));
      if (await dropdown.count() > 0) {
        const dropdownBox = await dropdown.first().boundingBox();
        if (dropdownBox) {
          expect(dropdownBox.x + dropdownBox.width).toBeLessThanOrEqual(device.width);
        }
      }

      await page.getByText('ETH', { exact: true }).click();
      await expect(page.getByText('ETH').first()).toBeVisible();

      // Swap button should be easily tappable (min 44px height)
      const swapButton = page.getByRole('button', { name: 'Swap' });
      const buttonBox = await swapButton.boundingBox();
      
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      }

      console.log(`✓ ${device.name} (${device.width}x${device.height}) responsive test passed`);
    });
  });

  test('should handle touch interactions properly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
    
    // Wait for page to load completely
    await expect(page.getByText('Gala DEX')).toBeVisible();

    // Test touch tap on elements - use click instead of tap for better compatibility
    await page.getByRole('button', { name: /connect wallet/i }).first().click();
    
    // Test form interaction with touch
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.click();
    await fromAmountInput.fill('100');

    // Test dropdown interaction with touch
    const fromTokenSelect = page.locator('[role="combobox"]').first();
    await fromTokenSelect.click();
    
    await expect(page.getByText('ETH', { exact: true })).toBeVisible();
    await page.getByText('ETH', { exact: true }).click();

    // Wait for selection to complete
    await page.waitForTimeout(300);
    
    // Verify token selection worked
    await expect(page.locator('[role="combobox"]').first().locator('span').getByText('ETH')).toBeVisible();

    // Test directional swap with touch - using data-testid for reliability
    const swapArrow = page.getByTestId('swap-direction-button');
    await swapArrow.click();
    
    await page.waitForTimeout(1500);
    await expect(page.getByText('USDC').first()).toBeVisible();
  });

  test('should scroll properly on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very small screen
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
    await page.waitForTimeout(500);

    // Page should be scrollable if content exceeds viewport
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 568;

    if (bodyHeight > viewportHeight) {
      // Test scrolling to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      
      // Should be able to interact with elements at bottom
      const swapButton = page.getByRole('button', { name: 'Swap' });
      await expect(swapButton).toBeVisible();

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await expect(page.getByText('Gala DEX')).toBeVisible();
    }
  });

  test('should maintain usability in landscape mode', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 }); // Landscape
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
    await page.waitForTimeout(500);

    // All key elements should still be accessible
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.locator('h1, h2, h3').filter({ hasText: /swap/i }).or(page.getByText('Swap Tokens'))).toBeVisible();

    // Test form interactions in landscape
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    await expect(page.getByLabel('To')).toHaveValue('2.500000');

    // Test token switching in landscape - using data-testid for reliability  
    const swapArrow = page.getByTestId('swap-direction-button');
    await swapArrow.click();
    
    await page.waitForTimeout(1500);
    await expect(page.locator('[role="combobox"]').first()).toContainText('USDC');
    await expect(page.locator('[role="combobox"]').last()).toContainText('GALA');
  });

  test('should handle text scaling appropriately', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Handle privacy/cookie consent banners
    await handlePrivacyConsent(page);
    
    // Simulate increased text size (accessibility feature)
    await page.addInitScript(() => {
      document.documentElement.style.fontSize = '20px'; // Increased from default ~16px
    });

    await page.reload();
    await page.waitForTimeout(500);

    // Elements should still be accessible and readable
    await expect(page.getByText('Gala DEX')).toBeVisible();
    await expect(page.locator('h1, h2, h3').filter({ hasText: /swap/i }).or(page.getByText('Swap Tokens'))).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i }).first()).toBeVisible();

    // Form should still be functional with larger text
    const fromAmountInput = page.getByLabel('From');
    await fromAmountInput.fill('100');
    await expect(page.getByLabel('To')).toHaveValue('2.500000');
  });
});