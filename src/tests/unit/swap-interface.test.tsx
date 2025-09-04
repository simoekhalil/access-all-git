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

describe('SwapInterface Component - Real GalaSwap P2P Orderbook', () => {
  describe('Initial Render', () => {
    it('should render with correct title and description', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Create Offer')).toBeInTheDocument();
      expect(screen.getByText('Create a P2P token swap offer')).toBeInTheDocument();
    });

    it('should render with default tokens (GALA and GUSDC)', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Default offering token should be GALA
      const offeringSelect = screen.getByRole('combobox', { name: /offering/i });
      expect(offeringSelect).toHaveTextContent('GALA');

      // Default wanted token should be GUSDC  
      const wantedSelect = screen.getByRole('combobox', { name: /wanted/i });
      expect(wantedSelect).toHaveTextContent('GUSDC');
    });

    it('should display token balances', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Balance: 1,000.00')).toBeInTheDocument(); // GALA balance
      expect(screen.getByText('Balance: 1,500.00')).toBeInTheDocument(); // GUSDC balance
    });
  });

  describe('Token Selection', () => {
    it('should allow changing offering token', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringSelect = screen.getByRole('combobox', { name: /offering/i });
      fireEvent.click(offeringSelect);
      
      await waitFor(() => {
        const etimeOption = screen.getByText('ETIME');
        fireEvent.click(etimeOption);
      });

      expect(offeringSelect).toHaveTextContent('ETIME');
    });

    it('should exclude selected offering token from wanted options', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // GALA is the default offering token
      const wantedSelect = screen.getByRole('combobox', { name: /wanted/i });
      fireEvent.click(wantedSelect);

      await waitFor(() => {
        // GALA should not be available in wanted options
        expect(screen.queryByText('GALA')).not.toBeInTheDocument();
        // But other tokens should be available
        expect(screen.getByText('ETIME')).toBeInTheDocument();
        expect(screen.getByText('GUSDC')).toBeInTheDocument();
      });
    });
  });

  describe('Amount Calculation', () => {
    it('should calculate wanted amount when offering amount is entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        const wantedInput = screen.getByLabelText('Wanted') as HTMLInputElement;
        // 100 GALA -> GUSDC at rate 0.025 = 2.5 GUSDC
        expect(parseFloat(wantedInput.value)).toBeCloseTo(2.5, 2);
      });
    });

    it('should calculate offering amount when wanted amount is entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const wantedInput = screen.getByLabelText('Wanted');
      fireEvent.change(wantedInput, { target: { value: '2.5' } });

      await waitFor(() => {
        const offeringInput = screen.getByLabelText('Offering') as HTMLInputElement;
        // 2.5 GUSDC -> GALA at rate 1/0.025 = 100 GALA  
        expect(parseFloat(offeringInput.value)).toBeCloseTo(100, 2);
      });
    });

    it('should handle GALA-based pairs correctly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change to ETIME as wanted token
      const wantedSelect = screen.getByRole('combobox', { name: /wanted/i });
      fireEvent.click(wantedSelect);
      
      await waitFor(() => {
        const etimeOption = screen.getByText('ETIME');
        fireEvent.click(etimeOption);
      });

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        const wantedInput = screen.getByLabelText('Wanted') as HTMLInputElement;
        // 100 GALA -> ETIME at rate 0.05 = 5 ETIME
        expect(parseFloat(wantedInput.value)).toBeCloseTo(5, 2);
      });
    });

    it('should display exchange rate correctly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        // Should show exchange rate: 1 GALA = 0.025 GUSDC
        expect(screen.getByText(/1 GALA = 0.025000 GUSDC/)).toBeInTheDocument();
      });
    });

    it('should display fixed gas fee', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('1 GALA')).toBeInTheDocument(); // Gas fee
      });
    });

    it('should display slippage tolerance', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('0.5%')).toBeInTheDocument(); // Default slippage
      });
    });
  });

  describe('Offer Creation', () => {
    it('should enable create offer button when amounts are entered', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: 'Create Offer' });
        expect(createButton).not.toBeDisabled();
      });
    });

    it('should create offer and show success message', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: 'Create Offer' });
        fireEvent.click(createButton);
      });

      // Button should show processing state
      expect(screen.getByText('Creating Offer...')).toBeInTheDocument();

      // After success, form should reset
      await waitFor(() => {
        const offeringInput = screen.getByLabelText('Offering') as HTMLInputElement;
        const wantedInput = screen.getByLabelText('Wanted') as HTMLInputElement;
        expect(offeringInput.value).toBe('');
        expect(wantedInput.value).toBe('');
      }, { timeout: 3000 });
    });

    it('should show error for invalid amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: 'Create Offer' });
      fireEvent.click(createButton);

      // Button should be disabled for empty amounts
      expect(createButton).toBeDisabled();
    });
  });

  describe('Token Swap Feature', () => {
    it('should swap offering and wanted tokens', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Enter amounts first
      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '100' } });

      await waitFor(() => {
        const wantedInput = screen.getByLabelText('Wanted') as HTMLInputElement;
        expect(parseFloat(wantedInput.value)).toBeCloseTo(2.5, 2);
      });

      // Click swap button
      const swapButton = screen.getByTestId('swap-tokens-button');
      fireEvent.click(swapButton);

      await waitFor(() => {
        // Tokens should be swapped
        const offeringSelect = screen.getByRole('combobox', { name: /offering/i });
        const wantedSelect = screen.getByRole('combobox', { name: /wanted/i });
        
        expect(offeringSelect).toHaveTextContent('GUSDC');
        expect(wantedSelect).toHaveTextContent('GALA');

        // Amounts should be swapped
        const offeringInput = screen.getByLabelText('Offering') as HTMLInputElement;
        const wantedInput = screen.getByLabelText('Wanted') as HTMLInputElement;
        
        expect(parseFloat(offeringInput.value)).toBeCloseTo(2.5, 2);
        expect(parseFloat(wantedInput.value)).toBeCloseTo(100, 2);
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

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: 'invalid' } });

      await waitFor(() => {
        const wantedInput = screen.getByLabelText('Wanted') as HTMLInputElement;
        expect(wantedInput.value).toBe('');
      });
    });

    it('should handle zero amounts', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const offeringInput = screen.getByLabelText('Offering');
      fireEvent.change(offeringInput, { target: { value: '0' } });

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: 'Create Offer' });
        expect(createButton).toBeDisabled();
      });
    });
  });
});