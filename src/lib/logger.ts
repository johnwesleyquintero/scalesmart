// src/lib/logger.ts

/**
 * @module Logger
 * @description Centralized logging utility for consistent and debug-friendly output.
 * Provides different log levels (info, warn, error, debug) with timestamps and structured metadata.
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogMetadata {
  [key: string]: unknown;
}

/**
 * Logger class for structured and level-based logging.
 * This class provides a consistent interface for logging throughout the application,
 * making it easier to manage, filter, and analyze logs during debugging and monitoring.
 */
class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
    // Configure the minimum log level based on the environment.
    // In development, log all messages (DEBUG and above). In production, log INFO and above.
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.minLevel = LogLevel.DEBUG;
    }
  }

  /**
   * Determines if a message at the given level should be logged based on the configured minimum level.
   * @param level - The log level of the message.
   * @returns True if the message should be logged, false otherwise.
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Formats the log message with a timestamp and optional metadata.
   * @param level - The log level.
   * @param message - The main log message.
   * @param metadata - Optional object containing additional contextual data.
   * @returns The formatted log string.
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
  ): string {
    const timestamp = new Date().toISOString();
    // Convert metadata to a JSON string for structured logging.
    const metaString = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  /**
   * Logs debug messages. Detailed information useful during development and debugging.
   * These logs are typically enabled only in development environments.
   * @param message - The main log message.
   * @param metadata - Optional object containing additional contextual data.
   */
  debug(message: string, metadata?: LogMetadata) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, metadata));
    }
  }

  /**
   * Logs informational messages. Useful for tracking application flow and significant events.
   * @param message - The main log message.
   * @param metadata - Optional object containing additional contextual data.
   */
  info(message: string, metadata?: LogMetadata) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, metadata));
    }
  }

  /**
   * Logs warning messages. Indicates potential issues or non-critical problems that should be reviewed.
   * @param message - The main log message.
   * @param metadata - Optional object containing additional contextual data.
   */
  warn(message: string, metadata?: LogMetadata) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, metadata));
    }
  }

  /**
   * Logs error messages. For critical issues that prevent normal operation or indicate a failure.
   * Includes optional error object for stack traces and can be integrated with external monitoring services.
   * @param message - The main log message.
   * @param metadata - Optional object containing additional contextual data, often including error details.
   */
  error(message: string, metadata?: LogMetadata) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, metadata));
      // In a production environment, you might send errors to an external monitoring service here.
      // e.g., Sentry.captureException(new Error(message), { extra: metadata });
    }
  }
}

// Export a singleton instance of the Logger for consistent use across the application.
export const logger = new Logger();
