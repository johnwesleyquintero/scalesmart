import "@testing-library/jest-dom";
import "@testing-library/jest-dom/vitest";
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));