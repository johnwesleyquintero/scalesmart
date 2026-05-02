import { logger } from './logger'; // Import the logger utility

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: unknown,
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

// Define a type for errors that might have a 'code' property
interface CustomError extends Error {
  code?: string;
}

export function handleApiError(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    // Log the error for debugging and monitoring
    logger.error(`API Error: ${error.message}`, error);
    // Safely access the 'code' property if it exists
    const errorCode = (error as CustomError).code;
    return createErrorResponse(error.message, errorCode);
  }
  
  // Handle non-Error objects
  const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
  logger.error('An unexpected API error occurred:', error);
  return createErrorResponse(errorMessage || 'An unexpected error occurred.');
}
