import { vi } from 'vitest';

export const mockWalletProvider = {
  isConnected: false,
  account: null,
  balance: '0',
  chainId: 1,
  
  connect: vi.fn().mockResolvedValue({
    account: '0x1234567890123456789012345678901234567890',
    chainId: 1
  }),
  
  disconnect: vi.fn().mockResolvedValue(true),
  
  switchChain: vi.fn().mockResolvedValue(true),
  
  getBalance: vi.fn().mockResolvedValue('1000.0'),
  
  signTransaction: vi.fn().mockResolvedValue('0xsignedtx'),
  
  sendTransaction: vi.fn().mockResolvedValue({
    hash: '0xtxhash',
    wait: vi.fn().mockResolvedValue({ status: 1 })
  })
};

export const mockTokens = {
  GALA: {
    address: '0xgala',
    symbol: 'GALA',
    decimals: 18,
    name: 'Gala',
    balance: '100.0',
    price: 0.05
  },
  USDC: {
    address: '0xusdc',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    balance: '1000.0',
    price: 1.0
  }
};

export const mockPools = [
  {
    id: 'gala-usdc',
    token0: mockTokens.GALA,
    token1: mockTokens.USDC,
    tvl: 150000,
    volume24h: 25000,
    apr: 12.5,
    liquidity: '75000.0'
  }
];