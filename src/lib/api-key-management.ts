import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { logger } from './logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
);

const API_KEY_TABLE = 'api_keys';

const KEY_EXPIRATION = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

// Key security enhancements
const CRYPTO_CONFIG = {
  keyLength: 32, // 256-bit entropy
  keyEncoding: 'hex' as const,
  hashRounds: 12, // BCrypt cost factor
};





const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

type ApiKeyRecord = {
  key: string; // This will store the HASHED key
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  userId: string;
};

// Supabase user type definition
interface User {
  id: string;
  // other user fields...
}

/**
 * Generates a new secure API key (plain text)
 */
export async function generateApiKey(): Promise<string> {
  // 256-bit entropy (32 bytes) provides sufficient uniqueness
  return crypto
    .randomBytes(CRYPTO_CONFIG.keyLength)
    .toString(CRYPTO_CONFIG.keyEncoding);
}

/**
 * Validates a plain text API key against the stored hash in MongoDB
 */
export async function validateApiKey(
  plainKey: string,
  userId: string,
): Promise<boolean> {
  // Outer try-catch for connection errors or unexpected issues
  try {
    try {
      const { data: apiKeyRecord, error } = await supabase
        .from(API_KEY_TABLE)
        .select()
        .eq('userId', userId)
        .eq('isActive', true)
        .gt('expiresAt', new Date().toISOString())
        .maybeSingle();
        
      if (error) throw error;

      if (!apiKeyRecord) {
        logger.warn('No active API key found for validation', { userId });
        return false;
      }

      // Compare the provided plain text key with the stored hash
      const isValid = await bcrypt.compare(plainKey, apiKeyRecord.key);
      if (!isValid) {
        logger.warn('API key validation failed: Mismatch', { userId });
      }
      return isValid;
    } catch (error: unknown) {
      logger.error('API Key Validation DB Error', {
        error: error instanceof Error ? error.message : 'UnknownError',
        userId,
        keySnippet: plainKey.slice(0, 4) + '***' + plainKey.slice(-4),
      });
      return false;
    }
  } catch (connectionError: unknown) {
    // Catch errors from connectToDatabase() or other issues outside the inner try
    logger.error('API Key Validation Connection/Setup Error', {
      error:
        connectionError instanceof Error
          ? connectionError.message
          : 'UnknownError',
      userId,
    });
    return false;
  }
}

/**
 * Middleware for API key validation
 */
export async function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key') || '';

  try {
    // Clone the request to allow reading the body here and in the route handler
    const clonedRequest = request.clone();
    const requestBody = await clonedRequest.json();
    const userId = requestBody.userId; // Assuming userId is present in the body

    if (!userId) {
      logger.warn('apiKeyMiddleware: Missing userId in request body');
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    // Basic validation for userId format before hitting the DB
    if (typeof userId !== 'string' || !isValidUserIdFormat(userId)) {
      logger.warn('apiKeyMiddleware: Invalid userId format in request body', {
        userId,
      });
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 },
      );
    }

    // Validate the API key (this involves bcrypt comparison)
    if (!(await validateApiKey(apiKey, userId))) {
      logger.warn('apiKeyMiddleware: Invalid or expired API key', { userId });
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 },
      );
    }

    // If validation passes, return undefined to allow the original request to proceed.
    logger.info('apiKeyMiddleware: API key validated successfully', { userId });
    return undefined;
  } catch (error) {
    logger.error('Error in apiKeyMiddleware', { error });
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }
    // Generic error for other issues
    return NextResponse.json(
      { error: 'Internal server error during API key validation' },
      { status: 500 }, // Use 500 for server errors
    );
  }
}

/**
 * Rotates API keys by generating a new one and deactivating old ones.
 * Returns the new ApiKeyRecord containing the *hashed* key, along with the *plain text* key.
 */
export async function rotateApiKeys(
  userId: string,
): Promise<{ record: ApiKeyRecord; plainKey: string }> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .maybeSingle();
    
if (error || !user) {
  throw new Error('User not found in Supabase');
}

  // if (!(await isWithinRateLimit(`rotate:${userId}`))) {
  //   // Use specific key for rotation rate limit
  //   throw new Error('Rate limit exceeded for API key rotation');
  // }


    try {
      // Deactivate all existing keys for the user
      const { count } = await supabase
        .from(API_KEY_TABLE)
        .update({ isActive: false })
        .eq('userId', userId)
        .eq('isActive', true);
      logger.info(
        `Deactivated ${count} old keys for user ${userId}`,
      );

    // Generate new plain text key
    const plainKey = await generateApiKey();
    // Hash the key for storage
    const hashedKey = await bcrypt.hash(plainKey, CRYPTO_CONFIG.hashRounds);

    const newKeyRecord: ApiKeyRecord = {
      key: hashedKey, // Store the hashed key
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KEY_EXPIRATION),
      isActive: true,
      userId: userId,
    };

    // Store the new key record in the database
      const { error } = await supabase
        .from(API_KEY_TABLE)
        .insert(newKeyRecord);
      
      if (error) throw error;
      
      logger.info(
        `Successfully generated and stored new API key for user ${userId}`,
      );

    // Return the record (with hashed key) AND the plain text key separately
    return { record: newKeyRecord, plainKey: plainKey };
  } catch (error: unknown) {
    const isMongoError =
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'MongoError';
    logger.error('KeyRotationFailed', {
      userId,
      error: error instanceof Error ? error.stack : 'Unknown error',
      retryable:
        isMongoError &&
        'hasErrorLabel' in error &&
        typeof error.hasErrorLabel === 'function' &&
        error.hasErrorLabel('RetryableWriteError'),
    });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during key rotation';
    throw new Error(`Failed to rotate API keys: ${errorMessage}`);
  } finally {
  }
}

/**
 * Initializes API key management by creating the first key if none exists.
 * Returns the plain text key if a new one was created, otherwise null.
 */
export async function initializeApiKeys(
  userId: string,
): Promise<string | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .maybeSingle();
    
if (error || !user) {
  throw new Error('User not found in Supabase');
}

  // if (!(await isWithinRateLimit(`init:${userId}`))) {
  //   // Specific rate limit key
  //   throw new Error('Rate limit exceeded for API key initialization');
  // }

  try {
    const existingKey = await supabase
      .from(API_KEY_TABLE)
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .single(); // Check for active keys

    if (!existingKey.data) {
      logger.info(`No active key found for user ${userId}. Initializing...`);
      // Rotate keys will generate and store the first key
      const { plainKey } = await rotateApiKeys(userId);
      logger.info(`API key initialized successfully for user ${userId}.`);
      return plainKey; // Return the newly generated plain key
    } else {
      logger.info(
        `User ${userId} already has an active API key. No initialization needed.`,
      );
      return null; // Indicate no new key was generated
    }
  } catch (error: unknown) {
    logger.error('Error initializing API keys', { userId, error });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during initialization';
    // Re-throw as the caller might need to handle initialization failure
    throw new Error(`Failed to initialize API keys: ${errorMessage}`);
  }
}

/**
 * Gets the active API key record for a user (returns the stored record with hashed key).
 */
export async function getApiKeyRecord(
  userId: string,
): Promise<ApiKeyRecord | undefined> {
  if (!(await isValidUserId(userId))) {
    logger.warn(`Invalid userId format or user not found: ${userId}`);
    return undefined;
  }

  // if (!(await isWithinRateLimit(`get:${userId}`))) {
  //   // Specific rate limit key
  //   logger.warn(
  //     `Rate limit exceeded for getApiKeyRecord call by user: ${userId}`,
  //   );
  //   return undefined;
  // }

  try {
    const { data: apiKeyRecord, error } = await supabase
      .from(API_KEY_TABLE)
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .gt('expiresAt', new Date().toISOString())
      .single();
    if (error) {
      logger.error('Error getting API key record', { userId, error });
      return undefined; // Return undefined on error
    }
    // findOne returns T | null. Convert null to undefined.
    return apiKeyRecord ?? undefined;
  } catch (error: unknown) {
    logger.error('Error getting API key record', { userId, error });
    return undefined; // Return undefined on error
  }
}

/**
 * Deletes all API keys (active and inactive) for a user. Use with caution.
 */
export async function deleteAllApiKeysForUser(userId: string): Promise<void> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .maybeSingle();
    
if (error || !user) {
  throw new Error('User not found in Supabase');
}

  // if (!(await isWithinRateLimit(`delete:${userId}`))) {
  //   // Specific rate limit key
  //   throw new Error('Rate limit exceeded for API key deletion');
  // }

  try {
    const { error } = await supabase
      .from(API_KEY_TABLE)
      .delete()
      .eq('userId', userId);
    if (error) {
      logger.error('Error deleting API keys', { userId, error });
      throw error;
    }
    logger.info(`Deleted API keys for user ${userId}`);
  } catch (error: unknown) {
    logger.error('Error deleting API keys', { userId, error });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during key deletion';
    throw new Error(`Failed to delete API keys: ${errorMessage}`);
  }
}

// --- Helper Functions ---

// Basic format check (UUID v4) - doesn't hit the DB
function isValidUserIdFormat(userId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof userId === 'string' && uuidRegex.test(userId);
}

// Checks format AND existence in the database
async function isValidUserId(userId: string): Promise<boolean> {
  if (!isValidUserIdFormat(userId)) {
    logger.warn(`Invalid userId format: ${userId}`);
    return false;
  }

  // Check if user exists in the database
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.warn(`User not found in database: ${userId}`);
      return false;
    }
    return true;
  } catch (error: unknown) {
    logger.error('Error validating userId against database', { userId, error });
    return false;
  }
}


