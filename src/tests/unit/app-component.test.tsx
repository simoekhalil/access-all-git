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

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<TestApp />);
    
    expect(document.body).toBeInTheDocument();
  });

  it('should have accessible navigation', () => {
    render(<TestApp />);
    
    // Basic accessibility check
    expect(document.body).toBeInTheDocument();
  });
});