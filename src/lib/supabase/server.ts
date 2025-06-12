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

/**
 * Retrieves the current user session and their profile from Supabase.
 * This function is intended for server-side usage for authorization checks.
 * @returns {Promise<{ user: User | null; profile: any | null; error: Error | null }>} An object containing the user data, profile data, or an error.
 */
export async function getUserWithProfile() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      user: null,
      profile: null,
      error: new Error(sessionError.message),
    };
  }

  if (!session?.user) {
    return { user: null, profile: null, error: null }; // No session or user, not an error
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*') // Select all columns from the profiles table
    .eq('id', session.user.id)
    .single(); // Expecting a single profile for the user

  if (profileError) {
    return {
      user: session.user,
      profile: null,
      error: new Error(profileError.message),
    };
  }

  return { user: session.user, profile, error: null };
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
 * @returns {Promise<{ user: User | null; error: Error | null }>} An object containing the user data or an error.
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
