/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';

console.log('Running test setup...');

console.log('Checking if vi is defined:', typeof vi !== 'undefined');
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));
