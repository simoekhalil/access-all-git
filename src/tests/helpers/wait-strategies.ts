import { Page, expect } from '@playwright/test';

export class WaitStrategies {
  constructor(private page: Page) {}

  async waitForElementToBeVisible(selector: string, timeout = 10000) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async waitForTextToBeVisible(text: string, timeout = 10000) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout });
  }

  async waitForInputValue(selector: string, expectedValue: string, timeout = 10000) {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue, { timeout });
  }

  async waitForCalculation(inputSelector: string, outputSelector: string, timeout = 5000) {
    // Wait for input to have value
    await this.page.waitForFunction(
      ({ inputSelector, outputSelector }) => {
        const inputEl = document.querySelector(inputSelector) as HTMLInputElement;
        const outputEl = document.querySelector(outputSelector) as HTMLInputElement;
        return inputEl?.value && outputEl?.value && parseFloat(outputEl.value) > 0;
      },
      { inputSelector, outputSelector },
      { timeout }
    );
  }

  async waitForSwapCompletion(timeout = 2000) {
    // Wait for swap animation and state updates to complete
    await this.page.waitForTimeout(timeout);
    
    // Ensure elements are stable
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForDropdownToOpen(timeout = 5000) {
    await this.page.waitForSelector('[role="listbox"], [role="menu"]', { 
      state: 'visible', 
      timeout 
    });
  }

  async waitForPageStability(timeout = 1000) {
    // Wait for any animations or state changes to complete
    await this.page.waitForTimeout(timeout);
    await this.page.waitForLoadState('networkidle');
  }

  async retryAction(action: () => Promise<void>, maxRetries = 3, delayBetween = 1000) {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await action();
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${i + 1} failed:`, error);
        
        if (i < maxRetries - 1) {
          await this.page.waitForTimeout(delayBetween);
        }
      }
    }
    
    throw lastError || new Error(`Action failed after ${maxRetries} retries`);
  }
}