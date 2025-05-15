export const log = (message: string, ...args: any[]) => {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
};

export const warn = (message: string, ...args: any[]) => {
  console.warn(`[${new Date().toISOString()}] ${message}`, ...args);
};

export const error = (message: string, ...args: any[]) => {
  console.error(`[${new Date().toISOString()}] ${message}`, ...args);
};

export const info = (message: string, ...args: any[]) => {
  console.info(`[${new Date().toISOString()}] ${message}`, ...args);
};
