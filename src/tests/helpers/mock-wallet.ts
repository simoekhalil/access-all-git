import { Page } from '@playwright/test';

export interface MockWalletConfig {
  isMetaMask?: boolean;
  accounts?: string[];
  chainId?: string;
  shouldReject?: boolean;
  rejectMessage?: string;
}

export class MockWallet {
  constructor(private page: Page) {}

  async setup(config: MockWalletConfig = {}) {
    const {
      isMetaMask = true,
      accounts = ['0x1234567890123456789012345678901234567890'],
      chainId = '0x1',
      shouldReject = false,
      rejectMessage = 'User rejected request'
    } = config;

    await this.page.evaluate(({ isMetaMask, accounts, chainId, shouldReject, rejectMessage }) => {
      (window as any).ethereum = {
        isMetaMask,
        request: async ({ method }: { method: string }) => {
          console.log('Mock wallet method called:', method);
          
          if (shouldReject && method === 'eth_requestAccounts') {
            throw new Error(rejectMessage);
          }
          
          switch (method) {
            case 'eth_requestAccounts':
              return accounts;
            case 'eth_chainId':
              return chainId;
            case 'eth_accounts':
              return accounts;
            default:
              return null;
          }
        },
        on: (event: string, callback: Function) => {
          console.log('Mock wallet event listener added:', event);
        },
        removeListener: (event: string, callback: Function) => {
          console.log('Mock wallet event listener removed:', event);
        },
      };
    }, { isMetaMask, accounts, chainId, shouldReject, rejectMessage });
  }

  async simulateAccountChange(newAccounts: string[]) {
    await this.page.evaluate((accounts) => {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum._accountChangeHandlers) {
        ethereum._accountChangeHandlers.forEach((handler: Function) => {
          handler(accounts);
        });
      }
    }, newAccounts);
  }

  async simulateChainChange(newChainId: string) {
    await this.page.evaluate((chainId) => {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum._chainChangeHandlers) {
        ethereum._chainChangeHandlers.forEach((handler: Function) => {
          handler(chainId);
        });
      }
    }, newChainId);
  }

  async remove() {
    await this.page.evaluate(() => {
      delete (window as any).ethereum;
    });
  }
}