import { get } from '@vercel/edge-config';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import publicPaths from './config/publicPaths';

// Constants for commonly used strings
const HEADERS = {
  FORWARDED_FOR: 'x-forwarded-for',
  REAL_IP: 'x-real-ip',
  USER_AGENT: 'user-agent',
} as const;

const ROUTES = {
  ERROR: '/error',
  MAINTENANCE: '/maintenance',
  SIGNIN: '/api/auth/signin',
} as const;

const EDGE_CONFIG_KEYS = {
  MAINTENANCE_MODE: 'maintenance_mode',
  AUTH_RATE_LIMIT: 'auth_rate_limit',
  RATE_LIMIT_PREFIX: 'rate_limit_',
} as const;

// Helper function to handle rate limiting
async function checkRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] ?? realIp ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const identifier = `${clientIp}-${userAgent}`;

    const rateLimit = await get('auth_rate_limit');
    const requestCount = await get(`rate_limit_${identifier}`);

    if (
      requestCount &&
      rateLimit &&
      Number(requestCount) >= Number(rateLimit)
    ) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(rateLimit),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
  }
  return null;
}

// Helper function to handle authentication
async function handleAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const url = new URL(ROUTES.SIGNIN, request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
  return null;
}

export async function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled
  const maintenanceMode = await get('maintenance_mode');
  if (maintenanceMode) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  const path = request.nextUrl.pathname;

  // Rate limiting for auth endpoints
  if (path.startsWith('/api/auth/')) {
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // Define public paths that don't require authentication
  const isPublicPath = publicPaths.some((pattern) =>
    typeof pattern === 'string' ? path === pattern : path.match(pattern),
  );

  // Get the token from the request
  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error: unknown) {
    console.error('Error getting token:', error);
    // Handle token expiration
    if ((error as Error).name === 'TokenExpiredError') {
      const url = new URL(ROUTES.SIGNIN, request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url); // Redirect to sign-in to refresh token
    }
    // Handle other token-related errors (e.g., invalid signature, revoked token)
    console.error('Authentication error:', error);
    // Consider logging the specific error for debugging purposes and providing a user-friendly error message
    console.error('Authentication error details:', (error as Error).message);
    return NextResponse.redirect(new URL('/error', request.url)); // Redirect to an error page
  }

  // Allow access to public paths (paths that don't require authentication)
  if (isPublicPath) {
    return NextResponse.next(); // Continue to the requested route
  }

  // If no token is present, redirect to the login page
  if (!token) {
    const url = new URL(ROUTES.SIGNIN, request.url); // Construct the sign-in URL
    url.searchParams.set('callbackUrl', encodeURI(request.url)); // Set the callback URL for redirection after login
    return NextResponse.redirect(url); // Redirect to the sign-in page
  }

  return NextResponse.next();
}

// Configure paths that trigger the middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/user/:path*',
    '/api/protected/:path*',
  ],
};
