import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import SwapInterface from '@/components/SwapInterface';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {children}
    </TooltipProvider>
  </QueryClientProvider>
);

// All available tokens and their expected exchange rates
const TOKENS = ['GALA', 'USDC', 'USDT', 'WBTC', 'WETH', 'WEN', '$GMUSIC', 'FILM', 'WXRP'];
const EXCHANGE_RATES = {
  GALA: { USDC: 0.025, USDT: 0.025, WBTC: 0.00000025, WETH: 0.0000075, WEN: 250.0, '$GMUSIC': 0.8, FILM: 1.2, WXRP: 0.0125 },
  USDC: { GALA: 40.0, USDT: 1.0, WBTC: 0.00001, WETH: 0.0003, WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 0.5 },
  USDT: { GALA: 40.0, USDC: 1.0, WBTC: 0.00001, WETH: 0.0003, WEN: 10000.0, '$GMUSIC': 32.0, FILM: 48.0, WXRP: 0.5 },
  WBTC: { GALA: 4000000.0, USDC: 100000.0, USDT: 100000.0, WETH: 30.0, WEN: 1000000000.0, '$GMUSIC': 128000.0, FILM: 192000.0, WXRP: 160000.0 },
  WETH: { GALA: 133333.33, USDC: 3333.33, USDT: 3333.33, WBTC: 0.033, WEN: 33333333.0, '$GMUSIC': 4266.67, FILM: 6400.0, WXRP: 5333.33 },
  WEN: { GALA: 0.004, USDC: 0.0001, USDT: 0.0001, WBTC: 0.000000001, WETH: 0.00000003, '$GMUSIC': 0.0032, FILM: 0.0048, WXRP: 0.00016 },
  '$GMUSIC': { GALA: 1.25, USDC: 0.03125, USDT: 0.03125, WBTC: 0.0000000078, WETH: 0.0000234, WEN: 312.5, FILM: 1.5, WXRP: 0.05 },
  FILM: { GALA: 0.833, USDC: 0.02083, USDT: 0.02083, WBTC: 0.0000000052, WETH: 0.000156, WEN: 208.3, '$GMUSIC': 0.667, WXRP: 0.033 },
  WXRP: { GALA: 80.0, USDC: 2.0, USDT: 2.0, WBTC: 0.00000625, WETH: 0.0001875, WEN: 6250.0, '$GMUSIC': 20.0, FILM: 30.0 }
};

describe('All Token Combination Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const selectToken = async (tokenIndex: number, tokenSymbol: string) => {
    const tokenSelects = screen.getAllByRole('combobox');
    fireEvent.click(tokenSelects[tokenIndex]);
    
    await waitFor(() => {
      const option = screen.getByText(tokenSymbol);
      fireEvent.click(option);
    });
  };

  describe('USDC Token Pair Tests', () => {
    it('should calculate USDC to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Default is USDC to GALA
      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '25' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('1000.000000'); // 25 * 40.0
      });
    });

    it('should calculate GALA to WETH conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change to WETH
      await selectToken(1, 'WETH');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '133333.33' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('1.000000'); // 133333.33 * 0.0000075 ≈ 1
      });
    });

    it('should calculate GALA to USDT conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change to USDT
      await selectToken(1, 'USDT');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '1000' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('25.000000'); // 1000 * 0.025
      });
    });
  });

  describe('USDC Token Pair Tests', () => {
    it('should calculate USDC to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDC, to to GALA
      await selectToken(0, 'USDC');
      await selectToken(1, 'GALA');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('4000.000000'); // 100 * 40
      });
    });

    it('should calculate USDC to WETH conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDC, to to WETH
      await selectToken(0, 'USDC');
      await selectToken(1, 'WETH');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '3333.33' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('1.000000'); // 3333.33 * 0.0003 ≈ 1
      });
    });

    it('should calculate USDC to USDT conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDC, to to USDT
      await selectToken(0, 'USDC');
      await selectToken(1, 'USDT');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('100.000000'); // 100 * 1.0
      });
    });
  });

  describe('WETH Token Pair Tests', () => {
    it('should calculate WETH to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to WETH, to to GALA
      await selectToken(0, 'WETH');
      await selectToken(1, 'GALA');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '1' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('133333.330000'); // 1 * 133333.33
      });
    });

    it('should calculate WETH to USDC conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to WETH, to to USDC
      await selectToken(0, 'WETH');
      await selectToken(1, 'USDC');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '1' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('3333.330000'); // 1 * 3333.33
      });
    });

    it('should calculate WETH to USDT conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to WETH, to to USDT
      await selectToken(0, 'WETH');
      await selectToken(1, 'USDT');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '1' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('3333.330000'); // 1 * 3333.33
      });
    });
  });

  describe('USDT Token Pair Tests', () => {
    it('should calculate USDT to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDT, to to GALA
      await selectToken(0, 'USDT');
      await selectToken(1, 'GALA');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('4000.000000'); // 100 * 40
      });
    });

    it('should calculate USDT to USDC conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDT, to to USDC  
      await selectToken(0, 'USDT');
      await selectToken(1, 'USDC');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('100.000000'); // 100 * 1.0
      });
    });

    it('should calculate USDT to WETH conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDT, to to WETH
      await selectToken(0, 'USDT');
      await selectToken(1, 'WETH');

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '3333.33' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying');
        expect(toInput).toHaveValue('1.000000'); // 3333.33 * 0.0003 ≈ 1
      });
    });
  });

  describe('Reverse Calculation Tests (To Amount Input)', () => {
    it('should calculate all token pairs correctly when entering to amount', async () => {
      const testCases = [
        { from: 'GALA', to: 'USDC', toAmount: '25', expectedFrom: '1000.000000' },
        { from: 'GALA', to: 'WETH', toAmount: '1', expectedFrom: '133333.333333' },
        { from: 'GALA', to: 'USDT', toAmount: '25', expectedFrom: '1000.000000' },
        { from: 'USDC', to: 'GALA', toAmount: '4000', expectedFrom: '100.000000' },
        { from: 'USDC', to: 'WETH', toAmount: '1', expectedFrom: '3333.333333' },
        { from: 'USDC', to: 'USDT', toAmount: '100', expectedFrom: '100.000000' },
        { from: 'WETH', to: 'GALA', toAmount: '133333.33', expectedFrom: '1.000000' },
        { from: 'WETH', to: 'USDC', toAmount: '3333.33', expectedFrom: '1.000000' },
        { from: 'WETH', to: 'USDT', toAmount: '3333.33', expectedFrom: '1.000000' },
        { from: 'USDT', to: 'GALA', toAmount: '4000', expectedFrom: '100.000000' },
        { from: 'USDT', to: 'USDC', toAmount: '100', expectedFrom: '100.000000' },
        { from: 'USDT', to: 'WETH', toAmount: '1', expectedFrom: '3333.333333' },
      ];

      for (const testCase of testCases) {
        render(<TestWrapper><SwapInterface /></TestWrapper>);
        
        // Set up token pair
        if (testCase.from !== 'GALA') {
          await selectToken(0, testCase.from);
        }
        if (testCase.to !== 'USDC') {
          await selectToken(1, testCase.to);
        }

        // Enter to amount
        const toInput = screen.getByLabelText('Buying');
        fireEvent.change(toInput, { target: { value: testCase.toAmount } });

        await waitFor(() => {
          const fromInput = screen.getByLabelText('Selling');
          expect(fromInput).toHaveValue(testCase.expectedFrom);
        });

        // Clean up for next test - no unmount needed, each render creates a new container
      }
    });
  });

  describe('Directional Swap Tests for All Token Pairs', () => {
    it('should maintain accuracy when swapping direction for all token combinations', async () => {
      const testCases = [
        { initialFrom: 'GALA', initialTo: 'USDC', amount: '1000' },
        { initialFrom: 'GALA', initialTo: 'WETH', amount: '133333.33' },
        { initialFrom: 'GALA', initialTo: 'USDT', amount: '1000' },
        { initialFrom: 'USDC', initialTo: 'GALA', amount: '100' },
        { initialFrom: 'USDC', initialTo: 'WETH', amount: '3333.33' },
        { initialFrom: 'USDC', initialTo: 'USDT', amount: '100' },
        { initialFrom: 'WETH', initialTo: 'GALA', amount: '1' },
        { initialFrom: 'WETH', initialTo: 'USDC', amount: '1' },
        { initialFrom: 'WETH', initialTo: 'USDT', amount: '1' },
        { initialFrom: 'USDT', initialTo: 'GALA', amount: '100' },
        { initialFrom: 'USDT', initialTo: 'USDC', amount: '100' },
        { initialFrom: 'USDT', initialTo: 'WETH', amount: '3333.33' },
      ];

      for (const testCase of testCases) {
        render(<TestWrapper><SwapInterface /></TestWrapper>);
        
        // Set up initial token pair
        if (testCase.initialFrom !== 'GALA') {
          await selectToken(0, testCase.initialFrom);
        }
        if (testCase.initialTo !== 'USDC') {
          await selectToken(1, testCase.initialTo);
        }

        // Enter initial amount
        const fromInput = screen.getByLabelText('Selling');
        fireEvent.change(fromInput, { target: { value: testCase.amount } });

        // Get calculated to amount
        let calculatedToAmount: string;
        await waitFor(() => {
          const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
          calculatedToAmount = toInput.value;
          expect(parseFloat(calculatedToAmount)).toBeGreaterThan(0);
        });

        // Swap direction
        const swapArrow = screen.getByTestId('swap-tokens-button');
        fireEvent.click(swapArrow);

        // Verify amounts and tokens swapped correctly
        await waitFor(() => {
          const newFromInput = screen.getByLabelText('Selling') as HTMLInputElement;
          const newToInput = screen.getByLabelText('Buying') as HTMLInputElement;
          
          expect(newFromInput.value).toBe(calculatedToAmount!);
          expect(newToInput.value).toBe(testCase.amount + '.000000');
          
          // Verify tokens swapped
          const selects = screen.getAllByRole('combobox');
          expect(selects[0]).toHaveTextContent(testCase.initialTo);
          expect(selects[1]).toHaveTextContent(testCase.initialFrom);
        });

        // Clean up for next test - no unmount needed, each render creates a new container
      }
    });
  });

  describe('Exchange Rate Display Tests', () => {
    it('should display correct exchange rates for all token pairs', async () => {
      const testCases = [
        { from: 'GALA', to: 'USDC', amount: '1000', expectedRate: '0.025000' },
        { from: 'GALA', to: 'WETH', amount: '133333.33', expectedRate: '0.0000075' },
        { from: 'GALA', to: 'USDT', amount: '1000', expectedRate: '0.025000' },
        { from: 'USDC', to: 'GALA', amount: '100', expectedRate: '40.000000' },
        { from: 'USDC', to: 'WETH', amount: '3333.33', expectedRate: '0.000300' },
        { from: 'USDC', to: 'USDT', amount: '100', expectedRate: '1.000000' },
        { from: 'WETH', to: 'GALA', amount: '1', expectedRate: '133333.330000' },
        { from: 'WETH', to: 'USDC', amount: '1', expectedRate: '3333.330000' },
        { from: 'WETH', to: 'USDT', amount: '1', expectedRate: '3333.330000' },
        { from: 'USDT', to: 'GALA', amount: '100', expectedRate: '40.000000' },
        { from: 'USDT', to: 'USDC', amount: '100', expectedRate: '1.000000' },
        { from: 'USDT', to: 'WETH', amount: '3333.33', expectedRate: '0.000300' },
      ];

      for (const testCase of testCases) {
        render(<TestWrapper><SwapInterface /></TestWrapper>);
        
        // Set up token pair
        if (testCase.from !== 'GALA') {
          await selectToken(0, testCase.from);
        }
        if (testCase.to !== 'USDC') {
          await selectToken(1, testCase.to);
        }

        // Enter amount
        const fromInput = screen.getByLabelText('Selling');
        fireEvent.change(fromInput, { target: { value: testCase.amount } });

        // Check exchange rate display
        await waitFor(() => {
          const rateText = `1 ${testCase.from} = ${testCase.expectedRate} ${testCase.to}`;
          expect(screen.getByText(rateText)).toBeInTheDocument();
        });

        // Clean up for next test - no unmount needed, each render creates a new container
      }
    });
  });
});