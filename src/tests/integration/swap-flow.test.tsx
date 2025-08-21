import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { mockWalletProvider, mockTokens } from '../mocks/wallet-mock';

// Mock all required hooks and services
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => mockWalletProvider
}));

vi.mock('@/services/swapService', () => ({
  getQuote: vi.fn().mockResolvedValue({
    outputAmount: '2000.0',
    priceImpact: 0.1,
    route: ['USDC', 'GALA']
  }),
  executeSwap: vi.fn().mockResolvedValue({
    hash: '0xtransactionhash',
    status: 'success'
  })
}));

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('Swap Flow - Integration Tests', () => {
  beforeEach(() => {
    mockWalletProvider.isConnected = true;
    mockWalletProvider.account = '0x1234567890123456789012345678901234567890';
  });

  describe('Complete Swap Journey', () => {
    it('should complete full swap flow from start to finish', async () => {
      render(<AppWrapper />);
      
      // 1. Navigate to swap page
      expect(screen.getByText('Swap')).toBeInTheDocument();
      
      // 2. Enter swap amount
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '100' } });
      
      // 3. Wait for quote calculation
      await waitFor(() => {
        const buyInput = screen.getByTestId('buy-amount-input');
        expect(buyInput.value).toBe('2000.0');
      });
      
      // 4. Review swap details
      expect(screen.getByText('Price Impact: 0.1%')).toBeInTheDocument();
      
      // 5. Execute swap
      const swapButton = screen.getByText('Swap');
      fireEvent.click(swapButton);
      
      // 6. Confirm transaction
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm Swap');
        fireEvent.click(confirmButton);
      });
      
      // 7. Wait for transaction completion
      await waitFor(() => {
        expect(screen.getByText('Swap Successful!')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // 8. Verify transaction hash is displayed
      expect(screen.getByText('0xtransactionhash')).toBeInTheDocument();
    });

    it('should handle swap with custom slippage', async () => {
      render(<AppWrapper />);
      
      // Open settings
      fireEvent.click(screen.getByTestId('swap-settings'));
      
      // Set custom slippage
      const slippageInput = screen.getByTestId('slippage-input');
      fireEvent.change(slippageInput, { target: { value: '2.0' } });
      
      // Close settings
      fireEvent.click(screen.getByTestId('close-settings'));
      
      // Enter amount and swap
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '50' } });
      
      await waitFor(() => {
        const swapButton = screen.getByText('Swap');
        fireEvent.click(swapButton);
      });
      
      // Verify slippage is applied in confirmation
      await waitFor(() => {
        expect(screen.getByText('Slippage Tolerance: 2.0%')).toBeInTheDocument();
      });
    });

    it('should handle token switching', async () => {
      render(<AppWrapper />);
      
      // Initial state: USDC -> GALA
      expect(screen.getByTestId('selling-section')).toHaveTextContent('USDC');
      expect(screen.getByTestId('buying-section')).toHaveTextContent('GALA');
      
      // Switch tokens
      fireEvent.click(screen.getByTestId('swap-tokens-button'));
      
      // Verify tokens switched: GALA -> USDC
      await waitFor(() => {
        expect(screen.getByTestId('selling-section')).toHaveTextContent('GALA');
        expect(screen.getByTestId('buying-section')).toHaveTextContent('USDC');
      });
      
      // Verify amounts are recalculated
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '1000' } });
      
      await waitFor(() => {
        const buyInput = screen.getByTestId('buy-amount-input');
        expect(buyInput.value).not.toBe('0.00');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient balance error', async () => {
      // Mock low balance
      mockTokens.USDC.balance = '10.0';
      
      render(<AppWrapper />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '1000' } });
      
      await waitFor(() => {
        expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
      });
    });

    it('should handle transaction failure', async () => {
      // Mock failed transaction
      vi.mocked(require('@/services/swapService').executeSwap)
        .mockRejectedValueOnce(new Error('Transaction failed'));
      
      render(<AppWrapper />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '10' } });
      
      const swapButton = screen.getByText('Swap');
      fireEvent.click(swapButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm Swap');
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      });
    });

    it('should handle network disconnection', async () => {
      // Mock network error
      mockWalletProvider.isConnected = false;
      
      render(<AppWrapper />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update prices in real-time', async () => {
      render(<AppWrapper />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '100' } });
      
      // Initial quote
      await waitFor(() => {
        expect(screen.getByTestId('buy-amount-input')).toHaveValue('2000.0');
      });
      
      // Simulate price update
      vi.mocked(require('@/services/swapService').getQuote)
        .mockResolvedValueOnce({
          outputAmount: '1950.0',
          priceImpact: 0.15,
          route: ['USDC', 'GALA']
        });
      
      // Trigger price refresh
      fireEvent.focus(sellInput);
      
      await waitFor(() => {
        expect(screen.getByTestId('buy-amount-input')).toHaveValue('1950.0');
      });
    });
  });
});