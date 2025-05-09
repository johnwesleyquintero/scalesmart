import { toast } from '@/hooks/use-toast';
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
}

const errorLog: ErrorLogEntry[] = [];

export const logError = ({
  message,
  component,
  severity = 'medium',
  error,
  context = {},
}: {
  message: string;
  component: string;
  severity?: ErrorSeverity;
  error?: Error;
  context?: Record<string, unknown>;
}) => {
  const entry: ErrorLogEntry = {
    message,
    component,
    timestamp: new Date().toISOString(),
    severity,
    stack: error?.stack,
    context,
  };

  errorLog.push(entry);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${component}] ${message}`, { error, context });
  }

  // Show user-friendly toast notification
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });

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
};

export const getErrorLog = () => errorLog;

export const clearErrorLog = () => {
  errorLog.length = 0;
};
