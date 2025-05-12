import NextAuth, { Account, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      authorization: {
        params: {
          redirect_uri:
            'https://fdagmiviwysvfilycgun.supabase.co/auth/v1/callback',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt(params: {
      token: JWT;
      user: unknown;
      account: Account | null;
      profile?: unknown;
      trigger?: unknown;
      isNewUser?: boolean;
      session?: unknown;
    }) {
      console.log('JWT Callback - Account:', params.account);
      if (params.account) {
        params.token.accessToken = params.account.access_token as string;
      }
      console.log('JWT Callback - Token:', params.token);
      return params.token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log('Session Callback - Token:', token);
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      } else {
        console.log('Session Callback - accessToken is missing from token');
      }
      console.log('Session Callback - Session:', session);
      return session;
    },
  },
});

import { loadStaticData } from '@/lib/load-static-data';

loadStaticData('prohibited-keywords');

export { handler as GET, handler as POST };
