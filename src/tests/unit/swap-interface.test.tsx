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

describe('SwapInterface Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear(); // Clear React Query cache between tests
  });

  describe('Initial Render', () => {
    it('should render swap interface with default tokens', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Swap Tokens')).toBeInTheDocument();
      expect(screen.getByText('Trade your tokens instantly')).toBeInTheDocument();
      expect(screen.getByDisplayValue('GALA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USDC')).toBeInTheDocument();
      expect(screen.getByText('Swap')).toBeInTheDocument();
    });

    it('should show token balances', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Balance: 1,000.00')).toBeInTheDocument(); // GALA balance
      expect(screen.getByText('Balance: 1,500.00')).toBeInTheDocument(); // USDC balance
    });
  });

  describe('Token Selection', () => {
    it('should allow changing from token', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Click on from token selector
      const fromTokenSelect = screen.getAllByRole('combobox')[0];
      fireEvent.click(fromTokenSelect);

      await waitFor(() => {
        const wethOption = screen.getByText('WETH');
        fireEvent.click(wethOption);
      });

      expect(screen.getByDisplayValue('WETH')).toBeInTheDocument();
    });

    it('should allow changing to token', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Click on to token selector
      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);

      await waitFor(() => {
        const usdtOption = screen.getByText('USDT');
        fireEvent.click(usdtOption);
      });

      expect(screen.getByDisplayValue('USDT')).toBeInTheDocument();
    });

    it('should exclude selected from token in to token options', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);

      await waitFor(() => {
        // GALA should be disabled/grayed out since it's selected in from, but might still be in DOM
        const galaOptions = screen.queryAllByText('GALA');
        // Check if GALA is either not present or disabled (has pointer-events: none style)
        const availableGalaOptions = galaOptions.filter(option => 
          !option.closest('[style*="pointer-events: none"]')
        );
        expect(availableGalaOptions).toHaveLength(0);
        expect(screen.getByText('USDC')).toBeInTheDocument();
        expect(screen.getByText('WETH')).toBeInTheDocument();
        expect(screen.getByText('USDT')).toBeInTheDocument();
      });
    });
  });

  describe('Amount Calculation', () => {
    it('should calculate to amount when from amount is entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        // Use toBeCloseTo for floating point precision testing
        expect(parseFloat(toAmountInput.value)).toBeCloseTo(2.525, 3); // Allow for up to 3 decimal places
      });
    });

    it('should calculate from amount when to amount is entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '2.525' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From') as HTMLInputElement;
        expect(parseFloat(fromAmountInput.value)).toBeCloseTo(100, 3); // Allow for decimal precision
      });
    });

    it('should handle high precision decimal calculations', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      // Test with high precision input
      fireEvent.change(fromAmountInput, { target: { value: '123.456789' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        const expectedValue = 123.456789 * 0.025251; // Based on GALA->USDC rate with price impact
        expect(parseFloat(toAmountInput.value)).toBeCloseTo(expectedValue, 6);
      });
    });

    it('should handle very small decimal amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      // Test with very small amount
      fireEvent.change(fromAmountInput, { target: { value: '0.000001' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        const expectedValue = 0.000001 * 0.025251;
        expect(parseFloat(toAmountInput.value)).toBeCloseTo(expectedValue, 10);
      });
    });

    it('should handle large decimal amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      // Test with large amount
      fireEvent.change(fromAmountInput, { target: { value: '999999.999999' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        const expectedValue = 999999.999999 * 0.025251;
        expect(parseFloat(toAmountInput.value)).toBeCloseTo(expectedValue, 6);
      });
    });

    it('should maintain precision in reverse calculations', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toAmountInput = screen.getByLabelText('To');
      // Enter precise decimal in to field
      fireEvent.change(toAmountInput, { target: { value: '3.141592653589793' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From') as HTMLInputElement;
        const expectedValue = 3.141592653589793 / 0.025251;
        expect(parseFloat(fromAmountInput.value)).toBeCloseTo(expectedValue, 6);
      });
    });

    it('should show exchange rate when amounts are present', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText(/Exchange Rate:/)).toBeInTheDocument();
        expect(screen.getByText(/1 GALA =/)).toBeInTheDocument(); // More flexible regex
      });
    });

    it('should show slippage tolerance', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('Slippage Tolerance:')).toBeInTheDocument();
        expect(screen.getByText('0.5%')).toBeInTheDocument();
      });
    });
  });

  describe('Swap Functionality', () => {
    it('should enable swap button when amounts are present', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const swapButton = screen.getByText('Swap');
      expect(swapButton).toBeDisabled();

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(swapButton).not.toBeDisabled();
      });
    });

    it('should execute swap successfully', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        const swapButton = screen.getByText('Swap');
        expect(swapButton).not.toBeDisabled();
        fireEvent.click(swapButton);
      });

      expect(screen.getByText('Swapping...')).toBeInTheDocument();

      await waitFor(() => {
        // After swap, amounts should be reset (number inputs return null when empty)
        expect(screen.getByLabelText('From')).toHaveValue(null);
        expect(screen.getByLabelText('To')).toHaveValue(null);
      }, { timeout: 3000 });
    });

    it('should show error for invalid amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const swapButton = screen.getByText('Swap');
      fireEvent.click(swapButton);

      // Should remain disabled and not execute
      expect(swapButton).toBeDisabled();
    });
  });

  describe('Token Swap Feature', () => {
    it('should swap from and to tokens when swap arrow is clicked', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Check initial token selection (no amounts to avoid triggering calculations)
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toHaveTextContent('GALA'); // From token
        expect(selects[1]).toHaveTextContent('USDC'); // To token
      });

      // Click swap arrow
      const swapArrow = screen.getByLabelText('Switch token order');
      fireEvent.click(swapArrow);

      await waitFor(() => {
        // Tokens should be swapped
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toHaveTextContent('USDC'); // From token
        expect(selects[1]).toHaveTextContent('GALA'); // To token
      });
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid number inputs', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: 'invalid' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(null); // Input remains null for invalid input
      });
    });

    it('should handle zero amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '0' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(0); // Input shows 0 as number
      });
    });
  });
});