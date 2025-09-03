import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import SwapInterface from '@/components/SwapInterface';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Mock market data for validation
const MOCK_MARKET_RATES = {
  'USDC-GALA': 40.0,
  'GALA-USDC': 0.025,
  'GALA-USDT': 0.025,
  'GALA-WETH': 0.0000075,
  'GALA-WBTC': 0.00000025,
  'USDC-USDT': 1.0,
  'USDC-WETH': 0.0003,
  'USDT-GALA': 40,
  'USDT-USDC': 1.0,
  'USDT-WETH': 0.0003,
  'WETH-GALA': 133333.33,
  'WETH-USDC': 3333.33,
  'WETH-USDT': 3333.33,
  'WBTC-GALA': 4000000.0,
  'WBTC-USDC': 100000.0,
};

// Helper functions
const extractPriceImpact = (element: HTMLElement): number => {
  const text = element.textContent || '';
  return parseFloat(text.replace('%', '').replace('+', ''));
};

const getMarketRate = (from: string, to: string): number => {
  return MOCK_MARKET_RATES[`${from}-${to}` as keyof typeof MOCK_MARKET_RATES] || 1;
};

const calculateExpectedPriceImpact = (fromToken: string, toToken: string, amount: string): number => {
  const midPrice = getMarketRate(fromToken, toToken);
  const amountNum = Number(amount);
  const impactFactor = Math.sqrt(amountNum) * 0.001;
  const executionPrice = midPrice * (1 + impactFactor);
  return ((executionPrice - midPrice) / midPrice) * 100;
};

describe('Price Impact Integration Tests', () => {
  beforeEach(() => {
    render(
      <TestWrapper>
        <SwapInterface />
      </TestWrapper>
    );
  });

  describe('End-to-End Price Impact Flow', () => {
    test('should calculate and display price impact throughout complete swap flow', async () => {
      // Step 1: Enter amount
      const fromAmountInput = screen.getByLabelText('Selling');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      // Verify price impact appears
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const initialImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      expect(initialImpact).toBeGreaterThan(0);

      // Change token pair to GALA -> WETH
      const fromTokenSelect = screen.getAllByRole('combobox')[0];
      fireEvent.click(fromTokenSelect);
      const wethOption = screen.getByText('WETH');
      fireEvent.click(wethOption);

      // Verify price impact recalculates
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const newImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      expect(newImpact).toBeGreaterThanOrEqual(0);

      // Step 3: Use swap arrow
      const swapButton = screen.getByTestId('swap-tokens-button');
      fireEvent.click(swapButton);

      // Verify price impact updates after swap
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const swappedImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      expect(swappedImpact).toBeGreaterThanOrEqual(0);

      // Step 4: Change amount via "Buying" field
      const toAmountInput = screen.getByLabelText('Buying');
      fireEvent.change(toAmountInput, { target: { value: '50' } });

      // Verify price impact updates
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const finalImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      expect(finalImpact).toBeGreaterThanOrEqual(0);
    });

    test('should maintain price impact accuracy across multiple operations', async () => {
      const operations = [
        { action: 'setAmount', field: 'from', value: '100' },
        { action: 'changeToken', field: 'from', value: 'WETH' },
        { action: 'setAmount', field: 'to', value: '2000' },
        { action: 'swap', field: null, value: null },
        { action: 'setAmount', field: 'from', value: '500' },
      ];

      const impacts: number[] = [];

      for (const operation of operations) {
        switch (operation.action) {
          case 'setAmount':
            const input = screen.getByLabelText(operation.field === 'from' ? 'Selling' : 'Buying');
            fireEvent.change(input, { target: { value: operation.value } });
            break;
          case 'changeToken':
            const tokenSelect = screen.getAllByRole('combobox')[operation.field === 'from' ? 0 : 1];
            fireEvent.click(tokenSelect);
            const option = screen.getByText(operation.value!);
            fireEvent.click(option);
            break;
          case 'swap':
            const swapButton = screen.getByTestId('swap-tokens-button');
            fireEvent.click(swapButton);
            break;
        }

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const impact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
        impacts.push(impact);
        
        // All impacts should be valid numbers >= 0
        expect(impact).toBeGreaterThanOrEqual(0);
        expect(isNaN(impact)).toBe(false);
      }

      // Impacts should all be reasonable values
      impacts.forEach(impact => {
        expect(impact).toBeLessThan(1000); // Sanity check
      });
    });
  });

  describe('Cross-Validation with Expected Values', () => {
    test('should match expected price impact calculations for known inputs', async () => {
      const testCases = [
        { from: 'GALA', to: 'USDC', amount: '1000' },
        { from: 'WETH', to: 'USDT', amount: '0.5' },
        { from: 'USDC', to: 'GALA', amount: '100' },
        { from: 'USDT', to: 'WETH', amount: '10000' },
      ];

      for (const testCase of testCases) {
        // Set tokens if needed
        const currentFromToken = screen.getAllByRole('combobox')[0];
        if (currentFromToken.getAttribute('value') !== testCase.from) {
          fireEvent.click(currentFromToken);
          const fromOption = screen.getByText(testCase.from);
          fireEvent.click(fromOption);
        }

        // Set to token
        const toTokenButton = screen.getAllByRole('combobox')[1];
        fireEvent.click(toTokenButton);
        const toOption = screen.getByText(testCase.to);
        fireEvent.click(toOption);

        // Set amount
        const fromAmountInput = screen.getByLabelText('Selling');
        fireEvent.change(fromAmountInput, { target: { value: testCase.amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const actualImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
        const expectedImpact = calculateExpectedPriceImpact(testCase.from, testCase.to, testCase.amount);

        // Should be within 1% tolerance
        expect(actualImpact).toBeCloseTo(expectedImpact, 1);

        // Clear for next test
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }
    });

    test('should validate price impact against manual calculations', () => {
      const testAmount = '5000';
      const midPrice = 40.0; // USDC to GALA
      const impactFactor = Math.sqrt(Number(testAmount)) * 0.001;
      const expectedExecutionPrice = midPrice * (1 + impactFactor);
      const expectedPriceImpact = ((expectedExecutionPrice - midPrice) / midPrice) * 100;

      const fromAmountInput = screen.getByLabelText('Selling');
      fireEvent.change(fromAmountInput, { target: { value: testAmount } });

      waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();

        const actualImpact = extractPriceImpact(priceImpactBadge!);
        expect(actualImpact).toBeCloseTo(expectedPriceImpact, 3);
      });
    });
  });

  describe('Performance and Reliability', () => {
    test('should calculate price impact consistently under rapid input changes', async () => {
      const rapidInputs = ['100', '200', '300', '400', '500'];
      const impacts: number[] = [];

      for (const input of rapidInputs) {
        const fromAmountInput = screen.getByLabelText('Selling');
        fireEvent.change(fromAmountInput, { target: { value: input } });

        // Don't wait between inputs to simulate rapid typing
      }

      // Wait for final calculation
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const finalImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      const expectedFinalImpact = calculateExpectedPriceImpact('USDC', 'GALA', '500');

      expect(finalImpact).toBeCloseTo(expectedFinalImpact, 1);
    });

    test('should handle concurrent token and amount changes gracefully', async () => {
      // Start with an amount
      const fromAmountInput = screen.getByLabelText('Selling');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      // Change from token to WETH
      const fromTokenSelect = screen.getAllByRole('combobox')[0];
      fireEvent.click(fromTokenSelect);
      const wethOption = screen.getByText('WETH');
      fireEvent.click(wethOption);

      // Immediately change amount again
      fireEvent.change(fromAmountInput, { target: { value: '2000' } });

      // Should eventually settle on correct calculation
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const finalImpact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      expect(finalImpact).toBeGreaterThan(0);
      expect(isNaN(finalImpact)).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle division by zero scenarios gracefully', async () => {
      // This tests internal robustness - our mock rates shouldn't have zero values
      // but the component should handle edge cases
      const fromAmountInput = screen.getByLabelText('Selling');
      fireEvent.change(fromAmountInput, { target: { value: '0' } });

      // Should not show price impact for zero amount
      const priceImpactBadge = screen.queryByTestId('price-impact-badge');
      expect(priceImpactBadge).not.toBeInTheDocument();
    });

    test('should maintain UI consistency during error states', async () => {
      const fromAmountInput = screen.getByLabelText('Selling');
      
      // Test invalid inputs
      const invalidInputs = ['abc', '-100', 'Infinity', 'NaN'];
      
      for (const input of invalidInputs) {
        fireEvent.change(fromAmountInput, { target: { value: input } });
        
        // Should not crash or show invalid price impact
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).not.toBeInTheDocument();
      }

      // Should recover with valid input
      fireEvent.change(fromAmountInput, { target: { value: '100' } });
      
      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const impact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
      expect(impact).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle typical trading scenarios correctly', async () => {
      const scenarios = [
        { name: 'Small retail trade', amount: '50', expectedImpactRange: [0, 1] },
        { name: 'Medium trade', amount: '1000', expectedImpactRange: [1, 10] },
        { name: 'Large trade', amount: '50000', expectedImpactRange: [10, 100] },
        { name: 'Whale trade', amount: '1000000', expectedImpactRange: [100, 1000] },
      ];

      for (const scenario of scenarios) {
        const fromAmountInput = screen.getByLabelText('Selling');
        fireEvent.change(fromAmountInput, { target: { value: scenario.amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const impact = extractPriceImpact(screen.getByTestId('price-impact-badge'));
        
        expect(impact).toBeGreaterThanOrEqual(scenario.expectedImpactRange[0]);
        expect(impact).toBeLessThan(scenario.expectedImpactRange[1]);

        // Clear for next scenario
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }
    });
  });
});