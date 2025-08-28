import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment for production tests
  process.env.TEST_ENVIRONMENT = 'production';
  console.log('🎭 Playwright: Production environment setup complete');
  console.log('🔗 Base URL:', 'https://swap.gala.com');
  console.log('⛓️  Network: Ethereum Mainnet'); 
  console.log('💰 Test wallets configured for production environment');
  console.log('⚠️  WARNING: Using production environment - test carefully!');
}

export default globalSetup;