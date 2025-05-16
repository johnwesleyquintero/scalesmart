import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { error, info, warn } from './logger';

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

type ApiKeyRecord = {
  key: string; // This will store the HASHED key
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  userId: string;
};

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
  try {
    const { data: apiKeyRecord, error: dbError } = await supabase
      .from(API_KEY_TABLE)
      .select()
      .eq('userId', userId)
      .eq('isActive', true)
      .gt('expiresAt', new Date().toISOString())
      .maybeSingle();

    if (dbError) throw dbError;

    if (!apiKeyRecord) {
      warn('No active API key found for validation', { userId });
      return false;
    }

    // Compare the provided plain text key with the stored hash
    const isValid = await bcrypt.compare(plainKey, apiKeyRecord.key);
    if (!isValid) {
      warn('API key validation failed: Mismatch', { userId });
      return false;
    }

    return true;
  } catch (error: any) {
    // Catch errors from connectToDatabase() or other issues outside the inner try
    error(
      'API_KEY_VALIDATION_DB_ERROR',
      error instanceof Error ? error : String(error),
      {
        userId,
      },
    );
    // Log the specific error if it's an Error instance
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
      warn('apiKeyMiddleware: Missing userId in request body');
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    // Basic validation for userId format before hitting the DB
    if (typeof userId !== 'string' || !isValidUserIdFormat(userId)) {
      warn('apiKeyMiddleware: Invalid userId format in request body', {
        userId,
      });
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 },
      );
    }

    // Validate the API key (this involves bcrypt comparison)
    if (!(await validateApiKey(apiKey, userId))) {
      warn('apiKeyMiddleware: Invalid or expired API key', { userId });
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 },
      );
    }

    // If validation passes, return undefined to allow the original request to proceed.
    info('apiKeyMiddleware: API key validated successfully', { userId });
    return undefined;
  } catch (error: any) {
    // Log the specific error if it's an Error instance
    error(
      'Error in apiKeyMiddleware',
      error instanceof Error ? error : String(error),
      {
        context: {
          userId: request.headers.get('x-api-key') ? 'present' : 'missing',
        }, // Add context
      },
    );
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
 */
export async function rotateApiKeys(
  userId: string,
): Promise<{ record: ApiKeyRecord; plainKey: string }> {
  try {
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .maybeSingle();

    if (dbError || !user) {
      throw new Error('User not found in Supabase');
    }

    // Deactivate all existing keys for the user
    const { count } = await supabase
      .from(API_KEY_TABLE)
      .update({ isActive: false })
      .eq('userId', userId);
    info(`Deactivated ${count} old keys for user ${userId}`);

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
    const startTime = Date.now();
    const { error: insertError } = await supabase
      .from(API_KEY_TABLE)
      .insert(newKeyRecord);

    if (insertError) {
      error(
        'Error inserting new API key',
        insertError instanceof Error ? insertError : String(insertError),
      );
      throw insertError;
    }
    const duration = Date.now() - startTime;
    info(`Inserted new API key in ${duration}ms`);

    info(`Successfully generated and stored new API key for user ${userId}`);

    // Return the record (with hashed key) AND the plain text key separately
    return { record: newKeyRecord, plainKey: plainKey };
  } catch (error: any) {
    error('KeyRotationFailed', {
      error: error instanceof Error ? error : new Error(String(error)),
      userId,
    });
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during key rotation';
    throw new Error(`Failed to rotate API keys: ${errorMessage}`);
  }
}

/**
 * Initializes API key management by creating the first key if none exists.
 */
export async function initializeApiKeys(
  userId: string,
): Promise<string | null> {
  try {
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .maybeSingle();

    if (dbError || !user) {
      throw new Error('User not found in Supabase');
    }

    const { data: existingKey, error: selectError } = await supabase
      .from(API_KEY_TABLE)
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .single(); // Check for active keys

    if (selectError) {
      error(
        'Error selecting API key',
        selectError instanceof Error ? selectError : String(selectError),
      );
      throw selectError;
    }

    if (!existingKey) {
      info(`No active key found for user ${userId}. Initializing...`);
      // Rotate keys will generate and store the first key
      const { plainKey } = await rotateApiKeys(userId);
      info(`API key initialized successfully for user ${userId}.`);
      return plainKey; // Return the newly generated plain key
    } else {
      info(
        `User ${userId} already has an active API key. No initialization needed.`,
      );
      await deleteApiKeysForUser(userId);
      return null; // Indicate no new key was generated
    }
  } catch (error: any) {
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
const GET_API_KEY_RECORD_ERROR = 'Error getting API key record';

export async function getApiKeyRecord(
  userId: string,
): Promise<ApiKeyRecord | undefined> {
  if (!isValidUserIdFormat(userId)) {
    warn(`Invalid userId format or user not found: ${userId}`);
    return undefined;
  }

  try {
    const startTime = Date.now();
    const { data: apiKeyRecord, error: dbError } = await supabase
      .from(API_KEY_TABLE) // Explicitly type the table data
      .select('*')
      .eq('userId', userId) // Should be userId, not id
      .eq('isActive', true)
      .gt('expiresAt', new Date().toISOString())
      .maybeSingle(); // Use maybeSingle as it might not exist

    if (dbError) {
      error(GET_API_KEY_RECORD_ERROR, String(dbError), { userId });
      throw dbError; // Re-throw DB errors
    }
    const duration = Date.now() - startTime;
    info(`Validated userId against database in ${duration}ms`);
    return apiKeyRecord ?? undefined;
  } catch (error: any) {
    error('Error getting API key record', { userId });
    return undefined;
  }
}

/**
 * Deletes all API keys (active and inactive) for a user. Use with caution.
 */
async function deleteApiKeysForUser(userId: string): Promise<void> {
  try {
    // Deactivate all existing keys for the user
    const { error: dbError } = await supabase
      .from(API_KEY_TABLE)
      .delete()
      .eq('userId', userId);

    if (dbError) {
      error(
        'Failed to delete API keys for user',
        dbError instanceof Error ? String(dbError) : undefined,
        {
          userId,
        },
      );
      throw dbError;
    }

    info(`Deleted all API keys for user ${userId}`);
  } catch (error: any) {
    error(
      'Error deleting API keys',
      error instanceof Error ? String(error) : new Error(String(error)).message,
      {
        userId,
      },
    );
    throw new Error(
      `Failed to delete API keys for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

export function isValidUserIdFormat(userId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof userId === 'string' && uuidRegex.test(userId);
}
