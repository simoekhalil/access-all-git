import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import WalletConnection from '@/components/WalletConnection';

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

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

describe('WalletConnection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
    });
  });

  describe('Initial State', () => {
    it('should render connect button when wallet is not connected', () => {
      mockEthereum.request.mockResolvedValue([]);
      
      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Gala Wallet')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to start trading')).toBeInTheDocument();
    });

    it('should show error when no wallet is detected', async () => {
      // Remove ethereum from window
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Please install MetaMask or another Web3 wallet to connect.')).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Connection', () => {
    it('should connect wallet successfully', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockBalance = '0x1BC16D674EC80000'; // 2 ETH in wei
      
      mockEthereum.request
        .mockResolvedValueOnce([]) // eth_accounts (initially empty)
        .mockResolvedValueOnce([mockAddress]) // eth_requestAccounts
        .mockResolvedValueOnce(mockBalance); // eth_getBalance

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
        expect(screen.getByText('2.0000 ETH')).toBeInTheDocument();
      });
    });

    it('should handle connection rejection', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([]) // eth_accounts
        .mockRejectedValueOnce(new Error('User rejected request'));

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('User rejected request')).toBeInTheDocument();
      });
    });
  });

  describe('Connected State', () => {
    it('should show connected state with wallet details', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockBalance = '0x1BC16D674EC80000';
      
      mockEthereum.request
        .mockResolvedValueOnce([mockAddress]) // eth_accounts (already connected)
        .mockResolvedValueOnce(mockBalance); // eth_getBalance

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('should disconnect wallet', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockBalance = '0x1BC16D674EC80000';
      
      mockEthereum.request
        .mockResolvedValueOnce([mockAddress])
        .mockResolvedValueOnce(mockBalance);

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
        expect(screen.queryByText('Connected')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle balance fetch error gracefully', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      mockEthereum.request
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockAddress])
        .mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
        // Balance should not be displayed on error
        expect(screen.queryByText(/ETH/)).not.toBeInTheDocument();
      });
    });
  });
});