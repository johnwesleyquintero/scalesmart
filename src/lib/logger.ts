// src/lib/logger.ts

/**
 * A simple logging utility for consistent application logging.
 * For a real application, this would be extended to integrate with a robust
 * logging solution (e.g., Winston, Pino) or a cloud-based logging service
 * (e.g., AWS CloudWatch, Google Cloud Logging, Azure Monitor) for centralized
 * log management, aggregation, and analysis. This would involve sending
 * log data over the network to the chosen service.
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
