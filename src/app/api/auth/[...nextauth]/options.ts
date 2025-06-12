import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { type NextAuthOptions, type Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';
import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are defined for GitHub OAuth
const githubId = process.env.GITHUB_ID;
const githubSecret = process.env.GITHUB_SECRET;

if (!githubId) {
  throw new Error('GITHUB_ID is not defined. Please check your .env file.');
}
if (!githubSecret) {
  throw new Error('GITHUB_SECRET is not defined. Please check your .env file.');
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    // The schema option is typically configured directly on the Supabase client,
    // not directly on the SupabaseAdapter. The error "The schema must be one of
    // the following: public, graphql_public" (PGRST106) suggests a database-level
    // schema access issue, or an incompatibility with the adapter's internal
    // Supabase client initialization.
    // Assuming the Supabase client in `src/lib/supabase/server.ts` is correctly
    // configured with `db: { schema: 'public' }`, this adapter might be creating
    // its own client or the service role key lacks necessary permissions.
    // No direct fix for PGRST106 within this file without modifying the adapter
    // or Supabase project settings.
  ),
  providers: [
    GithubProvider({
      clientId: githubId,
      clientSecret: githubSecret,
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          user_name: profile.login, // Ensure GitHub username is passed
        };
      },
    }),
  ],
  // Update the Homepage URL in the GitHub OAuth app settings to: https://wescode.vercel.app/
  // Update the Authorization callback URL in the GitHub OAuth app settings to: https://wescode.vercel.app/api/auth/callback/github
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Initialize Supabase client for server-side operations
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase URL or Service Role Key is not defined.');
        return '/auth/error?message=Configuration Error';
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
        db: { schema: 'public' },
      });

      // Check if the user has access to Amazon Seller Tools
      // This assumes a 'profiles' table with a 'has_amazon_access' boolean column
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('has_amazon_access')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError.message);
        // Redirect to an error page with a specific message
        return `/login?message=Error checking permissions: ${encodeURIComponent(profileError.message)}&error=PermissionCheckFailed`;
      }

      if (!profileData || !profileData.has_amazon_access) {
        // If user does not have Amazon access, prevent sign-in and redirect to login with an error message
        return `/login?message=You do not have permission to access the Amazon Seller Tools.&error=PermissionDenied`;
      }

      // If user has access, allow sign-in
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Removed verbose logging for cleaner console output
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Removed verbose logging for cleaner console output
      if (user) {
        token.sub = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  events: {
    // Removed verbose logging from events for cleaner console output
    async signIn(message) {
      /* console.log('[NextAuth] signIn event', message); */
    },
    async signOut(message) {
      /* console.log('[NextAuth] signOut event', message); */
    },
    async createUser(message) {
      /* console.log('[NextAuth] createUser event', message); */
    },
    async updateUser(message) {
      /* console.log('[NextAuth] updateUser event', message); */
    },
    async linkAccount(message) {
      /* console.log('[NextAuth] linkAccount event', message); */
    },
    async session(message) {
      /* console.log('[NextAuth] session event', message); */
    },
  },
};
