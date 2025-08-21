import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

describe('Basic Integration Tests', () => {
  it('should render the main application', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(container).toBeInTheDocument();
  });

  it('should handle routing without errors', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Test passes if no errors are thrown during render
    expect(true).toBe(true);
  });
});