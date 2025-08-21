import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SwapComponent } from '@/components/SwapComponent';
import { mockWalletProvider, mockTokens } from '../mocks/wallet-mock';

// Mock wallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => mockWalletProvider
}));

describe('SwapComponent - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render swap interface correctly', () => {
      render(<SwapComponent />);
      
      expect(screen.getByText('Selling')).toBeInTheDocument();
      expect(screen.getByText('Buying')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should show default token selection (USDC -> GALA)', () => {
      render(<SwapComponent />);
      
      expect(screen.getByText('USDC')).toBeInTheDocument();
      expect(screen.getByText('GALA')).toBeInTheDocument();
    });

    it('should display zero balances initially', () => {
      render(<SwapComponent />);
      
      const balances = screen.getAllByText('0.00');
      expect(balances).toHaveLength(4); // 2 token amounts + 2 USD values
    });
  });

  describe('Token Selection', () => {
    it('should allow selecting selling token', async () => {
      render(<SwapComponent />);
      
      const sellTokenButton = screen.getByTestId('sell-token-selector');
      fireEvent.click(sellTokenButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('token-modal')).toBeInTheDocument();
      });
    });

    it('should allow selecting buying token', async () => {
      render(<SwapComponent />);
      
      const buyTokenButton = screen.getByTestId('buy-token-selector');
      fireEvent.click(buyTokenButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('token-modal')).toBeInTheDocument();
      });
    });

    it('should swap tokens when swap button is clicked', async () => {
      render(<SwapComponent />);
      
      const swapButton = screen.getByTestId('swap-tokens-button');
      fireEvent.click(swapButton);
      
      // Should swap the positions of USDC and GALA
      await waitFor(() => {
        const sellingSection = screen.getByTestId('selling-section');
        const buyingSection = screen.getByTestId('buying-section');
        
        expect(sellingSection).toHaveTextContent('GALA');
        expect(buyingSection).toHaveTextContent('USDC');
      });
    });
  });

  describe('Amount Input', () => {
    it('should accept valid numeric input', async () => {
      render(<SwapComponent />);
      
      const amountInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(amountInput, { target: { value: '10.5' } });
      
      expect(amountInput).toHaveValue('10.5');
    });

    it('should reject invalid input', async () => {
      render(<SwapComponent />);
      
      const amountInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(amountInput, { target: { value: 'abc' } });
      
      expect(amountInput).toHaveValue('');
    });

    it('should calculate receiving amount when selling amount changes', async () => {
      render(<SwapComponent />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '100' } });
      
      await waitFor(() => {
        const buyInput = screen.getByTestId('buy-amount-input');
        expect(buyInput.value).not.toBe('0.00');
      });
    });

    it('should use MAX button to set maximum balance', async () => {
      mockWalletProvider.isConnected = true;
      render(<SwapComponent />);
      
      const maxButton = screen.getByText('MAX');
      fireEvent.click(maxButton);
      
      await waitFor(() => {
        const sellInput = screen.getByTestId('sell-amount-input');
        expect(sellInput.value).toBe(mockTokens.USDC.balance);
      });
    });
  });

  describe('Price Impact & Slippage', () => {
    it('should show price impact warning for large trades', async () => {
      render(<SwapComponent />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '10000' } });
      
      await waitFor(() => {
        expect(screen.getByTestId('price-impact-warning')).toBeInTheDocument();
      });
    });

    it('should allow adjusting slippage tolerance', async () => {
      render(<SwapComponent />);
      
      const settingsButton = screen.getByTestId('swap-settings');
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const slippageInput = screen.getByTestId('slippage-input');
        fireEvent.change(slippageInput, { target: { value: '1.0' } });
        expect(slippageInput).toHaveValue('1.0');
      });
    });
  });

  describe('Wallet Integration', () => {
    it('should show connect wallet button when not connected', () => {
      mockWalletProvider.isConnected = false;
      render(<SwapComponent />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should show swap button when wallet is connected', () => {
      mockWalletProvider.isConnected = true;
      render(<SwapComponent />);
      
      expect(screen.getByText('Swap')).toBeInTheDocument();
    });

    it('should disable swap button with insufficient balance', async () => {
      mockWalletProvider.isConnected = true;
      render(<SwapComponent />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '10000000' } });
      
      await waitFor(() => {
        const swapButton = screen.getByText('Insufficient Balance');
        expect(swapButton).toBeDisabled();
      });
    });
  });
});