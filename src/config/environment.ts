// Environment configuration for different deployment stages
export interface Environment {
  name: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  walletConfig: {
    networkId: string;
    networkName: string;
    rpcUrl: string;
    blockExplorer: string;
  };
  contracts: {
    galaToken: string;
    usdcToken: string;
    ethToken: string;
    townToken: string;
    swapRouter: string;
  };
  features: {
    enableRealTrading: boolean;
    enableTestAccounts: boolean;
    showDebugInfo: boolean;
  };
}

// Detect environment based on hostname
const getEnvironmentFromHostname = (): string => {
  if (typeof window === 'undefined') return 'development';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('dex-frontend-test1.defi.gala.com')) {
    return 'staging';
  } else if (hostname.includes('dex.gala.com') || hostname.includes('galadefi.com')) {
    return 'production';
  } else {
    return 'development';
  }
};

// Environment configurations
const environments: Record<string, Environment> = {
  development: {
    name: 'Development',
    isProduction: false,
    isStaging: false,
    isDevelopment: true,
    walletConfig: {
      networkId: '0x1', // Ethereum Mainnet for dev (can be changed)
      networkName: 'Ethereum Mainnet',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      blockExplorer: 'https://etherscan.io',
    },
    contracts: {
      galaToken: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA', // GALA mainnet
      usdcToken: '0xA0b86a33E6411b64fE8F7C8B3c03e439eb3cfE8C', // USDC mainnet
      ethToken: '0x0000000000000000000000000000000000000000', // ETH (native)
      townToken: '0x3dd98c8A089dBCFF7e8FC8d4f532BD493501Ab7F', // TOWN mainnet
      swapRouter: '0x0000000000000000000000000000000000000001', // Mock router
    },
    features: {
      enableRealTrading: false,
      enableTestAccounts: true,
      showDebugInfo: true,
    },
  },
  
  staging: {
    name: 'Staging',
    isProduction: false,
    isStaging: true,
    isDevelopment: false,
    walletConfig: {
      networkId: '0xaa36a7', // Sepolia testnet
      networkName: 'Sepolia Test Network',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
      blockExplorer: 'https://sepolia.etherscan.io',
    },
    contracts: {
      galaToken: '0x0000000000000000000000000000000000000002', // Staging GALA
      usdcToken: '0x0000000000000000000000000000000000000003', // Staging USDC
      ethToken: '0x0000000000000000000000000000000000000000', // ETH (native)
      townToken: '0x0000000000000000000000000000000000000004', // Staging TOWN
      swapRouter: '0x0000000000000000000000000000000000000005', // Staging router
    },
    features: {
      enableRealTrading: true,
      enableTestAccounts: true,
      showDebugInfo: true,
    },
  },
  
  production: {
    name: 'Production',
    isProduction: true,
    isStaging: false,
    isDevelopment: false,
    walletConfig: {
      networkId: '0x1', // Ethereum Mainnet
      networkName: 'Ethereum Mainnet',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      blockExplorer: 'https://etherscan.io',
    },
    contracts: {
      galaToken: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA', // GALA mainnet
      usdcToken: '0xA0b86a33E6411b64fE8F7C8B3c03e439eb3cfE8C', // USDC mainnet
      ethToken: '0x0000000000000000000000000000000000000000', // ETH (native)
      townToken: '0x3dd98c8A089dBCFF7e8FC8d4f532BD493501Ab7F', // TOWN mainnet
      swapRouter: '0x0000000000000000000000000000000000000006', // Production router
    },
    features: {
      enableRealTrading: true,
      enableTestAccounts: false,
      showDebugInfo: false,
    },
  },
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  const envName = getEnvironmentFromHostname();
  return environments[envName] || environments.development;
};

// Export current environment instance
export const ENV = getCurrentEnvironment();

// Helper functions
export const isProduction = () => ENV.isProduction;
export const isStaging = () => ENV.isStaging;
export const isDevelopment = () => ENV.isDevelopment;

// Console logging for environment detection
if (typeof window !== 'undefined') {
  console.log(`🌍 Environment: ${ENV.name}`, {
    hostname: window.location.hostname,
    config: ENV,
  });
}