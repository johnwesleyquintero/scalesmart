import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getTableSchema(tableName: string): Promise<unknown> {
  try {
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName,
    });

    if (error) {
      console.error('Error fetching table schema:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching table schema:', error);
    return null;
  }
}
