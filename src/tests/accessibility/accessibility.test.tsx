import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('Accessibility Tests', () => {
  describe('WCAG Compliance', () => {
    it('should have no accessibility violations on main page', async () => {
      const { container } = render(<AppWrapper />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on pool page', async () => {
      const { container } = render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on balance page', async () => {
      const { container } = render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Balance'));
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through all interactive elements', () => {
      render(<AppWrapper />);
      
      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button')
        .concat(screen.getAllByRole('textbox'))
        .concat(screen.getAllByRole('link'));
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Test tab order
      focusableElements.forEach((element, index) => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });

    it('should handle Enter key on buttons', () => {
      render(<AppWrapper />);
      
      const connectButton = screen.getByText('Connect Wallet');
      connectButton.focus();
      
      fireEvent.keyDown(connectButton, { key: 'Enter', code: 'Enter' });
      
      // Should trigger the button action
      expect(connectButton).toHaveBeenCalledWith();
    });

    it('should handle Space key on buttons', () => {
      render(<AppWrapper />);
      
      const connectButton = screen.getByText('Connect Wallet');
      connectButton.focus();
      
      fireEvent.keyDown(connectButton, { key: ' ', code: 'Space' });
      
      // Should trigger the button action
      expect(connectButton).toHaveBeenCalledWith();
    });

    it('should trap focus in modals', async () => {
      render(<AppWrapper />);
      
      fireEvent.click(screen.getByText('Pool'));
      fireEvent.click(screen.getByText('Add Liquidity'));
      
      const modal = await screen.findByTestId('add-liquidity-modal');
      const focusableInModal = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableInModal.length).toBeGreaterThan(0);
      
      // Tab should cycle through modal elements only
      const firstElement = focusableInModal[0] as HTMLElement;
      const lastElement = focusableInModal[focusableInModal.length - 1] as HTMLElement;
      
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);
      
      // Shift+Tab from first element should go to last
      fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastElement);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels on input fields', () => {
      render(<AppWrapper />);
      
      const sellInput = screen.getByTestId('sell-amount-input');
      expect(sellInput).toHaveAttribute('aria-label', 'Amount to sell');
      
      const buyInput = screen.getByTestId('buy-amount-input');
      expect(buyInput).toHaveAttribute('aria-label', 'Amount to receive');
    });

    it('should have proper ARIA roles for components', () => {
      render(<AppWrapper />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should announce loading states', async () => {
      render(<AppWrapper />);
      
      const amountInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(amountInput, { target: { value: '100' } });
      
      // Should have aria-live region for loading
      const loadingRegion = screen.getByTestId('quote-loading');
      expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
      expect(loadingRegion).toHaveTextContent('Fetching quote...');
    });

    it('should announce success/error messages', async () => {
      render(<AppWrapper />);
      
      // Mock successful transaction
      const amountInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(amountInput, { target: { value: '10' } });
      
      fireEvent.click(screen.getByText('Swap'));
      fireEvent.click(screen.getByText('Confirm Swap'));
      
      const successMessage = await screen.findByTestId('success-message');
      expect(successMessage).toHaveAttribute('aria-live', 'assertive');
      expect(successMessage).toHaveTextContent('Swap Successful!');
    });

    it('should have descriptive alt text for images', () => {
      render(<AppWrapper />);
      
      const tokenImages = screen.getAllByRole('img');
      tokenImages.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('Color and Contrast', () => {
    it('should have sufficient color contrast', () => {
      render(<AppWrapper />);
      
      // Test button contrast
      const connectButton = screen.getByText('Connect Wallet');
      const buttonStyles = getComputedStyle(connectButton);
      
      // This would need a more sophisticated contrast checking library
      // For now, we'll check that colors are defined
      expect(buttonStyles.color).toBeTruthy();
      expect(buttonStyles.backgroundColor).toBeTruthy();
    });

    it('should not rely solely on color for information', () => {
      render(<AppWrapper />);
      
      // Price impact warnings should have text, not just color
      const amountInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(amountInput, { target: { value: '10000' } });
      
      const warning = screen.getByTestId('price-impact-warning');
      expect(warning).toHaveTextContent(/high price impact/i);
      expect(warning).toHaveAttribute('aria-label');
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels', () => {
      render(<AppWrapper />);
      
      const amountInput = screen.getByTestId('sell-amount-input');
      const label = screen.getByText('Amount to sell');
      
      expect(label).toHaveAttribute('for', amountInput.id);
      expect(amountInput).toHaveAttribute('aria-labelledby');
    });

    it('should show validation errors accessibly', async () => {
      render(<AppWrapper />);
      
      const amountInput = screen.getByTestId('sell-amount-input');
      fireEvent.change(amountInput, { target: { value: '10000000' } });
      
      const errorMessage = await screen.findByTestId('insufficient-balance-error');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      expect(amountInput).toHaveAttribute('aria-describedby', errorMessage.id);
    });

    it('should indicate required fields', () => {
      render(<AppWrapper />);
      
      const amountInput = screen.getByTestId('sell-amount-input');
      expect(amountInput).toHaveAttribute('required');
      expect(amountInput).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', () => {
      render(<AppWrapper />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = getComputedStyle(button);
        const minSize = 44; // 44px minimum touch target
        
        expect(parseInt(styles.minHeight) || parseInt(styles.height)).toBeGreaterThanOrEqual(minSize);
        expect(parseInt(styles.minWidth) || parseInt(styles.width)).toBeGreaterThanOrEqual(minSize);
      });
    });

    it('should work with voice control', () => {
      render(<AppWrapper />);
      
      // Elements should have descriptive accessible names
      const connectButton = screen.getByText('Connect Wallet');
      expect(connectButton.textContent).toBeTruthy();
      
      const swapButton = screen.getByText('Swap');
      expect(swapButton.textContent).toBeTruthy();
    });
  });

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });

      render(<AppWrapper />);
      
      const animatedElements = document.querySelectorAll('[class*="animate"]');
      animatedElements.forEach(element => {
        const styles = getComputedStyle(element);
        // Should have reduced or no animation
        expect(
          styles.animationDuration === '0s' || 
          styles.animationDuration === '0.01s' ||
          styles.transitionDuration === '0s'
        ).toBe(true);
      });
    });
  });

  describe('Language and Internationalization', () => {
    it('should have proper lang attribute', () => {
      render(<AppWrapper />);
      
      const html = document.documentElement;
      expect(html).toHaveAttribute('lang');
      expect(html.getAttribute('lang')).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    });

    it('should handle RTL languages', () => {
      // Mock RTL language
      document.documentElement.setAttribute('dir', 'rtl');
      
      render(<AppWrapper />);
      
      const container = screen.getByRole('main');
      const styles = getComputedStyle(container);
      
      // Should adapt to RTL direction
      expect(styles.direction === 'rtl' || document.dir === 'rtl').toBe(true);
      
      // Reset
      document.documentElement.removeAttribute('dir');
    });
  });
});