import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure environment variables are defined, otherwise throw an error for clarity.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Supabase URL is not defined. Please check your .env file for NEXT_PUBLIC_SUPABASE_URL.',
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    'Supabase Anon Key is not defined. Please check your .env file for NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

// Create a single instance of the Supabase client for server-side use.
// This ensures the client is initialized only once per module.
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }, // Explicitly set the schema for the database client
});

/**
 * Retrieves the current user session from Supabase.
 * This function is intended for server-side usage.
 * @returns {Promise<import('@supabase/supabase-js').AuthSessionResponse>} The session response from Supabase.
 */
export async function getSupabaseSession() {
  return supabase.auth.getSession();
}

// You can export the client directly if needed for other server-side operations
export default supabase;

/**
 * Authenticates a user with Supabase using email and password.
 * This function centralizes the authentication logic, making it reusable
 * and easier to manage. It also provides a clear interface for debugging
 * authentication flows.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<{ user: any | null; error: Error | null }>} An object containing the user data or an error.
 */
export async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return a standardized error object for easier handling in calling functions.
    return { user: null, error: new Error(error.message) };
  }

  // Return user data if authentication is successful.
  return { user: data.user, error: null };
}
