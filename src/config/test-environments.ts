export interface TestEnvironment {
  name: string;
  baseUrl: string;
  chainId: string;
  walletAddresses: {
    primary: string;
    secondary: string;
    balance: string; // in wei
  };
  tokens: {
    GALA: { address: string; decimals: number };
    USDC: { address: string; decimals: number };
    ETH: { address: string; decimals: number };
    TOWN: { address: string; decimals: number };
  };
}

export const TEST_ENVIRONMENTS: Record<string, TestEnvironment> = {
  staging: {
    name: 'Staging',
    baseUrl: 'https://dex-frontend-test1.defi.gala.com',
    chainId: '0xaa36a7', // Sepolia
    walletAddresses: {
      primary: '0x742d35Cc6764C4532B4C2C4f2c7C6D6D6af3f3f3', // Staging test wallet
      secondary: '0x8Ba1f109551bD432803012645Hac189451c9c9c9', // Secondary staging wallet
      balance: '0x1bc16d674ec80000', // 2 ETH in wei
    },
    tokens: {
      GALA: { address: '0x...', decimals: 18 },
      USDC: { address: '0x...', decimals: 6 },
      ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      TOWN: { address: '0x...', decimals: 18 },
    }
  },
  production: {
    name: 'Production',
    baseUrl: 'https://swap.gala.com',
    chainId: '0x1', // Ethereum Mainnet
    walletAddresses: {
      primary: '0x1234567890abcdef1234567890abcdef12345678', // Prod test wallet
      secondary: '0xabcdef1234567890abcdef1234567890abcdef12', // Secondary prod wallet
      balance: '0x6f05b59d3b20000', // 0.5 ETH in wei (smaller amount for prod)
    },
    tokens: {
      GALA: { address: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA', decimals: 18 },
      USDC: { address: '0xA0b86a33E6441fb4C7b3c1F1f0Ca3A09Da8c0d7E', decimals: 6 },
      ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      TOWN: { address: '0x3DD98C8A089dBCFF7e8FC8d4f532BD493501AB7F', decimals: 18 },
    }
  }
};

export function getTestEnvironment(): TestEnvironment {
  const envName = process.env.TEST_ENVIRONMENT || 'staging';
  const environment = TEST_ENVIRONMENTS[envName];
  
  if (!environment) {
    throw new Error(`Unknown test environment: ${envName}. Available: ${Object.keys(TEST_ENVIRONMENTS).join(', ')}`);
  }
  
  console.log(`🧪 Using ${environment.name} environment: ${environment.baseUrl}`);
  return environment;
}