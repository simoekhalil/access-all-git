import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Web3 and wallet connections
global.ethereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

// Mock window.location for routing tests
delete (window as any).location;
window.location = { ...window.location, assign: vi.fn() };

// Setup and cleanup for each test
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
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