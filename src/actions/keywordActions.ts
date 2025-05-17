'use server';
import { ProhibitedKeyword } from '@/lib/models/prohibited-keywords';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const keywordSchema = z.string().trim().toLowerCase().min(1).max(50);

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

export async function getAllProhibitedKeywords(): Promise<string[]> {
  try {
    const { data: keywords, error } = await supabase
      .from('prohibited_keywords')
      .select('keyword');

    if (error) throw error;
    return keywords.map((k: { keyword: string }) => k.keyword);
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
    const normalizedKeyword = normalizeKeyword(validatedKeyword.data);
    const { data: exists, error: queryError } = await supabase
      .from('prohibited_keywords')
      .select('*')
      .eq('keyword', normalizedKeyword)
      .single();

    if (queryError && !queryError.message.includes('No rows found')) {
      throw queryError;
    }

    if (!exists) {
      const newKeyword: Omit<ProhibitedKeyword, '_id'> = {
        keyword: normalizedKeyword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        const { error: insertError } = await supabase
          .from('prohibited_keywords')
          .insert(newKeyword);

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
