import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Please add your Supabase URL to .env.local');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Please add your Supabase Anon Key to .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function connectToDatabase() {
  return { supabase };
}
