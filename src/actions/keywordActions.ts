'use server';
import { supabase } from '@/lib/supabase';
import { ProhibitedKeyword } from '@/lib/models/prohibited-keywords';

export async function getAllProhibitedKeywords(): Promise<string[]> {
  try {
    const { data: keywords, error } = await supabase
      .from('prohibited_keywords')
      .select('keyword');
    
    if (error) throw error;
    return keywords.map((k: { keyword: string }) => k.keyword);
  } catch (error: unknown) {
    console.error('Server Action Failed - getAllProhibitedKeywords:', error);
    return [];
  }
}

export async function addProhibitedKeyword(
  keyword: string,
): Promise<{ success: boolean; message: string }> {
  if (
    !keyword ||
    typeof keyword !== 'string' ||
    keyword.trim().length === 0 ||
    keyword.trim().length > 50
  ) {
    return { success: false, message: 'Invalid keyword provided.' };
  }
  try {
    const lowerCaseKeyword = keyword.trim().toLowerCase();
    const { data: exists, error: queryError } = await supabase
      .from('prohibited_keywords')
      .select('*')
      .eq('keyword', lowerCaseKeyword)
      .single();
    
    if (queryError && !queryError.message.includes('No rows found')) {
      throw queryError;
    }

    if (!exists) {
      const newKeyword: Omit<ProhibitedKeyword, '_id'> = {
        keyword: keyword.trim().toLowerCase(),
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
