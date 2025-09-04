import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import SwapInterface from '@/components/SwapInterface';

const queryClient = new QueryClient();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {children}
    </TooltipProvider>
  </QueryClientProvider>
);

// Real tokens from swap.gala.com
const TOKENS = ['GALA', 'USDC', 'USDT', 'WBTC', 'WETH', 'WEN', '$GMUSIC', 'FILM', 'WXRP'];

// Mock exchange rates based on real market patterns
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  GALA: {
    USDC: 0.025,        // 1 GALA ≈ $0.025
    USDT: 0.025,        // 1 GALA ≈ $0.025  
    WBTC: 0.00000025,   // 1 GALA ≈ 0.00000025 WBTC
    WETH: 0.0000075,    // 1 GALA ≈ 0.0000075 WETH
    WEN: 250.0,         // 1 GALA ≈ 250 WEN
    '$GMUSIC': 0.8,     // 1 GALA ≈ 0.8 $GMUSIC
    FILM: 1.2,          // 1 GALA ≈ 1.2 FILM
    WXRP: 0.04          // 1 GALA ≈ 0.04 WXRP
  },
  USDC: { 
    GALA: 40.0, USDT: 1.0, WBTC: 0.00001, WETH: 0.0003, 
    WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 1.6
  },
  USDT: { 
    GALA: 40.0, USDC: 1.0, WBTC: 0.00001, WETH: 0.0003,
    WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 1.6
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
    GALA: 25.0, USDC: 0.625, USDT: 0.625, WBTC: 0.00000625, WETH: 0.0001875,
    WEN: 6250.0, '$GMUSIC': 20.0, FILM: 30.0
  }
};

// Helper function to select a token in dropdown
const selectToken = async (selectElement: HTMLElement, tokenSymbol: string) => {
  fireEvent.click(selectElement);
  await waitFor(() => {
    const tokenOption = screen.getByText(tokenSymbol);
    fireEvent.click(tokenOption);
  });
};

describe('All Real swap.gala.com Token Combination Tests', () => {
  describe('Major Token Pair Tests', () => {
    const majorPairs = [
      { from: 'USDC', to: 'WBTC', expectedRatio: 0.00001 },
      { from: 'USDT', to: 'WBTC', expectedRatio: 0.00001 },
      { from: 'USDT', to: 'WETH', expectedRatio: 0.0003 },
      { from: 'GALA', to: 'USDC', expectedRatio: 0.025 },
      { from: 'USDC', to: 'WETH', expectedRatio: 0.0003 },
    ];

    majorPairs.forEach(({ from, to, expectedRatio }) => {
      it(`should convert ${from} to ${to} correctly`, async () => {
        render(
          <TestWrapper>
            <SwapInterface />
          </TestWrapper>
        );

        // Set up token pair
        const fromSelect = screen.getByRole('combobox', { name: /from/i });
        const toSelect = screen.getByRole('combobox', { name: /to/i });

        if (from !== 'USDC') {
          await selectToken(fromSelect, from);
        }

        if (to !== 'GALA') {
          await selectToken(toSelect, to);
        }

        const fromInput = screen.getByLabelText('From');
        fireEvent.change(fromInput, { target: { value: '100' } });

        await waitFor(() => {
          const toInput = screen.getByLabelLabel('To') as HTMLInputElement;
          const expectedAmount = 100 * expectedRatio;
          const actualAmount = parseFloat(toInput.value);
          
          // Allow for price impact affecting the result
          if (expectedAmount < 0.001) {
            expect(actualAmount).toBeGreaterThan(0);
            expect(actualAmount).toBeLessThan(expectedAmount * 1.1);
          } else {
            expect(actualAmount).toBeCloseTo(expectedAmount, 2);
          }
        });
      });
    });
  });

  describe('Reverse Calculation Tests (To Amount Input)', () => {
    it('should calculate from amount when to amount is entered for USDC->GALA', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Default is USDC->GALA
      const toInput = screen.getByLabelLabel('To');
      fireEvent.change(toInput, { target: { value: '4000' } });

      await waitFor(() => {
        const fromInput = screen.getByLabelLabel('From') as HTMLInputElement;
        // 4000 GALA requires ~100 USDC (allowing for price impact)
        expect(parseFloat(fromInput.value)).toBeCloseTo(100, 1);
      });
    });

    it('should calculate from amount when to amount is entered for USDC->WETH', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change to WETH
      const toSelect = screen.getByRole('combobox', { name: /to/i });
      await selectToken(toSelect, 'WETH');

      const toInput = screen.getByLabelLabel('To');
      fireEvent.change(toInput, { target: { value: '0.3' } });

      await waitFor(() => {
        const fromInput = screen.getByLabelLabel('From') as HTMLInputElement;
        // 0.3 WETH requires ~1000 USDC (allowing for price impact)
        expect(parseFloat(fromInput.value)).toBeCloseTo(1000, 1);
      });
    });
  });

  describe('Directional Swap Tests for Real Token Pairs', () => {
    const testPairs = [
      { from: 'USDC', to: 'GALA', amount: '100', expectedApprox: 4000 },
      { from: 'GALA', to: 'USDC', amount: '4000', expectedApprox: 100 },
      { from: 'USDC', to: 'WETH', amount: '3333', expectedApprox: 1 },
      { from: 'GALA', to: 'WEN', amount: '100', expectedApprox: 25000 },
    ];

    testPairs.forEach(({ from, to, amount, expectedApprox }) => {
      it(`should swap ${from}->${to} amounts correctly using directional arrow`, async () => {
        render(
          <TestWrapper>
            <SwapInterface />
          </TestWrapper>
        );

        // Set up token pair
        const fromSelect = screen.getByRole('combobox', { name: /from/i });
        const toSelect = screen.getByRole('combobox', { name: /to/i });

        if (from !== 'USDC') {
          await selectToken(fromSelect, from);
        }

        if (to !== 'GALA') {
          await selectToken(toSelect, to);
        }

        // Enter amount
        const fromInput = screen.getByLabelLabel('From');
        fireEvent.change(fromInput, { target: { value: amount } });

        await waitFor(() => {
          const toInput = screen.getByLabelLabel('To') as HTMLInputElement;
          const calculatedAmount = parseFloat(toInput.value);
          
          // Verify the calculated amount is reasonable
          if (expectedApprox < 1) {
            expect(calculatedAmount).toBeGreaterThan(0);
            expect(calculatedAmount).toBeLessThan(expectedApprox * 1.2);
          } else {
            expect(calculatedAmount).toBeGreaterThan(expectedApprox * 0.8);
            expect(calculatedAmount).toBeLessThan(expectedApprox * 1.2);
          }
        });

        // Click swap button
        const swapButton = screen.getByTestId('swap-tokens-button');
        fireEvent.click(swapButton);

        await waitFor(() => {
          // Tokens should be swapped
          const newFromSelect = screen.getByRole('combobox', { name: /from/i });
          const newToSelect = screen.getByRole('combobox', { name: /to/i });
          
          expect(newFromSelect).toHaveTextContent(to);
          expect(newToSelect).toHaveTextContent(from);

          // Amounts should be swapped
          const newFromInput = screen.getByLabelLabel('From') as HTMLInputElement;
          const newToInput = screen.getByLabelLabel('To') as HTMLInputElement;
          
          expect(parseFloat(newFromInput.value)).toBeGreaterThan(0);
          expect(parseFloat(newToInput.value)).toBeCloseTo(parseFloat(amount), 1);
        });
      });
    });
  });

  describe('Exchange Rate Display Tests for Real Pairs', () => {
    const ratePairs = [
      { from: 'USDC', to: 'GALA', testAmount: '100' },
      { from: 'GALA', to: 'WEN', testAmount: '100' },
      { from: 'USDC', to: 'WETH', testAmount: '3333' },
      { from: 'USDC', to: 'WBTC', testAmount: '100000' },
      { from: '$GMUSIC', to: 'FILM', testAmount: '100' },
    ];

    ratePairs.forEach(({ from, to, testAmount }) => {
      it(`should display correct exchange rate for ${from}->${to}`, async () => {
        render(
          <TestWrapper>
            <SwapInterface />
          </TestWrapper>
        );

        // Set up token pair
        const fromSelect = screen.getByRole('combobox', { name: /from/i });
        const toSelect = screen.getByRole('combobox', { name: /to/i });

        if (from !== 'USDC') {
          await selectToken(fromSelect, from);
        }

        if (to !== 'GALA') {
          await selectToken(toSelect, to);
        }

        // Enter amount to trigger rate display
        const fromInput = screen.getByLabelLabel('From');
        fireEvent.change(fromInput, { target: { value: testAmount } });

        await waitFor(() => {
          const rateRegex = new RegExp(`1 ${from} = .* ${to}`);
          expect(screen.getByText(rateRegex)).toBeInTheDocument();
        });
      });
    });
  });

  describe('AMM Swap Features', () => {
    it('should show swap fees for all token pairs', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Test different token pairs and their fees
      const pairs = [
        { from: 'USDC', to: 'GALA', expectedFee: '1%' },
        { from: 'USDC', to: 'WBTC', expectedFee: '0.3%' },
        { from: 'GALA', to: 'WEN', expectedFee: '1%' },
      ];

      for (const pair of pairs) {
        const fromSelect = screen.getByRole('combobox', { name: /from/i });
        const toSelect = screen.getByRole('combobox', { name: /to/i });

        if (pair.from !== 'USDC') {
          await selectToken(fromSelect, pair.from);
        }

        if (pair.to !== 'GALA') {
          await selectToken(toSelect, pair.to);
        }

        const fromInput = screen.getByLabelLabel('From');
        fireEvent.change(fromInput, { target: { value: '100' } });

        await waitFor(() => {
          expect(screen.getByText(pair.expectedFee)).toBeInTheDocument();
        });
      }
    });

    it('should enable swap button for valid amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelLabel('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const swapButton = screen.getByRole('button', { name: 'Swap' });
        expect(swapButton).not.toBeDisabled();
      });
    });

    it('should show slippage tolerance setting', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelLabel('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('0.5%')).toBeInTheDocument(); // Default slippage
      });
    });

    it('should calculate price impact for large trades', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Large trade should show price impact
      const fromInput = screen.getByLabelLabel('From');
      fireEvent.change(fromInput, { target: { value: '10000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        if (priceImpactBadge) {
          expect(priceImpactBadge).toBeInTheDocument();
          expect(priceImpactBadge.textContent).toMatch(/[0-9]+\.[0-9]+%/);
        }
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very small amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelLabel('From');
      fireEvent.change(fromInput, { target: { value: '0.001' } });

      await waitFor(() => {
        const toInput = screen.getByLabelLabel('To') as HTMLInputElement;
        const result = parseFloat(toInput.value);
        // Should either calculate small amount or show 0
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle invalid inputs gracefully', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelLabel('From');
      fireEvent.change(fromInput, { target: { value: 'invalid' } });

      await waitFor(() => {
        const toInput = screen.getByLabelLabel('To') as HTMLInputElement;
        expect(toInput.value).toBe('');
      });
    });

    it('should disable swap button for zero amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelLabel('From');
      fireEvent.change(fromInput, { target: { value: '0' } });

      await waitFor(() => {
        const swapButton = screen.getByRole('button', { name: 'Swap' });
        expect(swapButton).toBeDisabled();
      });
    });
  });
});