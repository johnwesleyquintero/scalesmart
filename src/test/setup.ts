import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom/vitest';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));
