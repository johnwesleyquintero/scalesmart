'use server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const keywordSchema = z.string().trim().toLowerCase().min(1).max(50);

// function normalizeKeyword(keyword: string): string {
//   return keyword.trim().toLowerCase();
// }

export async function getAllProhibitedKeywords(): Promise<
  { keyword: string }[]
> {
  try {
    const { data: keywords, error } = await supabase
      .from('prohibited_keywords')
      .select('keyword');

    if (error) {
      console.error('Server Action Failed - getAllProhibitedKeywords:', error);
      throw error;
    }
    return keywords || [];
  } catch (error: unknown) {
    console.error('Server Action Failed - getAllProhibitedKeywords:', error);
    throw error;
  }
}

export async function addProhibitedKeyword(
  keyword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const validatedKeyword = keywordSchema.safeParse(keyword);
    if (!validatedKeyword.success) {
      return { success: false, message: 'Invalid keyword provided.' };
    }
    const normalizedKeyword = validatedKeyword.data.trim().toLowerCase();
    const { data: exists, error: queryError } = await supabase
      .from('prohibited_keywords')
      .select('keyword')
      .eq('keyword', normalizedKeyword)
      .single();

    if (queryError && !queryError.message.includes('No rows found')) {
      throw queryError;
    }
    if (queryError && queryError.code === '23505') {
      // Unique constraint violation
      return {
        success: false,
        message: `Keyword "${keyword.trim()}" already exists.`,
      };
    }

    if (!exists) {
      try {
        const { error: insertError } = await supabase
          .from('prohibited_keywords')
          .insert({
            keyword: normalizedKeyword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        if (insertError) throw insertError;
        console.log(
          `Server Action: Added prohibited keyword: ${keyword.trim()}`,
        );
        return { success: true, message: `Keyword "${keyword.trim()}" added.` };
      } catch (error: unknown) {
        console.error('Server Action Failed - insertOne:', error);
        return {
          success: false,
          message: 'Failed to add keyword due to a database error.',
        };
      }
    } else {
      console.log(
        `Server Action: Prohibited keyword already exists: ${keyword.trim()}`,
      );
      return {
        success: false,
        message: `Keyword "${keyword.trim()}" already exists.`,
      };
    }
  } catch (error: unknown) {
    console.error('Server Action Failed - addProhibitedKeyword:', error);
    return {
      success: false,
      message: 'Failed to add keyword due to a server error.',
    };
  }
}
