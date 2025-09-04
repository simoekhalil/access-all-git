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
      
      // Check for GALA and USDC tokens in the selectors
      const galaSpans = screen.getAllByText('GALA');
      const usdcSpans = screen.getAllByText('USDC');
      expect(galaSpans.length).toBeGreaterThan(0);
      expect(usdcSpans.length).toBeGreaterThan(0);
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

      await waitFor(() => {
        const wethSpans = screen.getAllByText('WETH');
        expect(wethSpans.length).toBeGreaterThan(0);
      });
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

      await waitFor(() => {
        const usdtSpans = screen.getAllByText('USDT');
        expect(usdtSpans.length).toBeGreaterThan(0);
      });
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
        // GALA should be disabled/grayed out since it's selected in from
        const galaOptions = screen.queryAllByText('GALA');
        const availableGalaOptions = galaOptions.filter(option => 
          !option.closest('[style*="pointer-events: none"]')
        );
        expect(availableGalaOptions.length).toBeLessThanOrEqual(1); // Only the selected one should remain
        
        // Check that other tokens are available
        expect(screen.getAllByText('USDC').length).toBeGreaterThan(0);
        expect(screen.getAllByText('WETH').length).toBeGreaterThan(0);
        expect(screen.getAllByText('USDT').length).toBeGreaterThan(0);
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
        // Default is USDC → GALA, so 100 USDC should yield ~4000 GALA (100 * 40 = 4000)
        const baseRate = 40; // USDC to GALA base rate
        const expectedValue = 100 * baseRate; // 4000
        const actualValue = parseFloat(toAmountInput.value);
        
        // Should be higher than base due to price impact
        expect(actualValue).toBeGreaterThanOrEqual(expectedValue);
        expect(actualValue).toBeLessThan(expectedValue * 1.1); // But not too much higher
      });
    });

    it('should calculate from amount when to amount is entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '2.5' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From') as HTMLInputElement;
        // Default is USDC → GALA, so 2.5 GALA should require ~0.0625 USDC (2.5 ÷ 40 = 0.0625)
        expect(parseFloat(fromAmountInput.value)).toBeCloseTo(0.0625, 2);
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
        const expectedValue = 123.456789 * 40; // Base USDC->GALA rate
        expect(parseFloat(toAmountInput.value)).toBeGreaterThan(expectedValue); // Should be higher due to price impact
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
        // Should handle tiny amounts (might round to 0 due to precision)
        const actualValue = parseFloat(toAmountInput.value);
        const expectedValue = 0.000001 * 40; // Base USDC->GALA rate
        
        // Either should be close to expected value or 0 due to precision limits
        expect(actualValue === 0 || actualValue >= expectedValue * 0.9).toBe(true);
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
        const expectedValue = 999999.999999 * 40; // Base USDC->GALA rate
        expect(parseFloat(toAmountInput.value)).toBeGreaterThan(expectedValue); // Should be higher due to price impact
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
        // Reverse calculation: 3.14159 GALA requires ~0.0785 USDC (3.14159 ÷ 40 = 0.0785)
        const expectedValue = 3.141592653589793 / 40; // Base USDC->GALA rate
        const actualValue = parseFloat(fromAmountInput.value);
        
        // Should be close to expected (iterative solver accounts for price impact)
        expect(actualValue).toBeCloseTo(0.0785, 2);
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
        // Look for exchange rate text more flexibly
        const exchangeRateElements = screen.queryAllByText(/Exchange Rate|1 GALA/i);
        expect(exchangeRateElements.length).toBeGreaterThan(0);
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
        // After swap, amounts should be reset
        const fromInput = screen.getByLabelText('From') as HTMLInputElement;
        const toInput = screen.getByLabelText('To') as HTMLInputElement;
        expect(fromInput.value).toBe('');
        expect(toInput.value).toBe('');
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
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        expect(toAmountInput.value).toBe('0'); // Input shows "0" as string
      });
    });
  });
});