import { describe, test, expect } from 'vitest';

/**
 * Tests for Price Impact Formula Validation
 * Formula: Price Impact = (Average_Execution_Price - Mid_Price_Before) / Mid_Price_Before × 100
 * 
 * Based on GalaSwap token pairs: GALA, ETIME, SILK, MTRM, GUSDT, GUSDC, GWETH
 * All pairs route through GALA as documented in the GalaSwap blog post.
 */

// Helper function to calculate price impact using the exact formula
const calculatePriceImpact = (midPrice: number, executionPrice: number): number => {
  if (midPrice === 0) return 0;
  const impact = ((executionPrice - midPrice) / midPrice) * 100;
  // Round to 6 decimal places to eliminate floating point precision errors
  return Math.round(impact * 1000000) / 1000000;
};

// Mock exchange rates for current GalaSwap tokens (same as in SwapInterface)
const CURRENT_GALA_SWAP_RATES: Record<string, Record<string, number>> = {
  GALA: { 
    USDC: 0.025, USDT: 0.025, WBTC: 0.00000025, WETH: 0.0000075, 
    WEN: 250.0, '$GMUSIC': 0.8, FILM: 1.2, WXRP: 0.0125
  },
  USDC: { 
    GALA: 40.0, USDT: 1.0, WBTC: 0.00001, WETH: 0.0003, 
    WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 0.5
  },
  USDT: { 
    GALA: 40.0, USDC: 1.0, WBTC: 0.00001, WETH: 0.0003,
    WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 0.5
  },
  WBTC: { 
    GALA: 4000000.0, USDC: 100000.0, USDT: 100000.0, WETH: 30.0,
    WEN: 1000000000.0, '$GMUSIC': 128000.0, FILM: 192000.0, WXRP: 160000.0
  },
  WETH: { 
    GALA: 133333.0, USDC: 3333.0, USDT: 3333.0, WBTC: 0.033,
    WEN: 33333333.0, '$GMUSIC': 4266.0, FILM: 6400.0, WXRP: 5333.0
  },
  WEN: { 
    GALA: 0.004, USDC: 0.0001, USDT: 0.0001, WBTC: 0.000000001, WETH: 0.00000003,
    '$GMUSIC': 0.0032, FILM: 0.0048, WXRP: 0.00016
  },
  '$GMUSIC': { 
    GALA: 1.25, USDC: 0.03125, USDT: 0.03125, WBTC: 0.0000000078, WETH: 0.0000234,
    WEN: 312.5, FILM: 1.5, WXRP: 0.05
  },
  FILM: { 
    GALA: 0.833, USDC: 0.02083, USDT: 0.02083, WBTC: 0.0000000052, WETH: 0.000156,
    WEN: 208.3, '$GMUSIC': 0.667, WXRP: 0.033
  },
  WXRP: { 
    GALA: 80.0, USDC: 2.0, USDT: 2.0, WBTC: 0.00000625, WETH: 0.0001875,
    WEN: 6250.0, '$GMUSIC': 20.0, FILM: 30.0
  }
};

// Simulate execution price with slippage (same model as SwapInterface)
const getExecutionPrice = (from: string, to: string, amount: number): number => {
  const midPrice = CURRENT_GALA_SWAP_RATES[from]?.[to] || 1;
  if (amount === 0) return midPrice;
  
  // Simulate price impact based on trade size (square root model)
  const impactFactor = Math.sqrt(amount) * 0.001;
  return midPrice * (1 + impactFactor);
};

describe('GalaSwap Price Impact Formula Tests', () => {
  describe('Formula Mathematical Properties', () => {
    test('should return 0% impact when execution price equals mid price', () => {
      const midPrice = 0.5; // GALA → ETIME rate
      const executionPrice = 0.5; // Same as mid price
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBe(0);
    });

    test('should return positive impact when execution price is higher than mid price', () => {
      const midPrice = 0.5;
      const executionPrice = 0.55; // 10% higher execution price
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBe(10); // Should be exactly 10%
    });

    test('should return negative impact when execution price is lower than mid price', () => {
      const midPrice = 0.5;
      const executionPrice = 0.45; // 10% lower execution price
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBe(-10); // Should be exactly -10%
    });

    test('should handle zero mid price safely', () => {
      const midPrice = 0;
      const executionPrice = 0.5;
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBe(0); // Should not throw error, return 0
    });

    test('should calculate percentage correctly for small differences', () => {
      const midPrice = 2.0; // ETIME → GALA rate
      const executionPrice = 2.001; // Very small difference
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBeCloseTo(0.05, 2); // 0.05%
    });
  });

  describe('Real GalaSwap Token Pair Scenarios', () => {
    test('GALA → USDC: should calculate correct price impact for different trade sizes', () => {
      const from = 'GALA';
      const to = 'USDC';
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to]; // 0.025

      // Small trade (100 GALA)
      const smallAmount = 100;
      const smallExecutionPrice = getExecutionPrice(from, to, smallAmount);
      const smallImpact = calculatePriceImpact(midPrice, smallExecutionPrice);
      
      expect(smallImpact).toBeGreaterThan(0);
      expect(smallImpact).toBeLessThan(5); // Should be relatively small
      
      // Large trade (10,000 GALA)
      const largeAmount = 10000;
      const largeExecutionPrice = getExecutionPrice(from, to, largeAmount);
      const largeImpact = calculatePriceImpact(midPrice, largeExecutionPrice);
      
      expect(largeImpact).toBeGreaterThan(smallImpact); // Larger trade should have higher impact
      expect(largeImpact).toBeGreaterThan(5);
    });

    test('GALA → USDT: stablecoin pair should follow same formula', () => {
      const from = 'GALA';
      const to = 'USDT';
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to]; // 0.025
      
      const amount = 1000;
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Formula should work the same for stablecoin pairs
      expect(impact).toBeGreaterThan(0);
      expect(isNaN(impact)).toBe(false);
      expect(isFinite(impact)).toBe(true);
    });

    test('WETH → GALA: high-value token pair should handle large numbers', () => {
      const from = 'WETH';
      const to = 'GALA';
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to]; // 133,333
      
      const amount = 0.1; // 0.1 WETH
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Should handle large mid price values correctly
      expect(impact).toBeGreaterThanOrEqual(0);
      expect(isNaN(impact)).toBe(false);
      expect(isFinite(impact)).toBe(true);
    });

    test('$GMUSIC → GALA: ecosystem token pair should calculate impact correctly', () => {
      const from = '$GMUSIC';
      const to = 'GALA';
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to]; // 1.25
      
      const testAmounts = [10, 100, 1000];
      const impacts: number[] = [];
      
      testAmounts.forEach(amount => {
        const executionPrice = getExecutionPrice(from, to, amount);
        const impact = calculatePriceImpact(midPrice, executionPrice);
        impacts.push(impact);
      });
      
      // Impacts should increase with trade size
      expect(impacts[1]).toBeGreaterThan(impacts[0]);
      expect(impacts[2]).toBeGreaterThan(impacts[1]);
    });
  });

  describe('Formula Edge Cases and Precision', () => {
    test('should handle very small execution prices', () => {
      const midPrice = 0.000008; // GALA → GWETH rate
      const executionPrice = 0.000009; // Slightly higher
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBeCloseTo(12.5, 1); // 12.5% increase
    });

    test('should handle very large execution prices', () => {
      const midPrice = 125000; // GWETH → GALA rate
      const executionPrice = 137500; // 10% higher
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBeCloseTo(10, 1); // Should be 10%
    });

    test('should maintain precision for decimal calculations', () => {
      const midPrice = 2.0;
      const executionPrice = 2.123456789;
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      const expectedImpact = ((2.123456789 - 2.0) / 2.0) * 100;
      
      expect(impact).toBeCloseTo(expectedImpact, 8); // High precision
    });

    test('should handle negative execution prices gracefully', () => {
      const midPrice = 0.5;
      const executionPrice = -0.1; // Invalid negative price
      
      const impact = calculatePriceImpact(midPrice, executionPrice);
      expect(impact).toBe(-120); // Mathematical result, even if unrealistic
    });
  });

  describe('Symmetry and Consistency Tests', () => {
    test('should maintain mathematical consistency across inverse pairs', () => {
      // Test GALA → USDC vs USDC → GALA
      const galaToUsdcRate = CURRENT_GALA_SWAP_RATES.GALA.USDC; // 0.025
      const usdcToGalaRate = CURRENT_GALA_SWAP_RATES.USDC.GALA; // 40.0
      
      // These should be mathematical inverses
      expect(galaToUsdcRate * usdcToGalaRate).toBeCloseTo(1, 6);
      
      // Price impact formula should work consistently for both directions
      const amount1 = 100;
      const executionPrice1 = getExecutionPrice('GALA', 'USDC', amount1);
      const impact1 = calculatePriceImpact(galaToUsdcRate, executionPrice1);
      
      const amount2 = 2.5; // Equivalent amount in reverse direction (100 * 0.025)
      const executionPrice2 = getExecutionPrice('USDC', 'GALA', amount2);
      const impact2 = calculatePriceImpact(usdcToGalaRate, executionPrice2);
      
      // Both should produce positive impacts
      expect(impact1).toBeGreaterThan(0);
      expect(impact2).toBeGreaterThan(0);
    });

    test('should scale linearly with percentage changes in execution price', () => {
      const midPrice = 1.0;
      
      // Test different percentage increases
      const percentages = [1, 5, 10, 25, 50];
      percentages.forEach(percent => {
        const executionPrice = midPrice * (1 + percent / 100);
        const impact = calculatePriceImpact(midPrice, executionPrice);
        
        expect(impact).toBeCloseTo(percent, 6); // Should match the percentage exactly
      });
    });
  });

  describe('Real-World Scenario Validation', () => {
    test('should calculate realistic impact for typical GalaSwap trades', () => {
      // Simulate a typical user swapping 500 GALA for USDC
      const from = 'GALA';
      const to = 'USDC';
      const amount = 500;
      
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to];
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Should be a reasonable impact for a medium-sized trade
      expect(impact).toBeGreaterThan(0);
      expect(impact).toBeLessThan(25); // Should not be excessive
      
      // Impact should be approximately sqrt(500) * 0.1% = ~2.2%
      const expectedImpact = Math.sqrt(amount) * 0.1;
      expect(impact).toBeCloseTo(expectedImpact, 0);
    });

    test('should handle whale trades with appropriate high impact', () => {
      // Simulate a whale trade: 100,000 GALA for USDC
      const from = 'GALA';
      const to = 'USDC';
      const amount = 100000;
      
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to];
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Large trades should have significant impact
      expect(impact).toBeGreaterThan(20);
      expect(impact).toBeLessThan(100); // But still within reasonable bounds
    });

    test('should handle micro trades with minimal impact', () => {
      // Simulate a micro trade: 1 GALA for $GMUSIC
      const from = 'GALA';
      const to = '$GMUSIC';
      const amount = 1;
      
      const midPrice = CURRENT_GALA_SWAP_RATES[from][to];
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Small trades should have minimal impact
      expect(impact).toBeGreaterThanOrEqual(0);
      expect(impact).toBeLessThan(1); // Less than 1%
    });
  });
});