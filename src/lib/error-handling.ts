import { useToast } from '@/hooks/use-toast';
import * as Sentry from '@sentry/react';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

type ErrorContext = {
  message: string;
  component: string;
  severity: ErrorSeverity;
  error?: Error;
  context?: Record<string, unknown>;
};

export abstract class ErrorReportingService {
  static captureError(errorContext: ErrorContext) {
    this.report(errorContext);
  }

  // Remove duplicate ErrorSeverity type (lines 3 & 18)
  // Update error reporting service implementation
  private static report(errorContext: ErrorContext) {
    if (process.env.NODE_ENV === 'production') {
      // Add actual error reporting service integration
      Sentry?.captureException(errorContext.error, {
        contexts: { error: errorContext },
      });
    }
    console.error('[Error Reporting Service]', errorContext);
  }
}

interface ErrorLogEntry {
  message: string;
  component: string;
  timestamp: string;
  severity: ErrorSeverity;
  stack?: string;
  context?: Record<string, unknown>;
  filename?: string;
}

const errorLog: ErrorLogEntry[] = [];

import { logger } from './logger';

interface LoggerStrategy {
  log(entry: ErrorLogEntry): void;
}

class MemoryLogger implements LoggerStrategy {
  private logEntries: ErrorLogEntry[] = [];

  log(entry: ErrorLogEntry): void {
    this.logEntries.push(entry);
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logEntries];
  }

  clear(): void {
    this.logEntries = [];
  }
}
// Declare FileLogger as a class with the LoggerStrategy interface
let FileLogger: unknown = null;

export const logError = ({
  message,
  component,
  severity = 'medium',
  error,
  context = {},
  filename,
}: {
  message: string;
  component: string;
  severity?: ErrorSeverity;
  error?: Error;
  context?: Record<string, unknown>;
  filename?: string;
}) => {
  logger.debug('logError: Logging error', {
    message,
    component,
    severity,
    error,
    context,
  });

  const entry: ErrorLogEntry = {
    message,
    component,
    timestamp: new Date().toISOString(),
    severity,
    stack: error?.stack,
    context,
    filename,
  };

  // Use configured logger strategy (default to memory)
  let loggerStrategy: LoggerStrategy;

  if (process.env.LOGGER_STRATEGY === 'file' && typeof window === 'undefined') {
    if (!FileLogger) {
      FileLogger = class implements LoggerStrategy {
        private logFilePath: string;

        constructor(logFilePath: string) {
          this.logFilePath = logFilePath;
        }

        log(entry: ErrorLogEntry): void {
          const fs = require('fs');
          const logString = JSON.stringify(entry) + '\n';
          fs.appendFileSync(this.logFilePath, logString, { encoding: 'utf8' });
        }
      };
    }
    loggerStrategy = new (FileLogger as new (
      logFilePath: string,
    ) => LoggerStrategy)(process.env.LOG_FILE_PATH || './error.log');
  } else {
    loggerStrategy = new MemoryLogger();
  }

  loggerStrategy.log(entry);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${component}] ${message}`, { error, context });
  }

  // Show user-friendly toast notification
  try {
    const { toast } = useToast(); // Use the hook to get the toast function
    toast({
      title: 'Error',
      description: message,
    });
  } catch (e) {
    console.error('Error calling toast:', e);
  }

  // In production, could send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Error reporting service integration
    ErrorReportingService.captureError({
      message,
      component,
      severity,
      error,
      context,
    });
    // e.g., Sentry, LogRocket, etc.
  }
  logger.debug('logError: Error logged successfully');
};

export const getErrorLog = () => errorLog;

export const clearErrorLog = () => {
  errorLog.length = 0;
};
