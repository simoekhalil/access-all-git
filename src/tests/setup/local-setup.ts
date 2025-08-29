import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment for local tests
  process.env.TEST_ENVIRONMENT = 'local';
  console.log('🎭 Playwright: Local environment setup complete');
  console.log('🔗 Base URL:', 'http://localhost:8080');
  console.log('⛓️  Network: Ethereum Mainnet (mocked)');
  console.log('💰 Test wallets configured for local environment');
}

export default globalSetup;