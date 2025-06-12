import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { logger } from './logger'; // Assuming logger is a configured pino or similar instance

// --- Constants and Configuration ---

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Log a critical error early if env vars are missing
  logger.error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  // In a production app, you might want to crash the process or have a health check fail here.
  // For this refactoring exercise, we proceed but log the issue.
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_KEY_TABLE = 'api_keys'; // Supabase table name for API keys

// Ensure the Supabase service role key is stored securely in an environment variable.
const KEY_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

// Configuration for key generation and hashing
const CRYPTO_CONFIG = {
  keyLengthBytes: 32, // 256-bit entropy for the raw key
  keyEncoding: 'hex' as const, // Encoding for the plain text key
  hashRounds: 12, // BCrypt cost factor - adjust based on server performance vs. security needs
};

// --- Types ---

// Defines the structure of the API key record stored in the database
type ApiKeyRecord = {
  id?: string; // Supabase row ID
  key: string; // This will store the HASHED key
  created_at: string; // ISO string timestamp from Supabase
  expires_at: string; // ISO string timestamp
  is_active: boolean;
  user_id: string; // Ensure this matches your Supabase column name
};

// --- Helper Functions ---

/**
 * Validates if a string is a valid UUID format (v4 expected)
 * This is a client-side validation helper before database interaction.
 * @param userId The string to validate.
 * @returns True if the string matches a UUID format, false otherwise.
 */
export function isValidUserIdFormat(userId: string): boolean {
  // Using a regex for UUID v4 format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = typeof userId === 'string' && uuidRegex.test(userId);
  if (!isValid) {
    logger.warn('Invalid userId format detected', { userId });
  }
  return isValid;
}

// --- Core API Key Management Functions ---

/**
 * Generates a new cryptographically secure API key (plain text).
 * Uses node:crypto for randomness.
 * @returns A promise resolving to the plain text API key string.
 */
export async function generateApiKey(): Promise<string> {
  // 256-bit entropy (32 bytes) provides sufficient uniqueness and strength
  return crypto
    .randomBytes(CRYPTO_CONFIG.keyLengthBytes)
    .toString(CRYPTO_CONFIG.keyEncoding);
}

/**
 * Validates a plain text API key against the stored hash in the database for a specific user.
 * Checks for existence, activity status, expiration, and performs bcrypt comparison.
 * @param plainKey The plain text API key provided by the user.
 * @param userId The ID of the user the key belongs to.
 * @returns A promise resolving to true if the key is valid and active, false otherwise.
 */
export async function validateApiKey(
  plainKey: string,
  userId: string,
): Promise<boolean> {
  // Pre-check userId format immediately
  if (!isValidUserIdFormat(userId)) {
    logger.warn('validateApiKey: Invalid userId format', { userId });
    return false;
  }

  try {
    // Fetch the active, non-expired key record for the user
    const { data: apiKeyRecord, error: dbError } = await supabase
      .from(API_KEY_TABLE)
      // Select only the 'key' (hashed value) column for performance and security
      .select('key')
      .eq('user_id', userId) // Ensure column name matches Supabase schema
      .eq('is_active', true) // Ensure column name matches Supabase schema
      .gt('expires_at', new Date().toISOString()) // Ensure column name matches Supabase schema
      .maybeSingle(); // Use maybeSingle as the record might not exist

    if (dbError) {
      // Log database errors clearly
      logger.error('validateApiKey: Database error fetching key', {
        userId,
        error: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
      });
      // Do not expose database error details to the caller
      return false;
    }

    if (!apiKeyRecord) {
      // Log when no active key is found for the user (could be expired, inactive, or never existed)
      logger.warn('validateApiKey: No active, valid API key found for user', {
        userId,
      });
      return false;
    }

    // Perform the secure comparison of the plain text key against the stored hash
    const isValid = await bcrypt.compare(plainKey, apiKeyRecord.key);

    if (!isValid) {
      // Log when the plain key does not match the stored hash
      logger.warn('validateApiKey: API key mismatch (invalid key)', {
        userId,
        // Avoid logging the plain key itself!
      });
    } else {
      logger.info('validateApiKey: API key validated successfully', { userId });
    }

    return isValid;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    // Catch-all for unexpected errors during validation (e.g., bcrypt failure)
    logger.error('validateApiKey: Unexpected error during validation', {
      userId,
      error: err.message,
      stack: err.stack, // Include stack trace for debugging unexpected issues
    });
    return false;
  }
}

/**
 * Next.js Middleware function for API key validation.
 * Extracts key from 'x-api-key' header and userId from the request body.
 * IMPORTANT: Reading the request body in middleware consumes it, preventing the route handler
 * from reading it unless the body is cloned and re-passed or read again differently.
 * This implementation clones the request.
 * @param request The incoming NextRequest object.
 * @returns A NextResponse in case of validation failure (with appropriate status)
 *          or undefined to allow the request to proceed to the route handler.
 */
export async function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key'); // API key from header

  // Log request method and path for debugging
  logger.debug('apiKeyMiddleware: Processing request', {
    method: request.method,
    pathname: new URL(request.url).pathname,
    apiKeyPresent: !!apiKey, // Log presence, NOT the key itself
  });

  if (!apiKey) {
    logger.warn('apiKeyMiddleware: Missing x-api-key header');
    return NextResponse.json({ error: 'API key missing' }, { status: 401 });
  }

  let userId: string | undefined;
  let clonedRequest: Request;

  try {
    // Clone the request BEFORE reading the body
    clonedRequest = request.clone();
    const requestBody = await clonedRequest.json();
    // Assuming userId is a mandatory field in the request body for this middleware
    userId = requestBody.userId;

    if (!userId) {
      logger.warn('apiKeyMiddleware: Missing userId in request body');
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    // Validate userId format early
    if (!isValidUserIdFormat(userId)) {
      // isValidUserIdFormat already logs a warning inside
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 },
      );
    }

    // Validate the API key and user ID against the database
    const isValid = await validateApiKey(apiKey, userId);

    if (!isValid) {
      // validateApiKey logs specific reasons (no key found, mismatch)
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 },
      );
    }

    // If validation passes, log success and allow the request to proceed.
    logger.info('apiKeyMiddleware: API key validated successfully', { userId });
    return undefined; // Return undefined to continue to the route handler
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));

    // Check for specific common errors like JSON parsing failure
    if (err instanceof SyntaxError) {
      logger.warn('apiKeyMiddleware: Invalid JSON body', {
        error: err.message,
        userId: userId ?? 'unknown', // Log userId if captured before error
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Log other unexpected errors during the middleware execution
    logger.error('apiKeyMiddleware: Unexpected error', {
      userId: userId ?? 'unknown', // Log userId if captured
      error: err.message,
      stack: err.stack,
    });

    // Return a generic internal server error for security and simplicity
    return NextResponse.json(
      { error: 'Internal server error during API key validation' },
      { status: 500 },
    );
  }
  // Note: If you need the request body or userId in the route handler,
  // you would need to pass it via headers, context, or re-parse it.
  // The current approach of cloning and discarding the clone after reading
  // means the original request body is still available for the route handler.
}

/**
 * Rotates API keys for a user. Deactivates all existing keys and creates a new one.
 * Provides the newly generated plain text key (to be returned to the user ONCE).
 * @param userId The ID of the user for whom to rotate keys.
 * @returns A promise resolving to an object containing the new database record (with hashed key)
 *          and the plain text key.
 * @throws An error if the rotation fails at any step.
 */
export async function rotateApiKeys(
  userId: string,
): Promise<{ record: ApiKeyRecord; plainKey: string }> {
  if (!isValidUserIdFormat(userId)) {
    // isValidUserIdFormat already logs a warning
    throw new Error('Failed to rotate API keys: Invalid userId format');
  }

  logger.info('rotateApiKeys: Starting key rotation for user', { userId });

  // Transaction-like behavior: although Supabase doesn't have full transactions
  // for UPDATE+INSERT across tables easily in client SDK, we handle errors.
  // If deactivation succeeds but insertion fails, the user just won't have an active key.
  // If deactivation fails, we don't proceed with insertion.

  try {
    // Step 1: Deactivate all existing keys for the user
    logger.debug('rotateApiKeys: Deactivating old keys', { userId });
    const { data: updateData, error: updateError } = await supabase
      .from(API_KEY_TABLE)
      .update({ is_active: false }) // Ensure column name matches Supabase schema
      .eq('user_id', userId) // Ensure column name matches Supabase schema
      .select('id'); // Select something to get a count or affected rows if needed

    if (updateError) {
      // Log specific database update error
      logger.error('rotateApiKeys: Database error deactivating old keys', {
        userId,
        error: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      throw new Error(
        `Failed to deactivate old API keys: ${updateError.message}`,
      );
    }
    logger.info(
      `rotateApiKeys: Deactivated ${updateData?.length ?? 0} old keys`,
      { userId },
    );

    // Step 2: Generate new plain text key
    const plainKey = await generateApiKey();

    // Step 3: Hash the new key for storage
    const hashedKey = await bcrypt.hash(plainKey, CRYPTO_CONFIG.hashRounds);

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + KEY_EXPIRATION_MS);

    // Prepare new key record for insertion
    const newKeyRecord: Omit<ApiKeyRecord, 'id'> = {
      key: hashedKey, // Store the hashed key
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      user_id: userId,
    };

    // Step 4: Store the new key record in the database
    logger.debug('rotateApiKeys: Inserting new key', { userId });
    const insertStartTime = Date.now();
    const { data: insertedRecord, error: insertError } = await supabase
      .from(API_KEY_TABLE)
      .insert([newKeyRecord]) // Supabase insert expects an array
      .select(); // Select the inserted record to get its ID and default values

    const insertDuration = Date.now() - insertStartTime;
    logger.debug(`rotateApiKeys: Database insert took ${insertDuration}ms`, {
      userId,
    });

    if (insertError) {
      // Log specific database insert error
      logger.error('rotateApiKeys: Database error inserting new key', {
        userId,
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        // Do NOT log the newKeyRecord object as it contains the hashed key
      });
      // Re-throwing allows calling code to handle the failure
      throw new Error(`Failed to insert new API key: ${insertError.message}`);
    }

    if (!insertedRecord || insertedRecord.length === 0) {
      // This case is unlikely with Supabase insert().select() but good for robustness
      logger.error(
        'rotateApiKeys: Insert operation succeeded but no record returned',
        { userId },
      );
      throw new Error('Failed to retrieve new API key record after insertion');
    }

    logger.info(
      'rotateApiKeys: Successfully generated and stored new API key',
      {
        userId,
        newKeyId: insertedRecord[0].id, // Log the ID of the new key
      },
    );

    // Return the full new record (with ID, timestamps from DB) and the plain text key
    return { record: insertedRecord[0], plainKey: plainKey };
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    // Catch-all for any errors during the rotation process
    logger.error('rotateApiKeys: Key rotation failed', {
      userId,
      error: err.message, // Log the error message
      stack: err.stack, // Include stack trace for unexpected errors
      // FIX for TS error: logger.error takes message, metadata?
    });
    // Re-throw a standardized error message
    throw new Error(`Failed to rotate API keys: ${err.message}`);
  }
}

/**
 * Initializes API key management for a user by creating the first key IF
 * no active key currently exists for them.
 * @param userId The ID of the user to initialize keys for.
 * @returns A promise resolving to the newly generated plain text key if a key was initialized,
 *          or null if an active key already existed.
 * @throws An error if initialization fails.
 */
export async function initializeApiKeys(
  userId: string,
): Promise<string | null> {
  if (!isValidUserIdFormat(userId)) {
    // isValidUserIdFormat already logs a warning
    throw new Error('Failed to initialize API keys: Invalid userId format');
  }

  logger.info('initializeApiKeys: Attempting initialization for user', {
    userId,
  });

  try {
    // Check if the user exists - potentially move this check higher up in calling code
    // if user existence is a pre-requisite for most API key operations.
    // Removing explicit 'users' table check here to simplify scope, assuming userId validity
    // and downstream Supabase errors will indicate non-existent users if necessary.

    // Check for any active key for the user
    const { data: existingKey, error: selectError } = await supabase
      .from(API_KEY_TABLE)
      .select('id') // Select minimal data
      .eq('user_id', userId) // Ensure column name matches Supabase schema
      .eq('is_active', true) // Ensure column name matches Supabase schema
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(); // Use maybeSingle - it's okay if no active key exists

    if (selectError) {
      // Log specific database select error
      logger.error(
        'initializeApiKeys: Database error checking for existing key',
        {
          userId,
          error: selectError.message,
          details: selectError.details,
          hint: selectError.hint,
        },
      );
      throw new Error(
        `Failed to check for existing API key: ${selectError.message}`,
      );
    }

    if (existingKey) {
      // If an active key already exists, do not initialize a new one.
      logger.info(
        'initializeApiKeys: User already has an active API key. No initialization needed.',
        { userId, existingKeyId: existingKey.id },
      );
      return null; // Indicate no new key was generated
    } else {
      // No active key found, proceed with rotation (which generates the first key)
      logger.info(
        'initializeApiKeys: No active key found. Rotating to create initial key.',
        { userId },
      );
      // Use rotateApiKeys to generate, hash, and store the first key
      const { plainKey } = await rotateApiKeys(userId);
      logger.info(
        'initializeApiKeys: Initial API key generated successfully.',
        {
          userId,
        },
      );
      return plainKey; // Return the newly generated plain key to the user
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    // Catch-all for errors during initialization process
    logger.error('initializeApiKeys: Initialization failed', {
      userId,
      error: err.message, // Log the error message
      stack: err.stack, // Include stack trace
    });
    // Re-throw the error for the caller to handle
    throw new Error(`Failed to initialize API keys: ${err.message}`);
  }
}

/**
 * Gets the active API key record for a user (returns the stored record with hashed key).
 * This function is primarily for internal use (e.g., administrative tasks)
 * and should NOT expose the plain text key.
 * @param userId The ID of the user.
 * @returns A promise resolving to the ApiKeyRecord if an active key exists, otherwise undefined.
 */
export async function getApiKeyRecord(
  userId: string,
): Promise<ApiKeyRecord | undefined> {
  if (!isValidUserIdFormat(userId)) {
    // isValidUserIdFormat already logs a warning
    return undefined; // Return early for invalid input
  }

  logger.debug('getApiKeyRecord: Fetching active key record', { userId });
  const startTime = Date.now();

  try {
    const { data: apiKeyRecord, error: dbError } = await supabase
      .from(API_KEY_TABLE)
      // Select necessary columns, exclude sensitive data if possible (though 'key' is hashed)
      .select('id, key, created_at, expires_at, is_active, user_id')
      .eq('user_id', userId) // Ensure column name matches Supabase schema
      .eq('is_active', true) // Ensure column name matches Supabase schema
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(); // Use maybeSingle as the record might not exist

    const duration = Date.now() - startTime;
    logger.debug(`getApiKeyRecord: Database query completed in ${duration}ms`, {
      userId,
    });

    if (dbError) {
      // Log specific database error
      logger.error('getApiKeyRecord: Database error fetching record', {
        userId,
        error: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
      });
      // Do not return dbError details, just log and return undefined or throw
      // Decided to throw here as fetching the record is a core operation that failed.
      throw new Error(`Failed to fetch API key record: ${dbError.message}`);
    }

    if (!apiKeyRecord) {
      logger.debug('getApiKeyRecord: No active, valid key record found', {
        userId,
      });
    } else {
      logger.debug('getApiKeyRecord: Active key record found', {
        userId,
        keyId: apiKeyRecord.id,
      });
    }

    // Return the record if found, otherwise undefined
    return apiKeyRecord ?? undefined;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    // Catch-all for unexpected errors during fetching
    logger.error('getApiKeyRecord: Unexpected error', {
      userId,
      error: err.message,
      stack: err.stack,
    });
    // Return undefined or re-throw based on how the caller is expected to handle failure
    // Returning undefined is more common for 'get' functions when item is not found or fetch fails.
    return undefined;
  }
}

/**
 * Deletes ALL API keys (active and inactive) for a specific user. Use with extreme caution.
 * @param userId The ID of the user whose keys should be deleted.
 * @throws An error if the deletion fails.
 */
export async function deleteApiKeysForUser(userId: string): Promise<void> {
  if (!isValidUserIdFormat(userId)) {
    // isValidUserIdFormat already logs a warning
    throw new Error('Failed to delete API keys: Invalid userId format');
  }

  logger.warn('deleteApiKeysForUser: Attempting to delete all keys for user', {
    userId,
  }); // Use warn level due to destructive nature

  try {
    const { error: dbError } = await supabase
      .from(API_KEY_TABLE)
      .delete()
      .eq('user_id', userId); // Ensure column name matches Supabase schema
    // Supabase delete() does not return data by default

    if (dbError) {
      // Log specific database delete error
      logger.error('deleteApiKeysForUser: Database error during deletion', {
        userId,
        error: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
      });
      throw new Error(`Failed to delete API keys: ${dbError.message}`);
    }

    logger.info(
      'deleteApiKeysForUser: Successfully deleted all keys for user',
      {
        userId,
      },
    );
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    // Catch-all for unexpected errors during deletion
    logger.error('deleteApiKeysForUser: Unexpected error', {
      userId,
      error: err.message,
      stack: err.stack,
    });
    // Re-throw with a descriptive message
    throw new Error(
      `Failed to delete API keys for user ${userId}: ${err.message}`,
    );
  }
}
