// src/app/auth/login-handler.ts

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handling';
import { validateLoginInput } from '@/lib/input-validation';
import { authenticateUser } from '@/lib/supabase/server';

/**
 * @module LoginHandler
 * @description Handles user login requests, focusing on security, robust error handling, and detailed logging for debugging.
 */

/**
 * Handles POST requests for user login.
 * This function is designed to be an API route handler (e.g., for Next.js API routes).
 *
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Unique request ID for tracing, useful for correlating logs across different services/functions.
  const requestId = crypto.randomUUID();
  logger.info(`[${requestId}] Login attempt initiated.`);

  try {
    // 1. Parse request body securely.
    // Ensure credentials are sent via POST body, not URL query parameters.
    const { email, password } = await request.json();
    logger.debug(`[${requestId}] Received login request for email: ${email}`);

    // 2. Input Validation: Early exit for invalid inputs.
    // This prevents unnecessary processing and provides clear error messages.
    const validationErrors = validateLoginInput(email, password);
    if (validationErrors.length > 0) {
      logger.warn(
        `[${requestId}] Invalid login input for email: ${email}. Errors: ${validationErrors.join(', ')}`,
      );
      // Return a generic error to the client for security reasons.
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 400 },
      );
    }

    // 3. User Authentication: Centralized authentication logic.
    // This function should handle interaction with your authentication provider (e.g., Supabase).
    const { user, error: authError } = await authenticateUser(email, password);

    if (authError) {
      // Log detailed authentication errors internally for debugging.
      logger.error(
        `[${requestId}] Authentication failed for email: ${email}. Error: ${authError.message}`,
        authError,
      );
      // Use a centralized error handler to process and potentially transform the error.
      const { status, message } = handleApiError(
        authError,
        'Authentication failed',
      );
      // Return a generic error to the client.
      return NextResponse.json({ message }, { status });
    }

    if (!user) {
      // This case should ideally be covered by authError, but as a safeguard.
      logger.error(
        `[${requestId}] Authentication returned no user and no error for email: ${email}. Unexpected state.`,
      );
      return NextResponse.json(
        { message: 'Authentication failed due to an unexpected error.' },
        { status: 500 },
      );
    }

    // 4. Successful Login: Log success and return appropriate response.
    logger.info(`[${requestId}] User successfully logged in: ${user.email}`);
    // In a real application, you would typically set a session cookie or return a token here.
    return NextResponse.json(
      { message: 'Login successful', user: { id: user.id, email: user.email } },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Use 'unknown' instead of 'any' for better type safety
    // 5. Catch-all Error Handling: For unexpected errors during request processing.
    // Log the full error stack for comprehensive debugging.
    // Ensure error is an instance of Error before accessing .message
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `[${requestId}] An unexpected error occurred during login: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage),
    );
    // Use a centralized error handler to provide a consistent error response.
    const { status, message } = handleApiError(
      error,
      'An unexpected error occurred during login.',
    );
    return NextResponse.json({ message }, { status });
  } finally {
    // Ensure final logging or cleanup actions are performed.
    logger.info(`[${requestId}] Login attempt finished.`);
  }
}
