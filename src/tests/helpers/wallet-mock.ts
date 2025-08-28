import { Page } from '@playwright/test';
import { getTestEnvironment } from '../../config/test-environments';

export async function setupWalletMock(page: Page, walletType: 'primary' | 'secondary' = 'primary') {
  const environment = getTestEnvironment();
  const walletAddress = environment.walletAddresses[walletType];
  
  console.log(`🔧 Setting up ${walletType} wallet mock for ${environment.name}`);
  console.log(`📍 Address: ${walletAddress}`);
  console.log(`⛓️  Chain ID: ${environment.chainId}`);

  await page.addInitScript((config) => {
    (window as any).ethereum = {
      isMetaMask: true,
      isGala: true, // Support for Gala wallet detection
      request: async ({ method }: { method: string }) => {
        console.log(`🔌 Mock wallet request: ${method}`);
        
        if (method === 'eth_requestAccounts') {
          return [config.address];
        }
        if (method === 'eth_chainId') {
          return config.chainId;
        }
        if (method === 'eth_getBalance') {
          return config.balance;
        }
        if (method === 'eth_accounts') {
          return [config.address];
        }
        return null;
      },
      on: (event: string, handler: Function) => {
        console.log(`📡 Mock wallet event listener: ${event}`);
      },
      removeListener: (event: string, handler: Function) => {
        console.log(`🔇 Mock wallet remove listener: ${event}`);
      },
    };
  }, {
    address: walletAddress,
    chainId: environment.chainId,
    balance: environment.walletAddresses.balance,
  });
}

export async function setupRealWalletEnvironment(page: Page) {
  const environment = getTestEnvironment();
  
  console.log(`🌐 Setting up real wallet environment for ${environment.name}`);
  console.log(`🔗 Base URL: ${environment.baseUrl}`);
  
  // Inject environment-specific configuration for real wallet testing
  await page.addInitScript((config) => {
    (window as any).TEST_ENVIRONMENT = config;
  }, environment);
}