import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { type NextAuthOptions, type Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    secret: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }),
  providers: [
    GithubProvider({
      clientId: 'Ov23liRMBuL7lRtK6yvf',
      clientSecret: 'ee4d59a12e9d64f3dd3fdb0abf0980b7747cd638',
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],
  // Update the Homepage URL in the GitHub OAuth app settings to: https://wescode.vercel.app/
  // Update the Authorization callback URL in the GitHub OAuth app settings to: https://wescode.vercel.app/api/auth/callback/github
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      console.time('NextAuth Session Callback');
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      console.timeEnd('NextAuth Session Callback');
      return session;
    },
    async jwt({ token, user, account }) {
      console.time('NextAuth JWT Callback');
      if (user) {
        token.sub = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      console.timeEnd('NextAuth JWT Callback');
      return token;
    },
  },
};
