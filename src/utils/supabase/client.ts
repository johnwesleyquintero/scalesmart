import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase URL:', supabaseUrl);
  console.log(
    'Supabase Anon Key (first 5 chars):',
    supabaseAnonKey ? supabaseAnonKey.substring(0, 5) : 'N/A',
  );

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing!');
    throw new Error('Supabase environment variables are missing.');
  }

  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client created successfully.');
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
