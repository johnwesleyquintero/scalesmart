export const log = (message: string, ...args: unknown[]) => {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
};

export const warn = (message: string, ...args: unknown[]) => {
  console.warn(`[${new Date().toISOString()}] ${message}`, ...args);
};

export const error = (
  message: string,
  error?: Error | string,
  ...args: unknown[]
) => {
  console.error(`[${new Date().toISOString()}] ${message}`, error, ...args);
};

export const info = (message: string, ...args: unknown[]) => {
  console.info(`[${new Date().toISOString()}] ${message}`, ...args);
};
