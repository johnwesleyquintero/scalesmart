import { type LogLevel } from './types';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableMetrics: boolean;
  environment: string;
}

const defaultConfig: LoggerConfig = {
  minLevel: 'info',
  enableConsole: true,
  enableMetrics: true,
  environment: process.env.NODE_ENV || 'development',
};

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[this.config.minLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    if (this.config.enableConsole) {
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
      }
    }

    if (this.config.enableMetrics) {
      // Implement metrics collection here
      // Example: send to monitoring service
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger();
