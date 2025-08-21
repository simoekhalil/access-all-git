import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { mockWalletProvider } from '../mocks/wallet-mock';

// Complete E2E test simulating real user journey
const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('Complete User Journey - E2E Tests', () => {
  describe('New User Onboarding', () => {
    it('should complete full user onboarding flow', async () => {
      mockWalletProvider.isConnected = false;
      render(<AppWrapper />);
      
      // 1. User lands on site and sees connect wallet
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      
      // 2. User connects wallet
      fireEvent.click(screen.getByText('Connect Wallet'));
      
      await waitFor(() => {
        mockWalletProvider.isConnected = true;
        // Simulate wallet connection success
        expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      });
      
      // 3. User sees their balance and interface updates
      await waitFor(() => {
        expect(screen.getByTestId('user-balance')).toBeInTheDocument();
        expect(screen.getByText('Swap')).toBeInTheDocument();
      });
      
      // 4. User performs first swap
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '10' } });
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Swap'));
      });
      
      // 5. User completes transaction
      await waitFor(() => {
        fireEvent.click(screen.getByText('Confirm Swap'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Swap Successful!')).toBeInTheDocument();
      });
    });
  });

  describe('Power User Workflow', () => {
    it('should handle complex multi-step workflow', async () => {
      mockWalletProvider.isConnected = true;
      render(<AppWrapper />);
      
      // 1. Check trending pools
      fireEvent.click(screen.getByText('Trending Pools'));
      
      await waitFor(() => {
        expect(screen.getByTestId('trending-pools-modal')).toBeInTheDocument();
      });
      
      // 2. Navigate to specific pool
      fireEvent.click(screen.getByText('GALA/USDC'));
      
      await waitFor(() => {
        expect(screen.getByText('Pool Details')).toBeInTheDocument();
      });
      
      // 3. Add liquidity to pool
      fireEvent.click(screen.getByText('Add Liquidity'));
      
      await waitFor(() => {
        const galaInput = screen.getByTestId('gala-input');
        const usdcInput = screen.getByTestId('usdc-input');
        
        fireEvent.change(galaInput, { target: { value: '100' } });
        fireEvent.change(usdcInput, { target: { value: '5' } });
        
        fireEvent.click(screen.getByText('Add'));
      });
      
      // 4. Check positions
      fireEvent.click(screen.getByText('Your Positions'));
      
      await waitFor(() => {
        expect(screen.getByTestId('position-gala-usdc')).toBeInTheDocument();
      });
      
      // 5. Use DEX scanner
      fireEvent.click(screen.getByText('Gala DEX Scanner'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dex-scanner')).toBeInTheDocument();
        expect(screen.getByText('Token Analysis')).toBeInTheDocument();
      });
      
      // 6. Check leaderboard
      fireEvent.click(screen.getByText('Leaderboard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Top Traders')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should maintain state across feature navigation', async () => {
      mockWalletProvider.isConnected = true;
      render(<AppWrapper />);
      
      // 1. Set up swap parameters
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '50' } });
      
      // 2. Navigate to pools and back
      fireEvent.click(screen.getByText('Pool'));
      fireEvent.click(screen.getByText('Swap'));
      
      // 3. Verify swap state preserved
      await waitFor(() => {
        expect(screen.getByTestId('sell-amount-input')).toHaveValue('50');
      });
      
      // 4. Navigate to balance page
      fireEvent.click(screen.getByText('Balance'));
      
      await waitFor(() => {
        expect(screen.getByTestId('balance-overview')).toBeInTheDocument();
      });
      
      // 5. Return to swap and verify state
      fireEvent.click(screen.getByText('Swap'));
      
      await waitFor(() => {
        expect(screen.getByTestId('sell-amount-input')).toHaveValue('50');
      });
    });

    it('should update balances across all features after transaction', async () => {
      mockWalletProvider.isConnected = true;
      render(<AppWrapper />);
      
      // 1. Check initial balance
      fireEvent.click(screen.getByText('Balance'));
      const initialBalance = screen.getByTestId('gala-balance').textContent;
      
      // 2. Perform swap
      fireEvent.click(screen.getByText('Swap'));
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '10' } });
      
      fireEvent.click(screen.getByText('Swap'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Confirm Swap'));
      });
      
      // 3. Verify balance updated everywhere
      await waitFor(() => {
        fireEvent.click(screen.getByText('Balance'));
        const newBalance = screen.getByTestId('gala-balance').textContent;
        expect(newBalance).not.toBe(initialBalance);
      });
      
      // 4. Check pool page also reflects new balance
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        const poolBalance = screen.getByTestId('available-gala').textContent;
        expect(poolBalance).toBe(newBalance);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle and recover from network errors', async () => {
      mockWalletProvider.isConnected = true;
      render(<AppWrapper />);
      
      // 1. Simulate network error during swap
      vi.mocked(require('@/services/swapService').executeSwap)
        .mockRejectedValueOnce(new Error('Network error'));
      
      const sellInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(sellInput, { target: { value: '10' } });
      
      fireEvent.click(screen.getByText('Swap'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Confirm Swap'));
      });
      
      // 2. Verify error message
      await waitFor(() => {
        expect(screen.getByText('Network Error - Please Try Again')).toBeInTheDocument();
      });
      
      // 3. User retries after network recovery
      vi.mocked(require('@/services/swapService').executeSwap)
        .mockResolvedValueOnce({ hash: '0xretry', status: 'success' });
      
      fireEvent.click(screen.getByText('Retry'));
      
      // 4. Verify success on retry
      await waitFor(() => {
        expect(screen.getByText('Swap Successful!')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should load and respond quickly to user interactions', async () => {
      const startTime = performance.now();
      
      render(<AppWrapper />);
      
      // App should load quickly
      await waitFor(() => {
        expect(screen.getByText('Swap')).toBeInTheDocument();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load in under 2 seconds
      
      // Interactions should be responsive
      const interactionStart = performance.now();
      
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        expect(screen.getByText('Liquidity Pools')).toBeInTheDocument();
      });
      
      const interactionTime = performance.now() - interactionStart;
      expect(interactionTime).toBeLessThan(500); // Should respond in under 500ms
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to keyboard users', async () => {
      render(<AppWrapper />);
      
      // Tab navigation should work
      const swapTab = screen.getByText('Swap');
      swapTab.focus();
      expect(document.activeElement).toBe(swapTab);
      
      // Enter key should activate buttons
      fireEvent.keyDown(swapTab, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('swap-interface')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      render(<AppWrapper />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      expect(sellInput).toHaveAttribute('aria-label', 'Amount to sell');
      
      const buyInput = screen.getByTestId('buy-amount-input');
      expect(buyInput).toHaveAttribute('aria-label', 'Amount to receive');
    });
  });
});