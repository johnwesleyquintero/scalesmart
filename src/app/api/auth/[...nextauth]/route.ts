import NextAuth, { NextAuthOptions } from 'next-auth';
import { loadStaticData } from '@/lib/load-static-data';
import { rateLimiter } from '@/lib/api/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-error-handler';

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
    return NextResponse.json(
      createErrorResponse('Too many requests', 'RATE_LIMIT_EXCEEDED'),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  const authOptions = (await import('./options'))
    .authOptions as NextAuthOptions;

  return NextAuth(authOptions)(req, res);
}

export { handler as GET, handler as POST };
