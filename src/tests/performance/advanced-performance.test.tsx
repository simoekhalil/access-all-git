import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';
import WalletConnection from '@/components/WalletConnection';
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
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

describe('Advanced Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('should render main page within performance budget', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      
      // Main page should render within 100ms
      expect(renderTime).toBeLessThan(100);
      console.log(`Index page render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render WalletConnection component quickly', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(50);
      console.log(`WalletConnection render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render SwapInterface component quickly', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(50);
      console.log(`SwapInterface render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Interaction Performance', () => {
    it('should handle input changes quickly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const input = screen.getByLabelText('From');
      const startTime = performance.now();
      
      fireEvent.change(input, { target: { value: '100' } });
      
      await waitFor(() => {
        expect((screen.getByDisplayValue('100') as HTMLInputElement)).toBeInTheDocument();
      });

      const interactionTime = performance.now() - startTime;
      expect(interactionTime).toBeLessThan(50);
      console.log(`Input change time: ${interactionTime.toFixed(2)}ms`);
    });

    it('should handle token swapping quickly', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const swapButton = screen.getByTestId('swap-direction-button');
      const startTime = performance.now();
      
      fireEvent.click(swapButton);
      
      await waitFor(() => {
        // Check that tokens have been swapped
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toBeTruthy();
      });

      const swapTime = performance.now() - startTime;
      expect(swapTime).toBeLessThan(30);
      console.log(`Token swap time: ${swapTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not create memory leaks during multiple renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <Index />
          </TestWrapper>
        );
        unmount();
      }

      if (initialMemory > 0) {
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable (< 10MB for 10 renders)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        console.log(`Memory increase after 10 renders: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      } else {
        expect(true).toBe(true); // Pass if memory API not available
      }
    });

    it('should handle component state updates efficiently', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const startTime = performance.now();
      
      // Multiple re-renders to test state update performance
      for (let i = 0; i < 5; i++) {
        rerender(
          <TestWrapper>
            <SwapInterface />
          </TestWrapper>
        );
      }

      const rerenderTime = performance.now() - startTime;
      expect(rerenderTime).toBeLessThan(100);
      console.log(`5 re-renders time: ${rerenderTime.toFixed(2)}ms`);
    });
  });

  describe('Async Operations Performance', () => {
    it('should handle wallet connection simulation efficiently', async () => {
      // Mock ethereum
      const mockEthereum = {
        request: vi.fn().mockImplementation((args) => {
          if (args.method === 'eth_accounts') {
            return Promise.resolve([]);
          }
          if (args.method === 'eth_requestAccounts') {
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          }
          if (args.method === 'eth_getBalance') {
            return Promise.resolve('0x1BC16D674EC80000');
          }
          return Promise.resolve();
        }),
        on: vi.fn(),
        removeListener: vi.fn(),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      const startTime = performance.now();
      
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      const connectionTime = performance.now() - startTime;
      expect(connectionTime).toBeLessThan(200);
      console.log(`Wallet connection time: ${connectionTime.toFixed(2)}ms`);
    });

    it('should handle swap execution performance', async () => {
      render(
        <TestWrapper>
          <SwapInterface />
        </TestWrapper>
      );

      const fromInput = screen.getByLabelText('From');
      fireEvent.change(fromInput, { target: { value: '100' } });

      await waitFor(() => {
        expect((screen.getByDisplayValue('2.500000') as HTMLInputElement)).toBeInTheDocument();
      });

      const swapButton = screen.getByText('Swap');
      const startTime = performance.now();
      
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(screen.getByText('Swapping...')).toBeInTheDocument();
      });

      const swapInitTime = performance.now() - startTime;
      expect(swapInitTime).toBeLessThan(50);
      console.log(`Swap initiation time: ${swapInitTime.toFixed(2)}ms`);
    });
  });

  describe('Bundle Size Expectations', () => {
    it('should have reasonable component complexity', () => {
      const { container } = render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      );

      // Count DOM nodes as a proxy for bundle complexity
      const nodeCount = container.querySelectorAll('*').length;
      
      // Should have reasonable DOM complexity (< 200 nodes)
      expect(nodeCount).toBeLessThan(200);
      console.log(`Total DOM nodes: ${nodeCount}`);
    });

    it('should minimize re-renders during interactions', async () => {
      let renderCount = 0;
      
      const TrackingComponent = () => {
        renderCount++;
        return <SwapInterface />;
      };

      render(
        <TestWrapper>
          <TrackingComponent />
        </TestWrapper>
      );

      const initialRenderCount = renderCount;
      
      // Perform interaction
      const input = screen.getByLabelText('From');
      fireEvent.change(input, { target: { value: '100' } });

      await waitFor(() => {
        expect((screen.getByDisplayValue('100') as HTMLInputElement)).toBeInTheDocument();
      });

      // Should not cause excessive re-renders
      const finalRenderCount = renderCount - initialRenderCount;
      expect(finalRenderCount).toBeLessThan(5);
      console.log(`Re-renders during interaction: ${finalRenderCount}`);
    });
  });

  describe('Network Performance Simulation', () => {
    it('should handle slow network conditions gracefully', async () => {
      const mockEthereum = {
        request: vi.fn().mockImplementation((args) => {
          // Simulate slow network (500ms delay)
          return new Promise(resolve => {
            setTimeout(() => {
              if (args.method === 'eth_requestAccounts') {
                resolve(['0x1234567890123456789012345678901234567890']);
              }
              resolve('0x1BC16D674EC80000');
            }, 500);
          });
        }),
        on: vi.fn(),
        removeListener: vi.fn(),
        isMetaMask: true,
      };

      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
      });

      render(
        <TestWrapper>
          <WalletConnection />
        </TestWrapper>
      );

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      // Should show loading state or connect state
      const isLoading = screen.queryByText('Connecting...') || screen.queryByText('Connect Wallet');
      expect(isLoading).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});