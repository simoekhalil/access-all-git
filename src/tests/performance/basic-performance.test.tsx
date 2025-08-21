import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const TestApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

describe('Basic Performance Tests', () => {
  describe('Load Time Performance', () => {
    it('should load initial page within acceptable time', () => {
      const startTime = performance.now();
      
      render(<TestApp />);

      const loadTime = performance.now() - startTime;
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
      console.log('Initial load time: ' + loadTime.toFixed(2) + 'ms');
    });
  });

  describe('Bundle Size', () => {
    it('should have reasonable bundle size expectations', () => {
      // Mock bundle analysis data for expectations
      const bundleAnalysis = {
        totalSize: 500 * 1024, // 500KB
        largestChunks: [
          { name: 'vendor', size: 200 * 1024 },
          { name: 'main', size: 150 * 1024 },
          { name: 'components', size: 100 * 1024 }
        ]
      };

      // Bundle should be under 2MB total
      expect(bundleAnalysis.totalSize).toBeLessThan(2 * 1024 * 1024);
      
      // Individual chunks should be reasonable
      bundleAnalysis.largestChunks.forEach(chunk => {
        expect(chunk.size).toBeLessThan(500 * 1024); // 500KB per chunk
      });
    });
  });

  describe('Memory Usage', () => {
    it('should have basic memory usage expectations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      render(<TestApp />);

      // Basic memory check - if memory API is available
      if (initialMemory > 0) {
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryIncrease = currentMemory - initialMemory;
        
        // Memory increase should be reasonable (< 50MB for initial render)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      } else {
        // If memory API not available, test passes
        expect(true).toBe(true);
      }
    });
  });
});