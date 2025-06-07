import { createBrowserClient } from '@supabase/ssr';

// This file is for initializing the Supabase client on the client-side.
// It uses createBrowserClient from @supabase/ssr for Next.js applications.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
