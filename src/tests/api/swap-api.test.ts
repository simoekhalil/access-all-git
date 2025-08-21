import { describe, it, expect, vi, beforeEach } from 'vitest';
import { swapService } from '@/services/swapService';
import { mockTokens } from '../mocks/wallet-mock';

// Mock fetch globally
global.fetch = vi.fn();

describe('Swap API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should fetch quote successfully', async () => {
      const mockResponse = {
        outputAmount: '2000.0',
        priceImpact: 0.1,
        route: ['USDC', 'GALA'],
        gasEstimate: '21000'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await swapService.getQuote(
        mockTokens.USDC.address,
        mockTokens.GALA.address,
        '100.0'
      );

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/swap/quote'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenIn: mockTokens.USDC.address,
            tokenOut: mockTokens.GALA.address,
            amountIn: '100.0'
          })
        })
      );
    });

    it('should handle quote API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(
        swapService.getQuote(
          mockTokens.USDC.address,
          mockTokens.GALA.address,
          '100.0'
        )
      ).rejects.toThrow('Failed to get quote: 400 Bad Request');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        swapService.getQuote(
          mockTokens.USDC.address,
          mockTokens.GALA.address,
          '100.0'
        )
      ).rejects.toThrow('Network error');
    });
  });

  describe('executeSwap', () => {
    it('should execute swap successfully', async () => {
      const mockResponse = {
        hash: '0x1234567890abcdef',
        status: 'success',
        gasUsed: '18500'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const swapParams = {
        tokenIn: mockTokens.USDC.address,
        tokenOut: mockTokens.GALA.address,
        amountIn: '100.0',
        amountOutMin: '1900.0',
        slippageTolerance: 0.5,
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      const result = await swapService.executeSwap(swapParams);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/swap/execute'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(swapParams)
        })
      );
    });

    it('should handle swap execution errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Insufficient liquidity' }),
      } as Response);

      const swapParams = {
        tokenIn: mockTokens.USDC.address,
        tokenOut: mockTokens.GALA.address,
        amountIn: '100.0',
        amountOutMin: '1900.0',
        slippageTolerance: 0.5,
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      await expect(swapService.executeSwap(swapParams)).rejects.toThrow();
    });
  });

  describe('getTokenPrices', () => {
    it('should fetch token prices successfully', async () => {
      const mockPrices = {
        [mockTokens.GALA.address]: 0.05,
        [mockTokens.USDC.address]: 1.0
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrices,
      } as Response);

      const result = await swapService.getTokenPrices([
        mockTokens.GALA.address,
        mockTokens.USDC.address
      ]);

      expect(result).toEqual(mockPrices);
    });
  });

  describe('getSwapHistory', () => {
    it('should fetch user swap history', async () => {
      const mockHistory = [
        {
          id: '1',
          tokenIn: mockTokens.USDC.address,
          tokenOut: mockTokens.GALA.address,
          amountIn: '100.0',
          amountOut: '2000.0',
          timestamp: Date.now(),
          txHash: '0xhistory1'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      } as Response);

      const result = await swapService.getSwapHistory('0x1234');

      expect(result).toEqual(mockHistory);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/swap/history/0x1234')
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '60' }),
      } as Response);

      await expect(
        swapService.getQuote(
          mockTokens.USDC.address,
          mockTokens.GALA.address,
          '100.0'
        )
      ).rejects.toThrow('Rate limit exceeded. Retry after 60 seconds');
    });
  });

  describe('Input Validation', () => {
    it('should validate token addresses', async () => {
      await expect(
        swapService.getQuote('invalid-address', mockTokens.GALA.address, '100.0')
      ).rejects.toThrow('Invalid token address');
    });

    it('should validate amounts', async () => {
      await expect(
        swapService.getQuote(
          mockTokens.USDC.address,
          mockTokens.GALA.address,
          '0'
        )
      ).rejects.toThrow('Amount must be greater than 0');

      await expect(
        swapService.getQuote(
          mockTokens.USDC.address,
          mockTokens.GALA.address,
          'invalid'
        )
      ).rejects.toThrow('Invalid amount format');
    });
  });
});