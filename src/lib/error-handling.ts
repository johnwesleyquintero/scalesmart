import { toast } from '@/hooks/use-toast';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

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

  // In production, log to console for monitoring
  if (process.env.NODE_ENV === 'production') {
    console.error(`[PRODUCTION ERROR] [${component}] ${message}`, {
      error,
      context,
      severity,
    });
  }
};

export const getErrorLog = () => errorLog;

export const clearErrorLog = () => {
  errorLog.length = 0;
};

/**
 * Handles API errors by logging them and returning a standardized response structure.
 * This centralizes error handling for API routes, ensuring consistent error messages
 * and statuses for clients, while providing detailed internal logging for debugging.
 *
 * @param {unknown} error - The error object caught in a try-catch block.
 * @param {string} defaultMessage - A generic message to return to the client if the error is unexpected.
 * @param {number} defaultStatus - The default HTTP status code for the response.
 * @returns {{ status: number; message: string }} An object containing the HTTP status and a client-safe message.
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred.',
  defaultStatus: number = 500,
): { status: number; message: string } => {
  let status = defaultStatus;
  let message = defaultMessage;
  let component = 'API_HANDLER'; // Default component for API errors

  if (error instanceof Error) {
    // Log the detailed error internally for debugging
    logError({
      message: `API Error: ${error.message}`,
      component,
      severity: 'high',
      error: error,
      context: {
        stack: error.stack,
        name: error.name,
      },
    });

    // Customize client message based on error type if needed
    // For security, avoid exposing internal error details directly to the client.
    if (error.message.includes('Authentication failed')) {
      status = 401;
      message = 'Authentication failed. Please check your credentials.';
    } else if (error.message.includes('Validation failed')) {
      status = 400;
      message = 'Invalid input provided.';
    }
    // Add more specific error handling as needed
  } else {
    // Handle non-Error objects (e.g., strings, numbers, or unknown types)
    logError({
      message: `Unknown API Error: ${String(error)}`,
      component,
      severity: 'critical',
      context: { originalError: error },
    });
    message = 'An unknown error occurred.';
  }

  return { status, message };
};
