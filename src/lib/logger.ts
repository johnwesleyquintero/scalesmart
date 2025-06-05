/**
 * @module Logger
 * @description Centralized logging utility for consistent and debug-friendly output.
 * Provides different log levels (info, warn, error, debug) with timestamps.
 */

// Helper function to format log messages with a timestamp
const formatMessage = (message: string, ...args: unknown[]): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${message}`;
};

/**
 * Logger object with various logging levels.
 * This approach provides a single, consistent interface for logging throughout the application,
 * making it easier to manage and filter logs during debugging.
 */
export const logger = {
  /**
   * Logs informational messages. Useful for tracking application flow.
   * @param message - The main log message.
   * @param args - Additional data to log.
   */
  info: (message: string, ...args: unknown[]) => {
    console.info(formatMessage(message), ...args);
  },

  /**
   * Logs warning messages. Indicates potential issues that are not critical errors.
   * @param message - The main log message.
   * @param args - Additional data to log.
   */
  warn: (message: string, ...args: unknown[]) => {
    console.warn(formatMessage(message), ...args);
  },

  /**
   * Logs error messages. For critical issues that prevent normal operation.
   * Includes optional error object for stack traces.
   * @param message - The main log message.
   * @param error - The error object (e.g., an Error instance) or a string.
   * @param args - Additional data to log.
   */
  error: (message: string, error?: Error | string, ...args: unknown[]) => {
    console.error(formatMessage(message), error, ...args);
  },

  /**
   * Logs debug messages. Detailed information useful during development and debugging.
   * These logs are typically disabled in production.
   * @param message - The main log message.
   * @param args - Additional data to log.
   */
  debug: (message: string, ...args: unknown[]) => {
    // Only log debug messages in development environment
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage(message), ...args);
    }
  },
};
