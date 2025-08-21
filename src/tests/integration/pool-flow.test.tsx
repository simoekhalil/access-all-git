import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { mockWalletProvider, mockPools } from '../mocks/wallet-mock';

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => mockWalletProvider
}));

vi.mock('@/services/poolService', () => ({
  addLiquidity: vi.fn().mockResolvedValue({
    hash: '0xlpaddress',
    status: 'success',
    lpTokens: '50.0'
  }),
  removeLiquidity: vi.fn().mockResolvedValue({
    hash: '0xremovehash',
    status: 'success'
  }),
  getUserPositions: vi.fn().mockResolvedValue([
    {
      poolId: 'gala-usdc',
      lpTokens: '25.0',
      token0Amount: '500.0',
      token1Amount: '25.0'
    }
  ])
}));

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('Pool Flow - Integration Tests', () => {
  beforeEach(() => {
    mockWalletProvider.isConnected = true;
  });

  describe('Add Liquidity Flow', () => {
    it('should complete full add liquidity process', async () => {
      render(<AppWrapper />);
      
      // Navigate to pools
      fireEvent.click(screen.getByText('Pool'));
      
      // Select pool and add liquidity
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Liquidity'));
      });
      
      // Enter amounts
      await waitFor(() => {
        const galaInput = screen.getByTestId('gala-input');
        const usdcInput = screen.getByTestId('usdc-input');
        
        fireEvent.change(galaInput, { target: { value: '100' } });
        fireEvent.change(usdcInput, { target: { value: '5' } });
      });
      
      // Review and confirm
      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm Add Liquidity');
        fireEvent.click(confirmButton);
      });
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText('Liquidity Added Successfully!')).toBeInTheDocument();
        expect(screen.getByText('LP Tokens: 50.0')).toBeInTheDocument();
      });
    });

    it('should handle proportional amount calculation', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Liquidity'));
      });
      
      await waitFor(() => {
        const galaInput = screen.getByTestId('gala-input');
        fireEvent.change(galaInput, { target: { value: '200' } });
        
        // Should auto-calculate USDC amount based on pool ratio
        const usdcInput = screen.getByTestId('usdc-input');
        expect(parseFloat(usdcInput.value)).toBeGreaterThan(0);
      });
    });
  });

  describe('Remove Liquidity Flow', () => {
    it('should complete remove liquidity process', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      fireEvent.click(screen.getByText('Your Positions'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Remove'));
      });
      
      // Set removal percentage
      await waitFor(() => {
        const slider = screen.getByTestId('removal-slider');
        fireEvent.change(slider, { target: { value: '50' } });
      });
      
      // Confirm removal
      const removeButton = screen.getByText('Remove Liquidity');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Liquidity Removed Successfully!')).toBeInTheDocument();
      });
    });

    it('should show preview of tokens to receive', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      fireEvent.click(screen.getByText('Your Positions'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Remove'));
      });
      
      await waitFor(() => {
        const slider = screen.getByTestId('removal-slider');
        fireEvent.change(slider, { target: { value: '25' } });
        
        // Should show preview of tokens to receive
        expect(screen.getByText('You will receive:')).toBeInTheDocument();
        expect(screen.getByTestId('gala-receive-amount')).toBeInTheDocument();
        expect(screen.getByTestId('usdc-receive-amount')).toBeInTheDocument();
      });
    });
  });

  describe('Pool Creation Flow', () => {
    it('should create new pool successfully', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      fireEvent.click(screen.getByText('Create Pool'));
      
      await waitFor(() => {
        // Select tokens
        fireEvent.click(screen.getByTestId('token0-selector'));
        fireEvent.click(screen.getByText('GALA'));
        
        fireEvent.click(screen.getByTestId('token1-selector'));
        fireEvent.click(screen.getByText('USDC'));
        
        // Set fee tier
        fireEvent.click(screen.getByText('0.3%'));
        
        // Set initial amounts
        const token0Input = screen.getByTestId('token0-amount');
        const token1Input = screen.getByTestId('token1-amount');
        
        fireEvent.change(token0Input, { target: { value: '1000' } });
        fireEvent.change(token1Input, { target: { value: '50' } });
      });
      
      // Create pool
      const createButton = screen.getByText('Create Pool');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Pool Created Successfully!')).toBeInTheDocument();
      });
    });

    it('should validate token selection for pool creation', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      fireEvent.click(screen.getByText('Create Pool'));
      
      await waitFor(() => {
        // Try to create without selecting tokens
        const createButton = screen.getByText('Create Pool');
        expect(createButton).toBeDisabled();
        
        // Select same token for both sides
        fireEvent.click(screen.getByTestId('token0-selector'));
        fireEvent.click(screen.getByText('GALA'));
        
        fireEvent.click(screen.getByTestId('token1-selector'));
        fireEvent.click(screen.getByText('GALA'));
        
        // Should show error
        expect(screen.getByText('Cannot create pool with same tokens')).toBeInTheDocument();
      });
    });
  });

  describe('Pool Analytics', () => {
    it('should display pool statistics correctly', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        // Check pool statistics are displayed
        expect(screen.getByText('TVL: $150,000')).toBeInTheDocument();
        expect(screen.getByText('24h Volume: $25,000')).toBeInTheDocument();
        expect(screen.getByText('APR: 12.5%')).toBeInTheDocument();
      });
    });

    it('should sort pools by different metrics', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        // Sort by TVL
        fireEvent.click(screen.getByText('TVL'));
        
        // Verify sorting
        const poolElements = screen.getAllByTestId('pool-item');
        expect(poolElements[0]).toHaveTextContent('$150,000');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient balance for adding liquidity', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Liquidity'));
      });
      
      await waitFor(() => {
        const galaInput = screen.getByTestId('gala-input');
        fireEvent.change(galaInput, { target: { value: '10000000' } });
        
        expect(screen.getByText('Insufficient GALA Balance')).toBeInTheDocument();
      });
    });

    it('should handle failed liquidity addition', async () => {
      vi.mocked(require('@/services/poolService').addLiquidity)
        .mockRejectedValueOnce(new Error('Add liquidity failed'));
      
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Liquidity'));
      });
      
      await waitFor(() => {
        const galaInput = screen.getByTestId('gala-input');
        const usdcInput = screen.getByTestId('usdc-input');
        
        fireEvent.change(galaInput, { target: { value: '10' } });
        fireEvent.change(usdcInput, { target: { value: '0.5' } });
        
        fireEvent.click(screen.getByText('Add'));
      });
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Confirm Add Liquidity'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Add Liquidity')).toBeInTheDocument();
      });
    });
  });
});