import { Page, expect } from '@playwright/test';
import { testSelectors } from './test-selectors';
import { MockWallet } from './mock-wallet';

export class PageInteractions {
  private mockWallet: MockWallet;

  constructor(private page: Page) {
    this.mockWallet = new MockWallet(page);
  }

  async setupPage() {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    // Wait for essential elements to be visible
    await expect(this.page.getByText(testSelectors.heading)).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText(testSelectors.connectWallet)).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText(testSelectors.swapTokens)).toBeVisible({ timeout: 10000 });
  }

  async connectWallet(shouldReject = false) {
    await this.mockWallet.setup({ shouldReject });
    
    if (!shouldReject) {
      await this.page.getByText(testSelectors.connectWallet).click();
      await expect(
        this.page.locator(testSelectors.connectedBadge).getByText('Connected')
      ).toBeVisible({ timeout: 15000 });
    } else {
      await this.page.getByText(testSelectors.connectWallet).click();
      await expect(
        this.page.locator(testSelectors.toastTitle).getByText('Connection Failed')
      ).toBeVisible({ timeout: 10000 });
    }
  }

  async fillSwapAmount(amount: string) {
    const fromInput = this.page.getByLabel(testSelectors.fromLabel);
    await fromInput.fill(amount);
    
    // Wait for calculation to complete
    await this.page.waitForTimeout(500);
  }

  async selectToken(position: 'from' | 'to', tokenSymbol: string) {
    const selector = position === 'from' 
      ? testSelectors.fromTokenSelect 
      : testSelectors.toTokenSelect;
      
    await this.page.locator(selector).click();
    await this.page.getByText(tokenSymbol, { exact: true }).click();
    
    // Wait for selection to complete
    await this.page.waitForTimeout(300);
  }

  async swapTokens() {
    await this.page.locator(testSelectors.swapDirectionButton).click();
    
    // Wait for swap animation to complete
    await this.page.waitForTimeout(500);
  }

  async verifySwapCalculation(fromAmount: string, expectedToAmount: string) {
    const toInput = this.page.getByLabel(testSelectors.toLabel);
    await expect(toInput).toHaveValue(expectedToAmount, { timeout: 10000 });
  }

  async verifyExchangeRate(fromToken: string, toToken: string, rate: string) {
    const rateText = `1 ${fromToken} = ${rate} ${toToken}`;
    await expect(this.page.getByText(rateText)).toBeVisible({ timeout: 10000 });
  }

  async executeSwap() {
    const swapButton = this.page.getByRole('button', { name: 'Swap' });
    await expect(swapButton).toBeEnabled({ timeout: 5000 });
    await swapButton.click();
    
    // Wait for swap to complete
    await this.page.waitForTimeout(1000);
  }

  async setMobileViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(500); // Allow viewport to settle
  }

  async enableDarkMode() {
    await this.page.emulateMedia({ colorScheme: 'dark' });
    await this.page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await this.page.waitForTimeout(500);
  }

  getMockWallet() {
    return this.mockWallet;
  }
}