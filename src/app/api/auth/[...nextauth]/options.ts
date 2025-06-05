import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { type NextAuthOptions, type Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';

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
    async signIn({ user }) {
      // Removed verbose logging for cleaner console output
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
