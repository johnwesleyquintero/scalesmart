import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { type NextAuthOptions, type Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
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
    async signIn({ user, account, profile, email, credentials }) {
      console.log('[NextAuth] signIn callback START', { user: user?.id });
      // Add logging for any specific operations here
      // e.g., console.log("[NextAuth] signIn: About to query database...");
      // await someDbOperation();
      // console.log("[NextAuth] signIn: Database query complete.");
      console.log('[NextAuth] signIn callback END');
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log('[NextAuth] session callback START', { userId: token?.sub });
      console.time('NextAuth Session Callback');
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      console.timeEnd('NextAuth Session Callback');
      console.log('[NextAuth] session callback END');
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('[NextAuth] jwt callback START', {
        userId: user?.id,
        accountProvider: account?.provider,
      });
      console.time('NextAuth JWT Callback');
      if (user) {
        token.sub = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      console.timeEnd('NextAuth JWT Callback');
      console.log('[NextAuth] jwt callback END');
      return token;
    },
  },
  events: {
    async signIn(message) {
      console.log('[NextAuth] signIn event', message);
    },
    async signOut(message) {
      console.log('[NextAuth] signOut event', message);
    },
    async createUser(message) {
      console.log('[NextAuth] createUser event', message);
    },
    async updateUser(message) {
      console.log('[NextAuth] updateUser event', message);
    },
    async linkAccount(message) {
      console.log('[NextAuth] linkAccount event', message);
    },
    async session(message) {
      console.log('[NextAuth] session event', message);
    },
  },
};
