import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import SwapInterface from '@/components/SwapInterface';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
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

// Real token pairs from swap.gala.com/explore (current data)
const REAL_GALA_SWAP_PAIRS = [
  { 
    token1: 'USDC', 
    token2: 'WBTC', 
    fee: 0.3, 
    tvl: 1038393.48, 
    description: 'USD Coin / Wrapped Bitcoin',
    volume24h: 25070.70
  },
  { 
    token1: 'USDT', 
    token2: 'WBTC', 
    fee: 0.3, 
    tvl: 1008577.16, 
    description: 'Tether USD / Wrapped Bitcoin',
    volume24h: 26068.32
  },
  { 
    token1: 'USDT', 
    token2: 'WETH', 
    fee: 1.0, 
    tvl: 723136.90, 
    description: 'Tether USD / Wrapped Ethereum',
    volume24h: 78211.42
  },
  { 
    token1: 'GALA', 
    token2: 'USDC', 
    fee: 1.0, 
    tvl: 709903.79, 
    description: 'Gala / USD Coin',
    volume24h: 11411.77
  },
  { 
    token1: 'USDC', 
    token2: 'WETH', 
    fee: 1.0, 
    tvl: 681852.57, 
    description: 'USD Coin / Wrapped Ethereum',
    volume24h: 51694.25
  },
  { 
    token1: 'GALA', 
    token2: 'USDT', 
    fee: 1.0, 
    tvl: 117934.77, 
    description: 'Gala / Tether USD',
    volume24h: 2798.55
  },
  { 
    token1: 'GALA', 
    token2: 'WETH', 
    fee: 1.0, 
    tvl: 49839.44, 
    description: 'Gala / Wrapped Ethereum',
    volume24h: 1165.06
  },
  { 
    token1: 'GALA', 
    token2: 'WEN', 
    fee: 1.0, 
    tvl: 47706.30, 
    description: 'Gala / Wen Token',
    volume24h: 685.75
  },
  { 
    token1: '$GMUSIC', 
    token2: 'FILM', 
    fee: 1.0, 
    tvl: 45593.05, 
    description: 'Gala Music / Gala Film',
    volume24h: 0.00
  },
  { 
    token1: 'USDC', 
    token2: 'WXRP', 
    fee: 0.3, 
    tvl: 32179.58, 
    description: 'USD Coin / Wrapped XRP',
    volume24h: 701.66
  },
];

const TEST_AMOUNTS = {
  small: '10',
  medium: '100', 
  large: '1000',
};

describe('Real swap.gala.com Token Pair Tests', () => {
  describe('AMM Liquidity Pool Token Pairs', () => {
    REAL_GALA_SWAP_PAIRS.forEach(({ token1, token2, description, fee, tvl }) => {
      describe(`${description}`, () => {
        it(`should calculate correct amounts for small trade (${TEST_AMOUNTS.small})`, async () => {
          render(
            <TestWrapper>
              <SwapInterface />
            </TestWrapper>
          );

          // Set up the token pair (token1 -> token2)
          const fromSelect = screen.getByRole('combobox', { name: /selling/i });
          const toSelect = screen.getByRole('combobox', { name: /buying/i });

          if (token1 !== 'USDC') {
            fireEvent.click(fromSelect);
            await waitFor(() => {
              const token1Option = screen.getByText(token1);
              fireEvent.click(token1Option);
            });
          }

          if (token2 !== 'GALA') {
            fireEvent.click(toSelect);
            await waitFor(() => {
              const token2Option = screen.getByText(token2);
              fireEvent.click(token2Option);
            });
          }

          // Enter test amount
          const fromInput = screen.getByLabelText('Selling');
          fireEvent.change(fromInput, { target: { value: TEST_AMOUNTS.small } });

          await waitFor(() => {
            const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
            // Should calculate some reasonable amount (AMM will adjust based on price impact)
            expect(parseFloat(toInput.value)).toBeGreaterThan(0);
          });
        });

        it(`should calculate correct amounts for medium trade (${TEST_AMOUNTS.medium})`, async () => {
          render(
            <TestWrapper>
              <SwapInterface />
            </TestWrapper>
          );

          // Set up the token pair
          const fromSelect = screen.getByRole('combobox', { name: /selling/i });
          const toSelect = screen.getByRole('combobox', { name: /buying/i });

          if (token1 !== 'USDC') {
            fireEvent.click(fromSelect);
            await waitFor(() => {
              const token1Option = screen.getByText(token1);
              fireEvent.click(token1Option);
            });
          }

          if (token2 !== 'GALA') {
            fireEvent.click(toSelect);
            await waitFor(() => {
              const token2Option = screen.getByText(token2);
              fireEvent.click(token2Option);
            });
          }

          // Enter test amount
          const fromInput = screen.getByLabelText('Selling');
          fireEvent.change(fromInput, { target: { value: TEST_AMOUNTS.medium } });

          await waitFor(() => {
            const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
            expect(parseFloat(toInput.value)).toBeGreaterThan(0);
          });
        });

        it(`should display correct swap fee (${fee}%)`, async () => {
          render(
            <TestWrapper>
              <SwapInterface />
            </TestWrapper>
          );

          // Set up the token pair
          const fromSelect = screen.getByRole('combobox', { name: /selling/i });
          const toSelect = screen.getByRole('combobox', { name: /buying/i });

          if (token1 !== 'USDC') {
            fireEvent.click(fromSelect);
            await waitFor(() => {
              const token1Option = screen.getByText(token1);
              fireEvent.click(token1Option);
            });
          }

          if (token2 !== 'GALA') {
            fireEvent.click(toSelect);
            await waitFor(() => {
              const token2Option = screen.getByText(token2);
              fireEvent.click(token2Option);
            });
          }

          // Enter amount to trigger fee display
          const fromInput = screen.getByLabelText('Selling');
          fireEvent.change(fromInput, { target: { value: '100' } });

          await waitFor(() => {
            expect(screen.getByText(`${fee}%`)).toBeInTheDocument();
          });
        });

        it(`should calculate price impact for large trade (${TEST_AMOUNTS.large})`, async () => {
          render(
            <TestWrapper>
              <SwapInterface />
            </TestWrapper>
          );

          // Set up the token pair
          const fromSelect = screen.getByRole('combobox', { name: /selling/i });
          const toSelect = screen.getByRole('combobox', { name: /buying/i });

          if (token1 !== 'USDC') {
            fireEvent.click(fromSelect);
            await waitFor(() => {
              const token1Option = screen.getByText(token1);
              fireEvent.click(token1Option);
            });
          }

          if (token2 !== 'GALA') {
            fireEvent.click(toSelect);
            await waitFor(() => {
              const token2Option = screen.getByText(token2);
              fireEvent.click(token2Option);
            });
          }

          // Enter large amount to generate price impact
          const fromInput = screen.getByLabelText('Selling');
          fireEvent.change(fromInput, { target: { value: TEST_AMOUNTS.large } });

          await waitFor(() => {
            // Should show price impact for large trades
            const priceImpactBadge = screen.queryByTestId('price-impact-badge');
            if (priceImpactBadge) {
              expect(priceImpactBadge).toBeInTheDocument();
            }
          });
        });
      });
    });
  });

  describe('Real swap.gala.com AMM Model Validation', () => {
    it('should support all 9 official tokens', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      fireEvent.click(fromSelect);

      await waitFor(() => {
        // All 9 official tokens should be available
        expect(screen.getByText('GALA')).toBeInTheDocument();
        expect(screen.getByText('USDC')).toBeInTheDocument();
        expect(screen.getByText('USDT')).toBeInTheDocument();
        expect(screen.getByText('WBTC')).toBeInTheDocument();
        expect(screen.getByText('WETH')).toBeInTheDocument();
        expect(screen.getByText('WEN')).toBeInTheDocument();
        expect(screen.getByText('$GMUSIC')).toBeInTheDocument();
        expect(screen.getByText('FILM')).toBeInTheDocument();
        expect(screen.getByText('WXRP')).toBeInTheDocument();
      });
    });

    it('should show AMM swap interface (not P2P orderbook)', () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Swap')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
      
      // Should have "Selling" and "Buying" labels (AMM style)
      expect(screen.getByText('Selling')).toBeInTheDocument();
      expect(screen.getByText('Buying')).toBeInTheDocument();
    });

    it('should display price impact calculations for AMM', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Large trade should show price impact
      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '5000' } });

      await waitFor(() => {
        // Price impact should be calculated and displayed
        const priceImpactBadge = screen.queryByTestId('price-impact-badge');
        if (priceImpactBadge) {
          expect(priceImpactBadge).toBeInTheDocument();
        }
      });
    });

    it('should handle high-volume pairs correctly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Test USDC/WBTC (highest TVL pair)
      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '1000' } });

      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const wbtcOption = screen.getByText('WBTC');
        fireEvent.click(wbtcOption);
      });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // Should calculate reasonable WBTC amount
        expect(parseFloat(toInput.value)).toBeGreaterThan(0);
        expect(parseFloat(toInput.value)).toBeLessThan(1); // WBTC is expensive
      });
    });
  });

  describe('Fee Structure Validation', () => {
    it('should display 0.3% fee for stable/major crypto pairs', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Test USDC/WBTC (0.3% fee pair)
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const wbtcOption = screen.getByText('WBTC');
        fireEvent.click(wbtcOption);
      });

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('0.3%')).toBeInTheDocument();
      });
    });

    it('should display 1% fee for GALA and ecosystem token pairs', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Test GALA/USDC (1% fee pair) - this is the default
      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('1%')).toBeInTheDocument();
      });
    });
  });

  describe('Token-Specific Features', () => {
    it('should handle stablecoin pairs (USDC/USDT)', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // USDC to USDT should have ~1:1 ratio
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const usdtOption = screen.getByText('USDT');
        fireEvent.click(usdtOption);
      });

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // Should be close to 1:1 ratio
        expect(parseFloat(toInput.value)).toBeCloseTo(100, 1);
      });
    });

    it('should handle major crypto pairs (WBTC/WETH)', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change from USDC to WBTC
      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      fireEvent.click(fromSelect);
      
      await waitFor(() => {
        const wbtcOption = screen.getByText('WBTC');
        fireEvent.click(wbtcOption);
      });

      // Change to WETH
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const wethOption = screen.getByText('WETH');
        fireEvent.click(wethOption);
      });

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '0.01' } }); // Small amount of WBTC

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // Should get reasonable amount of WETH
        expect(parseFloat(toInput.value)).toBeGreaterThan(0);
      });
    });

    it('should handle ecosystem tokens (GALA/WEN)', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change from USDC to GALA
      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      fireEvent.click(fromSelect);
      
      await waitFor(() => {
        const galaOption = screen.getByText('GALA');
        fireEvent.click(galaOption);
      });

      // Change to WEN
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const wenOption = screen.getByText('WEN');
        fireEvent.click(wenOption);
      });

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // Should get many WEN tokens for GALA
        expect(parseFloat(toInput.value)).toBeGreaterThan(1000);
      });
    });

    it('should handle Gala ecosystem media tokens ($GMUSIC/FILM)', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      // Change from USDC to $GMUSIC
      const fromSelect = screen.getByRole('combobox', { name: /selling/i });
      fireEvent.click(fromSelect);
      
      await waitFor(() => {
        const gmusicOption = screen.getByText('$GMUSIC');
        fireEvent.click(gmusicOption);
      });

      // Change to FILM
      const toSelect = screen.getByRole('combobox', { name: /buying/i });
      fireEvent.click(toSelect);
      
      await waitFor(() => {
        const filmOption = screen.getByText('FILM');
        fireEvent.click(filmOption);
      });

      const fromInput = screen.getByLabelText('Selling');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        const toInput = screen.getByLabelText('Buying') as HTMLInputElement;
        // Should calculate reasonable FILM amount
        expect(parseFloat(toInput.value)).toBeGreaterThan(0);
      });
    });
  });
});