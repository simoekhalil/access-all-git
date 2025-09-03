import { describe, it, expect } from 'vitest';

describe('Simple Test Suite', () => {
  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should pass string test', () => {
    expect('hello').toBe('hello');
  });

  it('should fail intentionally', () => {
    expect(1 + 1).toBe(3); // This will fail
  });
});