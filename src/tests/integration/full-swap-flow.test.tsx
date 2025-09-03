import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';

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
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

describe('Full Swap Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
    });
  });

  describe('Complete User Flow', () => {
    it('should allow user to connect wallet and perform swap', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockBalance = '0x1BC16D674EC80000'; // 2 ETH in wei
      
      mockEthereum.request
        .mockResolvedValueOnce([]) // eth_accounts (initially empty)
        .mockResolvedValueOnce([mockAddress]) // eth_requestAccounts
        .mockResolvedValueOnce(mockBalance); // eth_getBalance

      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      // Verify page loaded
      expect(screen.getByText('Gala DEX')).toBeInTheDocument();
      expect(screen.getByText('Trade your favorite Gala ecosystem tokens with lightning speed and minimal fees')).toBeInTheDocument();

      // Connect wallet
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
      });

      // Perform swap
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      await waitFor(() => {
        const toAmountInput = screen.getByLabelText('To') as HTMLInputElement;
        expect(parseFloat(toAmountInput.value)).toBeCloseTo(2.5, 1); // 100 * 0.025 base rate
      });

      // Execute swap
      const swapButton = screen.getByText('Swap');
      fireEvent.click(swapButton);

      expect(screen.getByText('Swapping...')).toBeInTheDocument();

      await waitFor(() => {
        // Swap should complete and reset form
        expect(screen.getByLabelText('Selling')).toHaveValue('');
        expect(screen.getByLabelText('To')).toHaveValue('');
      }, { timeout: 3000 });
    });

    it('should handle wallet connection failure gracefully', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([]) // eth_accounts
        .mockRejectedValueOnce(new Error('User rejected request'));

      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('User rejected request')).toBeInTheDocument();
      });

      // Swap should still be available but user should see wallet is not connected
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Swap Tokens')).toBeInTheDocument();
    });

    it('should display feature highlights', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText('Execute swaps in seconds with our optimized smart contracts')).toBeInTheDocument();
      
      expect(screen.getByText('Low Fees')).toBeInTheDocument();
      expect(screen.getByText('Trade with minimal fees and maximum value for your transactions')).toBeInTheDocument();
      
      expect(screen.getByText('Secure')).toBeInTheDocument();
      expect(screen.getByText('Your funds are protected by battle-tested smart contracts')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render wallet and swap components', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      // Both main components should be present
      expect(screen.getByText('Gala Wallet')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to start trading')).toBeInTheDocument();
      expect(screen.getByText('Swap Tokens')).toBeInTheDocument();
      expect(screen.getByText('Trade your tokens instantly')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing wallet provider', async () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Please install MetaMask or another Web3 wallet to connect.')).toBeInTheDocument();
      });
    });

    it('should handle swap without wallet connection', async () => {
      mockEthereum.request.mockResolvedValue([]); // No connected accounts

      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      // Try to perform swap without connecting wallet
      const fromAmountInput = screen.getByLabelText('From');
      fireEvent.change(fromAmountInput, { target: { value: '100' } });

      const swapButton = screen.getByText('Swap');
      fireEvent.click(swapButton);

      // Swap should execute (in demo mode) even without wallet
      await waitFor(() => {
        expect(screen.getByText('Swapping...')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});