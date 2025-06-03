'use server';

import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Schema for validating and normalizing the keyword input
const keywordSchema = z.string().trim().toLowerCase().min(1).max(50);

/**
 * Retrieves all prohibited keywords from the database.
 * @returns A promise resolving to an array of keyword objects, or an empty array on error.
 * @throws Will re-throw database errors after logging.
 */
export async function getAllProhibitedKeywords(): Promise<
  { keyword: string }[]
> {
  try {
    const { data: keywords, error } = await supabase
      .from('prohibited_keywords')
      .select('keyword');

    if (error) {
      console.error('Server Action Failed - getAllProhibitedKeywords:', error);
      // Re-throw the error to be handled by the caller or the server action framework
      throw error;
    }

    // Ensure an array is always returned
    return keywords || [];
  } catch (error: unknown) {
    console.error(
      'Server Action Failed - getAllProhibitedKeywords (catch):',
      error,
    );
    // Re-throw the error to be handled by the caller or the server action framework
    throw error;
  }
}

/**
 * Adds a new prohibited keyword to the database.
 * Validates the input, attempts insertion, and handles unique constraint errors.
 * @param keyword The keyword string to add.
 * @returns A promise resolving to an object indicating success/failure and a message.
 */
export async function addProhibitedKeyword(
  keyword: string,
): Promise<{ success: boolean; message: string }> {
  // 1. Validate and normalize input using Zod schema
  const validatedKeyword = keywordSchema.safeParse(keyword);
  if (!validatedKeyword.success) {
    // Return a specific message for invalid input
    return { success: false, message: 'Invalid keyword provided.' };
  }

  // Zod schema handled trim() and toLowerCase(), use the parsed data directly
  const normalizedKeyword = validatedKeyword.data;

  try {
    // 2. Attempt to insert the new keyword directly.
    // Supabase will enforce the unique constraint on the 'keyword' column.
    const { error: insertError } = await supabase
      .from('prohibited_keywords')
      .insert({
        keyword: normalizedKeyword,
        // Add createdAt and updatedAt fields here if they exist in your schema
        // createdAt: new Date().toISOString(),
        // updatedAt: new Date().toISOString(),
      })
      .single(); // Using single() simplifies handling the insertion result/error

    // 3. Handle potential errors from the insert operation
    if (insertError) {
      // Check if the error is a unique constraint violation (PostgreSQL error code 23505)
      // This indicates the keyword already exists.
      if (insertError.code === '23505') {
        console.log(
          `Server Action: Prohibited keyword already exists: ${normalizedKeyword}`,
        );
        // Return a specific message for the user using the original trimmed input
        return {
          success: false,
          message: `Keyword "${keyword.trim()}" already exists.`,
        };
      }

      // Handle any other unexpected insert errors
      console.error(
        'Server Action Failed - addProhibitedKeyword (insert):',
        insertError,
      );
      // Re-throw the error to be caught by the outer catch block
      throw insertError;
    }

    // 4. If no error, the insert was successful
    console.log(
      `Server Action: Added prohibited keyword: ${normalizedKeyword}`,
    );
    // Return success message using the original trimmed input for user context
    return { success: true, message: `Keyword "${keyword.trim()}" added.` };
  } catch (error: unknown) {
    // 5. Catch any errors re-thrown from the try block or other unexpected issues
    console.error(
      'Server Action Failed - addProhibitedKeyword (catch):',
      error,
    );
    // Return a generic error message for unexpected server issues
    return {
      success: false,
      message: 'Failed to add keyword due to a server error.',
    };
  }
}
