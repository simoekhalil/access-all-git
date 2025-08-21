import { describe, it, expect, vi, beforeEach } from 'vitest';
import { poolService } from '@/services/poolService';
import { mockTokens, mockPools } from '../mocks/wallet-mock';

global.fetch = vi.fn();

describe('Pool API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPools', () => {
    it('should fetch all pools successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPools,
      } as Response);

      const result = await poolService.getPools();

      expect(result).toEqual(mockPools);
      expect(fetch).toHaveBeenCalledWith('/api/pools');
    });

    it('should handle pool fetch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(poolService.getPools()).rejects.toThrow();
    });
  });

  describe('getPoolDetails', () => {
    it('should fetch specific pool details', async () => {
      const mockPoolDetails = {
        ...mockPools[0],
        reserves: {
          token0: '50000.0',
          token1: '2500.0'
        },
        fees24h: 125.50,
        transactions24h: 45
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoolDetails,
      } as Response);

      const result = await poolService.getPoolDetails('gala-usdc');

      expect(result).toEqual(mockPoolDetails);
      expect(fetch).toHaveBeenCalledWith('/api/pools/gala-usdc');
    });
  });

  describe('addLiquidity', () => {
    it('should add liquidity successfully', async () => {
      const mockResponse = {
        hash: '0xliquidity123',
        status: 'success',
        lpTokens: '50.0'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const liquidityParams = {
        poolId: 'gala-usdc',
        token0Amount: '1000.0',
        token1Amount: '50.0',
        minToken0: '950.0',
        minToken1: '47.5',
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      const result = await poolService.addLiquidity(liquidityParams);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        '/api/pools/add-liquidity',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(liquidityParams)
        })
      );
    });

    it('should handle add liquidity errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Insufficient balance' }),
      } as Response);

      const liquidityParams = {
        poolId: 'gala-usdc',
        token0Amount: '1000000.0',
        token1Amount: '50000.0',
        minToken0: '950000.0',
        minToken1: '47500.0',
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      await expect(poolService.addLiquidity(liquidityParams)).rejects.toThrow();
    });
  });

  describe('removeLiquidity', () => {
    it('should remove liquidity successfully', async () => {
      const mockResponse = {
        hash: '0xremove123',
        status: 'success',
        token0Amount: '500.0',
        token1Amount: '25.0'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const removeParams = {
        poolId: 'gala-usdc',
        lpTokens: '25.0',
        minToken0: '475.0',
        minToken1: '23.75',
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      const result = await poolService.removeLiquidity(removeParams);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserPositions', () => {
    it('should fetch user liquidity positions', async () => {
      const mockPositions = [
        {
          poolId: 'gala-usdc',
          lpTokens: '25.0',
          token0Amount: '500.0',
          token1Amount: '25.0',
          share: 0.033,
          value: 1025.0
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPositions,
      } as Response);

      const result = await poolService.getUserPositions('0x1234');

      expect(result).toEqual(mockPositions);
      expect(fetch).toHaveBeenCalledWith('/api/pools/positions/0x1234');
    });
  });

  describe('createPool', () => {
    it('should create new pool successfully', async () => {
      const mockResponse = {
        hash: '0xnewpool123',
        status: 'success',
        poolId: 'new-token-gala',
        poolAddress: '0xnewpooladdress'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const createParams = {
        token0: '0xnewtoken',
        token1: mockTokens.GALA.address,
        fee: 3000, // 0.3%
        initialPrice: '0.05',
        token0Amount: '1000.0',
        token1Amount: '50.0'
      };

      const result = await poolService.createPool(createParams);

      expect(result).toEqual(mockResponse);
    });

    it('should validate pool creation parameters', async () => {
      await expect(
        poolService.createPool({
          token0: mockTokens.GALA.address,
          token1: mockTokens.GALA.address, // Same token
          fee: 3000,
          initialPrice: '1.0',
          token0Amount: '1000.0',
          token1Amount: '1000.0'
        })
      ).rejects.toThrow('Cannot create pool with identical tokens');
    });
  });

  describe('getPoolAnalytics', () => {
    it('should fetch pool analytics data', async () => {
      const mockAnalytics = {
        volume24h: 25000,
        volumeWeek: 150000,
        fees24h: 75,
        feesWeek: 450,
        transactions24h: 45,
        transactionsWeek: 280,
        priceChange24h: 2.5,
        priceChangeWeek: -1.2
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      } as Response);

      const result = await poolService.getPoolAnalytics('gala-usdc');

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getHistoricalData', () => {
    it('should fetch historical pool data', async () => {
      const mockHistorical = [
        {
          timestamp: Date.now() - 86400000, // 24h ago
          tvl: 145000,
          volume: 1200,
          price: 0.048
        },
        {
          timestamp: Date.now(),
          tvl: 150000,
          volume: 1100,
          price: 0.05
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistorical,
      } as Response);

      const result = await poolService.getHistoricalData('gala-usdc', '24h');

      expect(result).toEqual(mockHistorical);
      expect(fetch).toHaveBeenCalledWith('/api/pools/gala-usdc/history?timeframe=24h');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pool list', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await poolService.getPools();
      expect(result).toEqual([]);
    });

    it('should handle pool not found', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(poolService.getPoolDetails('nonexistent-pool')).rejects.toThrow();
    });

    it('should validate liquidity amounts', async () => {
      await expect(
        poolService.addLiquidity({
          poolId: 'gala-usdc',
          token0Amount: '0', // Invalid amount
          token1Amount: '50.0',
          minToken0: '0',
          minToken1: '47.5',
          deadline: Math.floor(Date.now() / 1000) + 1200
        })
      ).rejects.toThrow('Token amounts must be greater than 0');
    });
  });
});