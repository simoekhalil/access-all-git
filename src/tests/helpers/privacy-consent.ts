/**
 * Helper function to handle privacy consent banners across E2E tests
 * This consolidates the duplicate code found in multiple test files
 */
export async function handlePrivacyConsent(page: any) {
  try {
    // Wait longer for banners to load on production
    await page.waitForTimeout(3000);
    
    // Handle Usercentrics (production) specifically first
    await handleUsercentrics(page);
    
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
    
    // Final check - ensure no blocking overlays remain
    await dismissBlockingOverlays(page);
    
  } catch (error) {
    console.log('No privacy consent banner found or already dismissed');
  }
}

/**
 * Handle Usercentrics privacy management specifically
 */
async function handleUsercentrics(page: any) {
  try {
    // Wait for Usercentrics to load
    const usercentrics = page.locator('#usercentrics-root');
    if (await usercentrics.isVisible({ timeout: 2000 })) {
      console.log('🔍 Detected Usercentrics privacy manager');
      
      // Look for Accept All button within Usercentrics
      const acceptAllSelectors = [
        '#usercentrics-root button:has-text("Accept All")',
        '#usercentrics-root [data-testid*="accept-all"]',
        '#usercentrics-root button:has-text("ACCEPT ALL")',
        '#usercentrics-root button:has-text("Alle akzeptieren")', // German
        '#usercentrics-root button[title*="Accept All" i]'
      ];
      
      for (const selector of acceptAllSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 1000 })) {
            await button.click();
            console.log('✅ Clicked Usercentrics Accept All button');
            await page.waitForTimeout(2000); // Wait for modal to close
            return;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // If no Accept All, try general Accept buttons
      const acceptSelectors = [
        '#usercentrics-root button:has-text("Accept")',
        '#usercentrics-root button:has-text("OK")',
        '#usercentrics-root [data-testid*="accept"]'
      ];
      
      for (const selector of acceptSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 1000 })) {
            await button.click();
            console.log('✅ Clicked Usercentrics Accept button');
            await page.waitForTimeout(2000);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }
  } catch (error) {
    console.log('No Usercentrics found or already handled');
  }
}

/**
 * Dismiss any remaining blocking overlays
 */
async function dismissBlockingOverlays(page: any) {
  try {
    // Remove Usercentrics root if it still exists and blocks interactions
    await page.evaluate(() => {
      const usercentrics = document.getElementById('usercentrics-root');
      if (usercentrics) {
        usercentrics.style.display = 'none';
        usercentrics.remove();
      }
    });
    
    // Remove other common blocking overlays
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"]');
      overlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.display = 'none';
        }
      });
    });
    
    await page.waitForTimeout(500);
  } catch (error) {
    // Ignore errors in cleanup
  }
}