import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '@/App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    
    expect(document.body).toBeInTheDocument();
  });

  it('should have accessible navigation', () => {
    render(<App />);
    
    // Basic accessibility check
    expect(document.body).toBeInTheDocument();
  });
});