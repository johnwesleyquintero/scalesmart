import NextAuth, { NextAuthOptions } from 'next-auth';
import { loadStaticData } from '@/lib/load-static-data';
import { rateLimiter } from '@/lib/api/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

loadStaticData('prohibited-keywords');

interface NextAuthRequest extends NextRequest {
  ip?: string;
}

async function handler(
  req: NextAuthRequest,
  res: NextResponse,
): Promise<NextResponse> {
  const identifier = req.ip ?? '127.0.0.1';
  const { success } = await rateLimiter.limit(identifier);

  if (!success) {
    return new NextResponse('Too many requests', {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  const authOptions = (await import('./options'))
    .authOptions as NextAuthOptions;

  return NextAuth(authOptions)(req, res);
}

export { handler as GET, handler as POST };
