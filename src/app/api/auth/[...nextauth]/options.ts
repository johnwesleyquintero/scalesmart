import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type NextAuthOptions, type Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import GithubProvider from 'next-auth/providers/github';
import { PrismaClient } from '@prisma/client';

// Ensure environment variables are defined for GitHub OAuth
const githubId = process.env.GITHUB_ID;
const githubSecret = process.env.GITHUB_SECRET;

if (!githubId) {
  throw new Error('GITHUB_ID is not defined. Please check your .env file.');
}
if (!githubSecret) {
  throw new Error('GITHUB_SECRET is not defined. Please check your .env file.');
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
