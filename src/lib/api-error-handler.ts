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
    // Safely access the 'code' property if it exists
    const errorCode = (error as CustomError).code;
    return createErrorResponse(error.message, errorCode);
  }
  return createErrorResponse('An unexpected error occurred.');
}
