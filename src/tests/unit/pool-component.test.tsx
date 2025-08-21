import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PoolComponent } from '@/components/PoolComponent';
import { mockPools, mockTokens } from '../mocks/wallet-mock';

vi.mock('@/hooks/usePools', () => ({
  usePools: () => ({
    pools: mockPools,
    loading: false,
    error: null
  })
}));

describe('PoolComponent - Unit Tests', () => {
  describe('Pool Display', () => {
    it('should render pool list correctly', () => {
      render(<PoolComponent />);
      
      expect(screen.getByText('Liquidity Pools')).toBeInTheDocument();
      expect(screen.getByText('GALA/USDC')).toBeInTheDocument();
    });

    it('should display pool statistics', () => {
      render(<PoolComponent />);
      
      expect(screen.getByText('TVL: $150,000')).toBeInTheDocument();
      expect(screen.getByText('24h Volume: $25,000')).toBeInTheDocument();
      expect(screen.getByText('APR: 12.5%')).toBeInTheDocument();
    });

    it('should show add liquidity button for each pool', () => {
      render(<PoolComponent />);
      
      const addLiquidityButtons = screen.getAllByText('Add Liquidity');
      expect(addLiquidityButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Add Liquidity Modal', () => {
    it('should open add liquidity modal when button clicked', async () => {
      render(<PoolComponent />);
      
      const addButton = screen.getByText('Add Liquidity');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add Liquidity to GALA/USDC')).toBeInTheDocument();
      });
    });

    it('should show both token inputs in add liquidity modal', async () => {
      render(<PoolComponent />);
      
      fireEvent.click(screen.getByText('Add Liquidity'));
      
      await waitFor(() => {
        expect(screen.getByTestId('gala-input')).toBeInTheDocument();
        expect(screen.getByTestId('usdc-input')).toBeInTheDocument();
      });
    });

    it('should calculate proportional amounts', async () => {
      render(<PoolComponent />);
      
      fireEvent.click(screen.getByText('Add Liquidity'));
      
      await waitFor(() => {
        const galaInput = screen.getByTestId('gala-input');
        fireEvent.change(galaInput, { target: { value: '100' } });
        
        const usdcInput = screen.getByTestId('usdc-input');
        expect(usdcInput.value).not.toBe('0');
      });
    });
  });

  describe('Remove Liquidity', () => {
    it('should show user liquidity positions', async () => {
      render(<PoolComponent />);
      
      const positionsTab = screen.getByText('Your Positions');
      fireEvent.click(positionsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-positions')).toBeInTheDocument();
      });
    });

    it('should allow removing liquidity', async () => {
      render(<PoolComponent />);
      
      fireEvent.click(screen.getByText('Your Positions'));
      
      await waitFor(() => {
        const removeButton = screen.getByText('Remove');
        fireEvent.click(removeButton);
        
        expect(screen.getByText('Remove Liquidity')).toBeInTheDocument();
      });
    });
  });

  describe('Pool Creation', () => {
    it('should show create pool button', () => {
      render(<PoolComponent />);
      
      expect(screen.getByText('Create Pool')).toBeInTheDocument();
    });

    it('should open create pool modal', async () => {
      render(<PoolComponent />);
      
      fireEvent.click(screen.getByText('Create Pool'));
      
      await waitFor(() => {
        expect(screen.getByText('Create New Pool')).toBeInTheDocument();
      });
    });

    it('should validate token selection for new pool', async () => {
      render(<PoolComponent />);
      
      fireEvent.click(screen.getByText('Create Pool'));
      
      await waitFor(() => {
        const createButton = screen.getByText('Create');
        expect(createButton).toBeDisabled();
      });
    });
  });
});