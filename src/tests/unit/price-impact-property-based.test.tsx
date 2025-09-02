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

// Helper function to extract price impact value
const extractPriceImpact = (element: HTMLElement): number => {
  const text = element.textContent || '';
  return parseFloat(text.replace('%', '').replace('+', ''));
};

// Helper function to get a random amount within bounds
const getRandomAmount = (min: number, max: number): string => {
  const random = Math.random() * (max - min) + min;
  return random.toFixed(6);
};

describe('Price Impact Property-Based Tests', () => {
  let container: HTMLElement;

  beforeEach(() => {
    const result = render(
      <TestWrapper>
        <SwapInterface />
      </TestWrapper>
    );
    container = result.container;
  });

  describe('Mathematical Properties', () => {
    test('property: larger trade amounts should have higher or equal price impact', async () => {
      const amounts = ['100', '1000', '10000', '100000'];
      const impacts: number[] = [];

      for (const amount of amounts) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = Math.abs(extractPriceImpact(priceImpactBadge));
        impacts.push(impact);

        // Clear the input for next iteration
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }

      // Verify that impacts are generally increasing (allowing for small variations)
      for (let i = 1; i < impacts.length; i++) {
        // Allow for some tolerance due to the square root model
        expect(impacts[i]).toBeGreaterThanOrEqual(impacts[i - 1] * 0.9);
      }
    });

    test('property: price impact should be proportional to square root of amount', async () => {
      const baseAmount = 1000;
      const amounts = [baseAmount, baseAmount * 4, baseAmount * 9, baseAmount * 16]; // 1x, 2²x, 3²x, 4²x
      const impacts: number[] = [];

      for (const amount of amounts) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount.toString() } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = Math.abs(extractPriceImpact(priceImpactBadge));
        impacts.push(impact);

        // Clear the input
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }

      // Check approximate square root relationship (with tolerance for model simplification)
      const ratios = impacts.map((impact, i) => impact / impacts[0]);
      const expectedRatios = [1, 2, 3, 4]; // sqrt(1), sqrt(4), sqrt(9), sqrt(16)

      for (let i = 0; i < ratios.length; i++) {
        expect(ratios[i]).toBeCloseTo(expectedRatios[i], 0); // Within 0.5 tolerance
      }
    });

    test('property: price impact should be consistent for equivalent amounts', async () => {
      const equivalentAmounts = ['1000', '1000.0', '1000.000000'];
      const impacts: number[] = [];

      for (const amount of equivalentAmounts) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = extractPriceImpact(priceImpactBadge);
        impacts.push(impact);

        // Clear the input
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }

      // All impacts should be identical
      for (let i = 1; i < impacts.length; i++) {
        expect(impacts[i]).toBeCloseTo(impacts[0], 6);
      }
    });

    test('property: price impact should always be non-negative', async () => {
      const randomAmounts = Array.from({ length: 20 }, () => getRandomAmount(0.001, 100000));

      for (const amount of randomAmounts) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = extractPriceImpact(priceImpactBadge);
        
        expect(impact).toBeGreaterThanOrEqual(0);

        // Clear the input
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Boundary Testing', () => {
    test('property: price impact approaches zero as amount approaches zero', async () => {
      const smallAmounts = ['1', '0.1', '0.01', '0.001'];
      const impacts: number[] = [];

      for (const amount of smallAmounts) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = Math.abs(extractPriceImpact(priceImpactBadge));
        impacts.push(impact);

        // Clear the input
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }

      // Impacts should be decreasing
      for (let i = 1; i < impacts.length; i++) {
        expect(impacts[i]).toBeLessThanOrEqual(impacts[i - 1]);
      }

      // Smallest impact should be very close to zero
      expect(impacts[impacts.length - 1]).toBeLessThan(0.01);
    });

    test('property: price impact grows unbounded for very large amounts', async () => {
      const largeAmounts = ['10000', '100000', '1000000'];
      const impacts: number[] = [];

      for (const amount of largeAmounts) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = Math.abs(extractPriceImpact(priceImpactBadge));
        impacts.push(impact);

        // Clear the input
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }

      // Impacts should be increasing
      for (let i = 1; i < impacts.length; i++) {
        expect(impacts[i]).toBeGreaterThan(impacts[i - 1]);
      }

      // Largest impact should be significant
      expect(impacts[impacts.length - 1]).toBeGreaterThan(10);
    });
  });

  describe('Token Pair Consistency', () => {
    test('property: price impact model should be consistent across token pairs', async () => {
      const testAmount = '1000';
      const tokenPairs = [
        { from: 'GALA', to: 'USDC' },
        { from: 'GALA', to: 'USDT' },
        { from: 'USDC', to: 'WETH' },
        { from: 'WETH', to: 'GALA' }
      ];

      const impacts: Array<{ pair: string; impact: number }> = [];

      for (const pair of tokenPairs) {
        // Set from token
        const fromTokenButton = screen.getByDisplayValue(screen.getByDisplayValue(/GALA|USDC|WETH|USDT/).getAttribute('value') || 'GALA');
        fireEvent.click(fromTokenButton);
        
        const fromOption = screen.getByText(pair.from);
        fireEvent.click(fromOption);

        await waitFor(() => {
          expect(screen.getByDisplayValue(pair.from)).toBeInTheDocument();
        });

        // Ensure to token is different
        const toTokenButton = screen.getAllByRole('combobox')[1];
        fireEvent.click(toTokenButton);
        
        const toOption = screen.getByText(pair.to);
        fireEvent.click(toOption);

        await waitFor(() => {
          expect(screen.getByDisplayValue(pair.to)).toBeInTheDocument();
        });

        // Enter amount
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: testAmount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = Math.abs(extractPriceImpact(priceImpactBadge));
        
        impacts.push({
          pair: `${pair.from}-${pair.to}`,
          impact
        });

        // Clear for next iteration
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }

      // All impacts should be positive and reasonable
      impacts.forEach(({ impact, pair }) => {
        expect(impact).toBeGreaterThan(0);
        expect(impact).toBeLessThan(100); // Reasonable upper bound
      });

      // Impacts should be within a reasonable range of each other (same model applied)
      const minImpact = Math.min(...impacts.map(i => i.impact));
      const maxImpact = Math.max(...impacts.map(i => i.impact));
      
      // Allow for some variation but they should be in the same order of magnitude
      expect(maxImpact / minImpact).toBeLessThan(10);
    });
  });

  describe('Numerical Stability', () => {
    test('property: price impact calculation should be numerically stable', async () => {
      // Test with numbers that might cause floating point issues
      const testCases = [
        '0.000001',
        '999999.999999',
        '123.456789012345',
        '1e-6',
        '1e6'
      ];

      for (const amount of testCases) {
        const fromAmountInput = screen.getByLabelText('From');
        fireEvent.change(fromAmountInput, { target: { value: amount } });

        await waitFor(() => {
          const priceImpactBadge = screen.queryByTestId('price-impact-badge');
          expect(priceImpactBadge).toBeInTheDocument();
        });

        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        const impact = extractPriceImpact(priceImpactBadge);
        
        // Should not be NaN or Infinity
        expect(isNaN(impact)).toBe(false);
        expect(isFinite(impact)).toBe(true);
        expect(impact).toBeGreaterThanOrEqual(0);

        // Clear the input
        fireEvent.change(fromAmountInput, { target: { value: '' } });
        await waitFor(() => {
          const badge = screen.queryByTestId('price-impact-badge');
          expect(badge).not.toBeInTheDocument();
        });
      }
    });
  });
});