import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe
expect.extend(toHaveNoViolations);

// Mock Web3 and wallet connections
Object.defineProperty(window, 'ethereum', {
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    isMetaMask: true,
  },
  writable: true,
});

// Also set global.ethereum for compatibility
global.ethereum = window.ethereum;

// Mock window.location for routing tests
Object.defineProperty(window, 'location', {
  value: { ...window.location, assign: vi.fn() },
  writable: true,
});

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView for radix-ui components
Element.prototype.scrollIntoView = vi.fn();

// Mock HTMLElement.prototype.hasPointerCapture
HTMLElement.prototype.hasPointerCapture = vi.fn();
HTMLElement.prototype.setPointerCapture = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();

// Mock services
vi.mock('@/services/swapService', () => ({
  getQuote: vi.fn(),
  executeSwap: vi.fn(),
}));

vi.mock('@/services/poolService', () => ({
  getPools: vi.fn(),
  addLiquidity: vi.fn(),
  removeLiquidity: vi.fn(),
}));

// Mock components that don't exist yet
vi.mock('@/components/SwapComponent', () => ({
  default: () => 'SwapComponent'
}));

vi.mock('@/components/PoolComponent', () => ({
  default: () => 'PoolComponent'
}));

// Setup and cleanup for each test
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset window.ethereum to default mock state
  (window.ethereum.request as any).mockReset?.();
  (window.ethereum.on as any).mockReset?.();
  (window.ethereum.removeListener as any).mockReset?.();
});

afterEach(() => {
  // Cleanup DOM after each test
  cleanup();
});

beforeAll(() => {
  // Global test setup
  console.log('Starting Gala Swap comprehensive tests...');
});

afterAll(() => {
  // Global test cleanup
  console.log('Completed Gala Swap comprehensive tests');
});