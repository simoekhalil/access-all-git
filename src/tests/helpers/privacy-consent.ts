/**
 * Helper function to handle privacy consent banners across E2E tests
 * This consolidates the duplicate code found in multiple test files
 */
export async function handlePrivacyConsent(page: any) {
  try {
    // Wait a bit for banners to load
    await page.waitForTimeout(2000);
    
    // Privacy banner selectors - prioritize "Accept All"
    const privacySelectors = [
      // Prioritize "Accept All" for privacy settings
      'button:has-text("Accept All")',
      'button:has-text("Accept All Cookies")',
      'button:has-text("Allow All")',
      '[data-testid="accept-all"]',
      '[id*="accept-all"]',
      '[class*="accept-all"]',
      // Other common patterns
      'button:has-text("Accept")',
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
      // Close/dismiss buttons as last resort
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
          console.log(`✅ Clicked privacy consent button: ${selector}`);
          await page.waitForTimeout(1000);
          
          // If we clicked "Accept All", log it specifically
          if (selector.includes('Accept All')) {
            console.log('🔒 Privacy settings: Accept All clicked successfully');
          }
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