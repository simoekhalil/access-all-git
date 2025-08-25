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
const TOKENS = ['GALA', 'USDC', 'ETH', 'TOWN'];
const EXCHANGE_RATES = {
  GALA: { USDC: 0.025, ETH: 0.000015, TOWN: 0.1 },
  USDC: { GALA: 40, ETH: 0.0006, TOWN: 4 },
  ETH: { GALA: 66666.67, USDC: 1666.67, TOWN: 6666.67 },
  TOWN: { GALA: 10, USDC: 0.25, ETH: 0.00015 },
};

describe('All Token Combination Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const selectToken = async (tokenIndex: number, tokenSymbol: string) => {
    const tokenSelects = screen.getAllByRole('combobox');
    fireEvent.click(tokenSelects[tokenIndex]);

    await waitFor(() => {
      const options = screen.getAllByText(tokenSymbol);
      // Find the option that's in the dropdown (has an id starting with radix-)
      const dropdownOption = options.find(option => 
        option.id && option.id.startsWith('radix-')
      );
      if (dropdownOption) {
        fireEvent.click(dropdownOption);
      } else {
        // Fallback to the last option (usually the dropdown option)
        fireEvent.click(options[options.length - 1]);
      }
    });
  };

  describe('GALA Token Pair Tests', () => {
    it('should calculate GALA to USDC conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Default is GALA to USDC
      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '1000' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('25.000000'); // 1000 * 0.025
      });
    });

    it('should calculate GALA to ETH conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change to ETH
      await selectToken(1, 'ETH');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '66666.67' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('1.000000'); // 66666.67 * 0.000015 ≈ 1
      });
    });

    it('should calculate GALA to TOWN conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change to TOWN
      await selectToken(1, 'TOWN');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '1000' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('100.000000'); // 1000 * 0.1
      });
    });
  });

  describe('USDC Token Pair Tests', () => {
    it('should calculate USDC to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDC, to to GALA
      await selectToken(0, 'USDC');
      await selectToken(1, 'GALA');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('4000.000000'); // 100 * 40
      });
    });

    it('should calculate USDC to ETH conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDC, to to ETH
      await selectToken(0, 'USDC');
      await selectToken(1, 'ETH');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '1666.67' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('1.000000'); // 1666.67 * 0.0006 ≈ 1
      });
    });

    it('should calculate USDC to TOWN conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to USDC, to to TOWN
      await selectToken(0, 'USDC');
      await selectToken(1, 'TOWN');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('400.000000'); // 100 * 4
      });
    });
  });

  describe('ETH Token Pair Tests', () => {
    it('should calculate ETH to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to ETH, to to GALA
      await selectToken(0, 'ETH');
      await selectToken(1, 'GALA');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '1' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('66666.670000'); // 1 * 66666.67
      });
    });

    it('should calculate ETH to USDC conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to ETH, to to USDC
      await selectToken(0, 'ETH');
      await selectToken(1, 'USDC');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '1' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('1666.670000'); // 1 * 1666.67
      });
    });

    it('should calculate ETH to TOWN conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to ETH, to to TOWN
      await selectToken(0, 'ETH');
      await selectToken(1, 'TOWN');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '1' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('6666.670000'); // 1 * 6666.67
      });
    });
  });

  describe('TOWN Token Pair Tests', () => {
    it('should calculate TOWN to GALA conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to TOWN, to to GALA
      await selectToken(0, 'TOWN');
      await selectToken(1, 'GALA');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('1000.000000'); // 100 * 10
      });
    });

    it('should calculate TOWN to USDC conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to TOWN, to to USDC
      await selectToken(0, 'TOWN');
      await selectToken(1, 'USDC');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('25.000000'); // 100 * 0.25
      });
    });

    it('should calculate TOWN to ETH conversion correctly', async () => {
      render(<TestWrapper><SwapInterface /></TestWrapper>);
      
      // Change from to TOWN, to to ETH
      await selectToken(0, 'TOWN');
      await selectToken(1, 'ETH');

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '6666.67' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To');
        expect(toInput).toHaveValue('1.000000'); // 6666.67 * 0.00015 ≈ 1
      });
    });
  });

  describe('Reverse Calculation Tests (To Amount Input)', () => {
    it('should calculate all token pairs correctly when entering to amount', async () => {
      const testCases = [
        { from: 'GALA', to: 'USDC', toAmount: '25', expectedFrom: '1000.000000' },
        { from: 'GALA', to: 'ETH', toAmount: '1', expectedFrom: '66666.666667' },
        { from: 'GALA', to: 'TOWN', toAmount: '100', expectedFrom: '1000.000000' },
        { from: 'USDC', to: 'GALA', toAmount: '4000', expectedFrom: '100.000000' },
        { from: 'USDC', to: 'ETH', toAmount: '1', expectedFrom: '1666.666667' },
        { from: 'USDC', to: 'TOWN', toAmount: '400', expectedFrom: '100.000000' },
        { from: 'ETH', to: 'GALA', toAmount: '66666.67', expectedFrom: '1.000000' },
        { from: 'ETH', to: 'USDC', toAmount: '1666.67', expectedFrom: '1.000000' },
        { from: 'ETH', to: 'TOWN', toAmount: '6666.67', expectedFrom: '1.000000' },
        { from: 'TOWN', to: 'GALA', toAmount: '1000', expectedFrom: '100.000000' },
        { from: 'TOWN', to: 'USDC', toAmount: '25', expectedFrom: '100.000000' },
        { from: 'TOWN', to: 'ETH', toAmount: '1', expectedFrom: '6666.666667' },
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
        const toInput = screen.getByLabelText('To');
        fireEvent.change(toInput, { target: { value: testCase.toAmount } });

        await waitFor(() => {
          const fromInput = screen.getByLabelText('From');
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
        { initialFrom: 'GALA', initialTo: 'ETH', amount: '66666.67' },
        { initialFrom: 'GALA', initialTo: 'TOWN', amount: '1000' },
        { initialFrom: 'USDC', initialTo: 'GALA', amount: '100' },
        { initialFrom: 'USDC', initialTo: 'ETH', amount: '1666.67' },
        { initialFrom: 'USDC', initialTo: 'TOWN', amount: '100' },
        { initialFrom: 'ETH', initialTo: 'GALA', amount: '1' },
        { initialFrom: 'ETH', initialTo: 'USDC', amount: '1' },
        { initialFrom: 'ETH', initialTo: 'TOWN', amount: '1' },
        { initialFrom: 'TOWN', initialTo: 'GALA', amount: '100' },
        { initialFrom: 'TOWN', initialTo: 'USDC', amount: '100' },
        { initialFrom: 'TOWN', initialTo: 'ETH', amount: '6666.67' },
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
        const fromInput = screen.getByLabelText('From');
        fireEvent.change(fromInput, { target: { value: testCase.amount } });

        // Get calculated to amount
        let calculatedToAmount: string;
        await waitFor(() => {
          const toInput = screen.getByLabelText('To') as HTMLInputElement;
          calculatedToAmount = toInput.value;
          expect(parseFloat(calculatedToAmount)).toBeGreaterThan(0);
        });

        // Swap direction
        const swapArrow = screen.getByRole('button', { name: /ArrowUpDown/i });
        fireEvent.click(swapArrow);

        // Verify amounts and tokens swapped correctly
        await waitFor(() => {
          const newFromInput = screen.getByLabelText('From') as HTMLInputElement;
          const newToInput = screen.getByLabelText('To') as HTMLInputElement;
          
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
        { from: 'GALA', to: 'ETH', amount: '66666.67', expectedRate: '0.000015' },
        { from: 'GALA', to: 'TOWN', amount: '1000', expectedRate: '0.100000' },
        { from: 'USDC', to: 'GALA', amount: '100', expectedRate: '40.000000' },
        { from: 'USDC', to: 'ETH', amount: '1666.67', expectedRate: '0.000600' },
        { from: 'USDC', to: 'TOWN', amount: '100', expectedRate: '4.000000' },
        { from: 'ETH', to: 'GALA', amount: '1', expectedRate: '66666.670000' },
        { from: 'ETH', to: 'USDC', amount: '1', expectedRate: '1666.670000' },
        { from: 'ETH', to: 'TOWN', amount: '1', expectedRate: '6666.670000' },
        { from: 'TOWN', to: 'GALA', amount: '100', expectedRate: '10.000000' },
        { from: 'TOWN', to: 'USDC', amount: '100', expectedRate: '0.250000' },
        { from: 'TOWN', to: 'ETH', amount: '6666.67', expectedRate: '0.000150' },
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
        const fromInput = screen.getByLabelText('From');
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