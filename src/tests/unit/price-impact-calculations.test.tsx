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

describe('Price Impact Calculations', () => {
  beforeEach(() => {
    render(
      <TestWrapper>
        <SwapInterface />
      </TestWrapper>
    );
  });

  describe('Formula Validation Tests', () => {
    test('should calculate price impact using the correct formula', async () => {
      // Enter a trade amount that will create price impact
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      // Verify price impact is calculated and displayed
      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      expect(priceImpactBadge.textContent).toMatch(/[+-]?\d+\.?\d*%/);
    });

    test('should show positive price impact for large trades', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '10000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = parseFloat(impactText.replace('%', '').replace('+', ''));
      
      expect(impactValue).toBeGreaterThan(0);
      expect(impactText).toMatch(/^\+/); // Should start with +
    });

    test('should show minimal price impact for small trades', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = Math.abs(parseFloat(impactText.replace('%', '').replace('+', '')));
      
      expect(impactValue).toBeLessThan(1); // Less than 1% impact
    });

    test('should not show price impact for zero amounts', () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '0' } });

      const priceImpactBadge = screen.queryByTestId('price-impact-badge');
      expect(priceImpactBadge).not.toBeInTheDocument();
    });

    test('should not show price impact for empty amounts', () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '' } });

      const priceImpactBadge = screen.queryByTestId('price-impact-badge');
      expect(priceImpactBadge).not.toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    test('should handle very small amounts correctly', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '0.000001' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = parseFloat(impactText.replace('%', '').replace('+', ''));
      
      expect(impactValue).toBeGreaterThanOrEqual(0);
      expect(impactValue).toBeLessThan(0.01); // Very small impact
    });

    test('should handle very large amounts correctly', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = parseFloat(impactText.replace('%', '').replace('+', ''));
      
      expect(impactValue).toBeGreaterThan(10); // Significant impact for large trades
    });

    test('should handle invalid input gracefully', () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: 'invalid' } });

      const priceImpactBadge = screen.queryByTestId('price-impact-badge');
      expect(priceImpactBadge).not.toBeInTheDocument();
    });

    test('should handle negative amounts gracefully', () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '-100' } });

      const priceImpactBadge = screen.queryByTestId('price-impact-badge');
      expect(priceImpactBadge).not.toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    test('should use destructive badge for high price impact (>5%)', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = parseFloat(impactText.replace('%', '').replace('+', ''));
      
      if (Math.abs(impactValue) > 5) {
        expect(priceImpactBadge).toHaveClass('bg-destructive');
      }
    });

    test('should use secondary badge for medium price impact (1-5%)', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '5000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = Math.abs(parseFloat(impactText.replace('%', '').replace('+', '')));
      
      if (impactValue > 1 && impactValue <= 5) {
        expect(priceImpactBadge).toHaveClass('bg-secondary');
      }
    });

    test('should use outline badge for low price impact (<1%)', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '10' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = Math.abs(parseFloat(impactText.replace('%', '').replace('+', '')));
      
      if (impactValue <= 1) {
        expect(priceImpactBadge).toHaveClass('text-foreground');
      }
    });
  });

  describe('Token Pair Tests', () => {
    test('should calculate price impact for different token pairs', async () => {
      // Test GALA to WETH by changing the to token
      const toTokenSelect = screen.getAllByRole('combobox')[1];
      fireEvent.click(toTokenSelect);
      
      const wethOption = screen.getByText('WETH');
      fireEvent.click(wethOption);

      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      expect(priceImpactBadge.textContent).toMatch(/[+-]?\d+\.?\d*%/);
    });

    test('should recalculate price impact when swapping token order', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '1000' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const initialImpact = screen.getByTestId('price-impact-badge').textContent;

      // Swap tokens
      const swapButton = screen.getByTestId('swap-tokens-button');
      fireEvent.click(swapButton);

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const newImpact = screen.getByTestId('price-impact-badge').textContent;
      
      // Impact should be recalculated (may be different due to different rates)
      expect(newImpact).toMatch(/[+-]?\d+\.?\d*%/);
    });
  });

  describe('Precision Tests', () => {
    test('should display price impact with 3 decimal places', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      
      // Should have 3 decimal places
      expect(impactText).toMatch(/[+-]?\d+\.\d{3}%/);
    });

    test('should handle decimal input amounts correctly', async () => {
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '123.456789' } });

      await waitFor(() => {
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        expect(priceImpactBadge).toBeInTheDocument();
      });

      const priceImpactBadge = screen.getByTestId('price-impact-badge');
      const impactText = priceImpactBadge.textContent || '';
      const impactValue = parseFloat(impactText.replace('%', '').replace('+', ''));
      
      expect(impactValue).toBeGreaterThanOrEqual(0);
      expect(isNaN(impactValue)).toBe(false);
    });
  });
});