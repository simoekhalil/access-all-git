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
  return ((executionPrice - midPrice) / midPrice) * 100;
};

// Mock exchange rates for GalaSwap tokens (same as in SwapInterface)
const GALA_SWAP_RATES: Record<string, Record<string, number>> = {
  GALA: { 
    ETIME: 0.5,      // 1 GALA = 0.5 ETIME
    SILK: 0.25,      // 1 GALA = 0.25 SILK
    MTRM: 2.0,       // 1 GALA = 2.0 MTRM
    GUSDT: 0.025,    // 1 GALA = 0.025 GUSDT (~$0.025)
    GUSDC: 0.025,    // 1 GALA = 0.025 GUSDC (~$0.025)
    GWETH: 0.000008  // 1 GALA = 0.000008 GWETH
  },
  ETIME: { GALA: 2.0 },        // 1 ETIME = 2.0 GALA
  SILK: { GALA: 4.0 },         // 1 SILK = 4.0 GALA  
  MTRM: { GALA: 0.5 },         // 1 MTRM = 0.5 GALA
  GUSDT: { GALA: 40.0 },       // 1 GUSDT = 40.0 GALA
  GUSDC: { GALA: 40.0 },       // 1 GUSDC = 40.0 GALA
  GWETH: { GALA: 125000.0 },   // 1 GWETH = 125000.0 GALA
};

// Simulate execution price with slippage (same model as SwapInterface)
const getExecutionPrice = (from: string, to: string, amount: number): number => {
  const midPrice = GALA_SWAP_RATES[from]?.[to] || 1;
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
    test('GALA → ETIME: should calculate correct price impact for different trade sizes', () => {
      const from = 'GALA';
      const to = 'ETIME';
      const midPrice = GALA_SWAP_RATES[from][to]; // 0.5

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

    test('GALA → GUSDC: stablecoin pair should follow same formula', () => {
      const from = 'GALA';
      const to = 'GUSDC';
      const midPrice = GALA_SWAP_RATES[from][to]; // 0.025
      
      const amount = 1000;
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Formula should work the same for stablecoin pairs
      expect(impact).toBeGreaterThan(0);
      expect(isNaN(impact)).toBe(false);
      expect(isFinite(impact)).toBe(true);
    });

    test('GWETH → GALA: high-value token pair should handle large numbers', () => {
      const from = 'GWETH';
      const to = 'GALA';
      const midPrice = GALA_SWAP_RATES[from][to]; // 125,000
      
      const amount = 0.1; // 0.1 GWETH
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Should handle large mid price values correctly
      expect(impact).toBeGreaterThanOrEqual(0);
      expect(isNaN(impact)).toBe(false);
      expect(isFinite(impact)).toBe(true);
    });

    test('SILK → GALA: gaming token pair should calculate impact correctly', () => {
      const from = 'SILK';
      const to = 'GALA';
      const midPrice = GALA_SWAP_RATES[from][to]; // 4.0
      
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
      // Test GALA → ETIME vs ETIME → GALA
      const galaToEtimeRate = GALA_SWAP_RATES.GALA.ETIME; // 0.5
      const etimeToGalaRate = GALA_SWAP_RATES.ETIME.GALA; // 2.0
      
      // These should be mathematical inverses
      expect(galaToEtimeRate * etimeToGalaRate).toBeCloseTo(1, 6);
      
      // Price impact formula should work consistently for both directions
      const amount1 = 100;
      const executionPrice1 = getExecutionPrice('GALA', 'ETIME', amount1);
      const impact1 = calculatePriceImpact(galaToEtimeRate, executionPrice1);
      
      const amount2 = 50; // Equivalent amount in reverse direction
      const executionPrice2 = getExecutionPrice('ETIME', 'GALA', amount2);
      const impact2 = calculatePriceImpact(etimeToGalaRate, executionPrice2);
      
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
      // Simulate a typical user swapping 500 GALA for ETIME
      const from = 'GALA';
      const to = 'ETIME';
      const amount = 500;
      
      const midPrice = GALA_SWAP_RATES[from][to];
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
      // Simulate a whale trade: 100,000 GALA for GUSDC
      const from = 'GALA';
      const to = 'GUSDC';
      const amount = 100000;
      
      const midPrice = GALA_SWAP_RATES[from][to];
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Large trades should have significant impact
      expect(impact).toBeGreaterThan(20);
      expect(impact).toBeLessThan(100); // But still within reasonable bounds
    });

    test('should handle micro trades with minimal impact', () => {
      // Simulate a micro trade: 1 GALA for MTRM
      const from = 'GALA';
      const to = 'MTRM';
      const amount = 1;
      
      const midPrice = GALA_SWAP_RATES[from][to];
      const executionPrice = getExecutionPrice(from, to, amount);
      const impact = calculatePriceImpact(midPrice, executionPrice);
      
      // Small trades should have minimal impact
      expect(impact).toBeGreaterThanOrEqual(0);
      expect(impact).toBeLessThan(1); // Less than 1%
    });
  });
});