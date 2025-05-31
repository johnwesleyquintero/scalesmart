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
  console.log(`[NextAuth Route] Request from IP: ${identifier}`);
  const { success } = await rateLimiter.limit(identifier); // Corrected to only destructure 'success'
  console.log(`[NextAuth Route] Rate Limit - Success: ${success}`); // Adjusted log

  if (!success) {
    console.error('[NextAuth Route] Rate limit exceeded');
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

  try {
    const authOptions = (await import('./options'))
      .authOptions as NextAuthOptions;

    console.log('[NextAuth] handler START');
    const result = await NextAuth(authOptions)(req, res);
    console.log('[NextAuth] handler END. Result status:', result.status);
    return result;
  } catch (error) {
    console.error('[NextAuth Route] Uncaught error in handler:', error);
    const errorResponse = createErrorResponse(
      'Authentication internal error',
      'SERVER_ERROR',
      error instanceof Error ? error.message : String(error),
    );
    console.log('[NextAuth Route] Sending error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export { handler as GET, handler as POST };
