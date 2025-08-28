import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment for staging tests
  process.env.TEST_ENVIRONMENT = 'staging';
  console.log('🎭 Playwright: Staging environment setup complete');
  console.log('🔗 Base URL:', 'https://dex-frontend-test1.defi.gala.com');
  console.log('⛓️  Network: Sepolia Testnet');
  console.log('💰 Test wallets configured for staging environment');
}

export default globalSetup;