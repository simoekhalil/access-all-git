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

describe('SwapInterface Component - Real swap.gala.com AMM', () => {
  describe('Initial Render', () => {
    it('should render with correct title', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Swap')).toBeInTheDocument();
      
    });

    it('should render with default tokens (USDC and GALA)', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Default from token should be USDC
      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      expect(fromSelect).toHaveTextContent('USDC');

      // Default to token should be GALA  
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      expect(toSelect).toHaveTextContent('GALA');
    });

    it('should display token balances', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('1,500.00 GUSDC')).toBeInTheDocument(); // USDC balance  
      expect(screen.getByText('1,000.00 GALA')).toBeInTheDocument(); // GALA balance
    });
  });

  describe('Token Selection', () => {
    it('should allow changing from token', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      fireEvent.click(fromSelect);
      
      await waitFor(() => {
        const wethOption = screen.getByText('WETH');
        fireEvent.click(wethOption);
      });

      expect(fromSelect).toHaveTextContent('WETH');
    });

    it('should exclude selected from token from to options', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // USDC is the default from token
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);

      await waitFor(() => {
        // USDC should not be available in to dropdown options (check within dropdown content)
        const dropdownOptions = screen.getByRole('listbox');
        expect(dropdownOptions).toBeInTheDocument();
        
        // Check that USDC is not in the dropdown options
        const usdcOption = screen.queryByRole('option', { name: 'USDC' });
        expect(usdcOption).not.toBeInTheDocument();
        
        // But other tokens should be available as options
        expect(screen.getByRole('option', { name: 'WETH' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'GALA' })).toBeInTheDocument();
      });
    });

    it('should support all real swap.gala.com tokens', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      fireEvent.click(fromSelect);

      await waitFor(() => {
        // All real tokens from swap.gala.com should be available as options
        expect(screen.getByRole('option', { name: 'GALA' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'USDC' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'USDT' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'WBTC' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'WETH' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'WEN' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '$GMUSIC' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'FILM' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'WXRP' })).toBeInTheDocument();
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

    const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
      const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // 100 USDC -> GALA at rate 40 = ~4000 GALA (minus price impact)
        const actualValue = parseFloat(toInput.value);
        expect(actualValue).toBeGreaterThan(3900); // Should be close to 4000 minus small price impact
        expect(actualValue).toBeLessThan(4000);
      });
    });

    it('should calculate from amount when to amount is entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toInput = screen.getByLabelText('Buying');
      fireEvent.change(toInput, { target: { value: '4000' } });

      await waitFor(() => {
        const fromInput = screen.getByLabelText('Selling') as HTMLInputElement;
        // 4000 GALA requires ~100 USDC (plus adjustment for price impact)
        const actualValue = parseFloat(fromInput.value);
        expect(actualValue).toBeGreaterThan(99);
        expect(actualValue).toBeLessThan(105);
      });
    });

    it('should handle different token pairs correctly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

        // Change to WETH as to token
        const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const wethOption = screen.getByText('WETH');
        fireEvent.click(wethOption);
      });

    const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '1000' } });

      await waitFor(() => {
      const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // 1000 USDC -> WETH at rate 0.0003 = 0.3 WETH (minus price impact)
        const actualValue = parseFloat(toInput.value);
        expect(actualValue).toBeGreaterThan(0.25);
        expect(actualValue).toBeLessThan(0.3);
      });
    });

    it('should display exchange rate correctly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        // Should show exchange rate between USDC and GALA
        const rateText = screen.getByText(/1 USDC = .* GALA/);
        expect(rateText).toBeInTheDocument();
      });
    });

    it('should display real swap fees from pools', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        // GALA/USDC pair has 1% fee according to real data
        expect(screen.getByText('1%')).toBeInTheDocument();
      });

      // Test a different pair with different fee (USDC/WBTC)
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const wbtcOption = screen.getByText('WBTC');
        fireEvent.click(wbtcOption);
      });

      await waitFor(() => {
        // USDC/WBTC pair has 0.3% fee according to real data
        expect(screen.getByText('0.3%')).toBeInTheDocument();
      });
    });

    it('should calculate price impact based on pool TVL', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Large trade should have higher price impact
      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '10000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.getByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
        
        // Should show some price impact for large trade
        const impactText = priceImpactBadge.textContent;
        expect(impactText).toMatch(/[0-9]+\.[0-9]+%/);
      });
    });

    it('should display slippage tolerance', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('0.5%')).toBeInTheDocument(); // Default slippage
      });
    });
  });

  describe('Swap Execution', () => {
    it('should enable swap button when amounts are entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const swapButton = screen.getByRole('button', { name: 'Connect Wallet' });
        expect(swapButton).not.toBeDisabled();
      });
    });

    it('should execute swap and show success message', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const swapButton = screen.getByRole('button', { name: 'Connect Wallet' });
        fireEvent.click(swapButton);
      });

      // Button should show processing state
      expect(screen.getByText('Swapping...')).toBeInTheDocument();

      // After success, form should reset
      await waitFor(() => {
        const fromInput = screen.getByLabelText('Selling') as HTMLInputElement;
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        expect(fromInput.value).toBe('');
        expect(toInput.value).toBe('');
      }, { timeout: 3000 });
    });

    it('should show error for invalid amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const swapButton = screen.getByRole('button', { name: 'Connect Wallet' });
      fireEvent.click(swapButton);

      // Button should be disabled for empty amounts
      expect(swapButton).toBeDisabled();
    });
  });

  describe('Token Swap Feature', () => {
    it('should swap from and to tokens', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Enter amounts first
      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        expect(parseFloat(toInput.value)).toBeGreaterThan(0);
      });

      // Click swap button
      const swapButton = screen.getByTestId('swap-tokens-button');
      fireEvent.click(swapButton);

      await waitFor(() => {
        // Tokens should be swapped
    const fromSelect = screen.getByRole('combobox', { name: /selling/i });
    const toSelect = screen.getByRole('combobox', { name: /buying/i });
        
        expect(fromSelect).toHaveTextContent('GALA');
        expect(toSelect).toHaveTextContent('USDC');

        // Amounts should be swapped too
        const newFromInput = screen.getByLabelText('Selling') as HTMLInputElement;
        const newToInput = screen.getByLabelText('Buying') as HTMLInputElement;
        
        expect(parseFloat(newFromInput.value)).toBeGreaterThan(0);
        expect(parseFloat(newToInput.value)).toBeCloseTo(100, 0);
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

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: 'invalid' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        expect(toInput.value).toBe('');
      });
    });

    it('should handle zero amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '0' } });

      await waitFor(() => {
        const swapButton = screen.getByRole('button', { name: 'Connect Wallet' });
        expect(swapButton).toBeDisabled();
      });
    });
  });
});