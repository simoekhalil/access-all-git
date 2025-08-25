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

describe('Comprehensive Swap Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Selling Field (From Amount) Calculations', () => {
    it('should calculate correct GALA to USDC conversion when entering from amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(25); // 1000 * 0.025 = 25
      });
    });

    it('should calculate correct GALA to ETH conversion when entering from amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change to token to ETH
      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);

      await waitFor(() => {
        const ethOption = screen.getByText('ETH');
        fireEvent.click(ethOption);
      });

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '66666.67' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(1); // 66666.67 * 0.000015 ≈ 1
      });
    });

    it('should calculate correct USDC to GALA conversion when entering from amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change from token to USDC
      const fromTokenSelect = screen.getAllByRole('combobox')[0];
      fireEvent.click(fromTokenSelect);

      await waitFor(() => {
        const usdcOptions = screen.getAllByText('USDC');
        const dropdownOption = usdcOptions.find(option => 
          option.id && option.id.startsWith('radix-')
        ) || usdcOptions[usdcOptions.length - 1];
        fireEvent.click(dropdownOption);
      });

      // Change to token to GALA
      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);

      await waitFor(() => {
        const galaOptions = screen.getAllByText('GALA');
        const dropdownOption = galaOptions.find(option => 
          option.id && option.id.startsWith('radix-')
        ) || galaOptions[galaOptions.length - 1];
        fireEvent.click(dropdownOption);
      });

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(4000); // 100 * 40 = 4000
      });
    });

    it('should handle small decimal amounts in from field', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '0.000001' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(0); // Very small amount
      });
    });

    it('should handle large amounts in from field', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000000' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(25000); // 1000000 * 0.025 = 25000
      });
    });
  });

  describe('Buying Field (To Amount) Calculations', () => {
    it('should calculate correct from amount when entering USDC to amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '25' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From');
        expect(fromAmountInput).toHaveValue(1000); // 25 / 0.025 = 1000
      });
    });

    it('should calculate correct from amount when entering ETH to amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change to token to ETH
      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);

      await waitFor(() => {
        const ethOption = screen.getByText('ETH');
        fireEvent.click(ethOption);
      });

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '1' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From') as HTMLInputElement;
        expect(parseFloat(fromAmountInput.value)).toBeCloseTo(66666.67, 1); // 1 / 0.000015 ≈ 66666.67
      });
    });

    it('should calculate correct from amount for GALA when entering USDC to amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change from token to USDC and to token to GALA
      const fromTokenSelect = screen.getAllByRole('combobox')[0];
      fireEvent.click(fromTokenSelect);

      await waitFor(() => {
        const usdcOptions = screen.getAllByText('USDC');
        const dropdownOption = usdcOptions.find(option => 
          option.id && option.id.startsWith('radix-')
        ) || usdcOptions[usdcOptions.length - 1];
        fireEvent.click(dropdownOption);
      });

      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);

      await waitFor(() => {
        const galaOptions = screen.getAllByText('GALA');
        const dropdownOption = galaOptions.find(option => 
          option.id && option.id.startsWith('radix-')
        ) || galaOptions[galaOptions.length - 1];
        fireEvent.click(dropdownOption);
      });

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '4000' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From');
        expect(fromAmountInput).toHaveValue(100); // 4000 / 40 = 100
      });
    });

    it('should handle small decimal amounts in to field', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '0.000001' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From') as HTMLInputElement;
        expect(parseFloat(fromAmountInput.value)).toBeCloseTo(0.00004, 5); // 0.000001 / 0.025 = 0.00004
      });
    });

    it('should handle large amounts in to field', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '10000' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From');
        expect(fromAmountInput).toHaveValue(400000); // 10000 / 0.025 = 400000
      });
    });
  });

  describe('Directional Arrow Swap Functionality', () => {
    it('should preserve calculated values when swapping direction with from amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Enter amount in from field
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(2.5); // 100 * 0.025 = 2.5
      });

      // Click swap arrow
      const swapArrow = screen.getByTestId('swap-direction-button');
      fireEvent.click(swapArrow);

      await waitFor(() => {
        // Verify tokens swapped
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toHaveTextContent('USDC'); // From token
        expect(selects[1]).toHaveTextContent('GALA'); // To token
        
        // Verify amounts swapped correctly
        const newFromAmountInput = screen.getByLabelText('From');
        const newToAmountInput = screen.getByLabelText('To');
        expect(newFromAmountInput).toHaveValue(2.5); // Previous to amount
        expect(newToAmountInput).toHaveValue(100); // Previous from amount
      });
    });

    it('should preserve calculated values when swapping direction with to amount', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Enter amount in to field
      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '50' } });

      await waitFor(() => {
        const fromAmountInput = screen.getByLabelText('From');
        expect(fromAmountInput).toHaveValue(2000); // 50 / 0.025 = 2000
      });

      // Click swap arrow
      const swapArrow = screen.getByTestId('swap-direction-button');
      fireEvent.click(swapArrow);

      await waitFor(() => {
        // Verify tokens swapped
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toHaveTextContent('USDC'); // From token
        expect(selects[1]).toHaveTextContent('GALA'); // To token
        
        // Verify amounts swapped correctly
        const newFromAmountInput = screen.getByLabelText('From');
        const newToAmountInput = screen.getByLabelText('To');
        expect(newFromAmountInput).toHaveValue(50); // Previous to amount
        expect(newToAmountInput).toHaveValue(2000); // Previous from amount
      });
    });

    it('should maintain exchange rate accuracy after multiple swaps', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Initial calculation
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(25); // 1000 * 0.025
      });

      // First swap
      const swapArrow = screen.getByTestId('swap-direction-button');
      fireEvent.click(swapArrow);

      await waitFor(() => {
        const newFromAmountInput = screen.getByLabelText('From');
        const newToAmountInput = screen.getByLabelText('To');
        expect(newFromAmountInput).toHaveValue(25);
        expect(newToAmountInput).toHaveValue(1000);
      });

      // Second swap back
      fireEvent.click(swapArrow);

      await waitFor(() => {
        const finalFromAmountInput = screen.getByLabelText('From');
        const finalToAmountInput = screen.getByLabelText('To');
        expect(finalFromAmountInput).toHaveValue(1000);
        expect(finalToAmountInput).toHaveValue(25);
      });
    });

    it('should handle token changes after directional swap', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Set initial amount
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      // Swap direction
      const swapArrow = screen.getByTestId('swap-direction-button');
      fireEvent.click(swapArrow);

      await waitFor(() => {
        // Now USDC is from token, change it to ETH
        const fromTokenSelect = screen.getAllByRole('combobox')[0];
        fireEvent.click(fromTokenSelect);
      });

      await waitFor(() => {
        const ethOption = screen.getByText('ETH');
        fireEvent.click(ethOption);
      });

      await waitFor(() => {
        // Verify recalculation with new token pair
        const newToAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        expect(parseFloat(newToAmountInput.value)).toBeGreaterThan(0);
      });
    });
  });

  describe('Cross-validation of Calculations', () => {
    it('should maintain consistency when switching between from and to input methods', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Method 1: Enter from amount
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '400' } });

      let calculatedToAmount: string;
      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        calculatedToAmount = toAmountInput.value;
        expect(parseFloat(calculatedToAmount)).toBe(10); // 400 * 0.025 = 10
      });

      // Clear fields
      fireEvent.change(fromAmountInput, { target: { value: '' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('To') as HTMLInputElement;
        expect(toInput.value === '' || toInput.value === null).toBeTruthy();
      });

      // Method 2: Enter the same to amount
      const toAmountInput = screen.getByLabelText('To');
      fireEvent.change(toAmountInput, { target: { value: '10' } });

      await waitFor(() => {
        const recalculatedFromAmount = screen.getByLabelText('From');
        expect(recalculatedFromAmount).toHaveValue(400); // Should match original
      });
    });

    it('should handle rapid input changes without calculation errors', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromAmountInput = screen.getByLabelText('From');
      
      // Rapid input changes
      fireEvent.change(fromAmountInput, { target: { value: '1' } });
      fireEvent.change(fromAmountInput, { target: { value: '10' } });
      fireEvent.change(fromAmountInput, { target: { value: '100' } });
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To');
        expect(toAmountInput).toHaveValue(25); // Should reflect final value
      });
    });
  });
});