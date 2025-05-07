import { logger } from '@/lib/logger';
import { get } from '@vercel/edge-config';
import type { JWT } from 'next-auth/jwt';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

import { v4 as uuidv4 } from 'uuid';

// Function to generate security headers with a nonce for enhanced security
const generateSecurityHeaders = (nonce?: string) => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} 'unsafe-eval'`,
      `style-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https:`,
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.github.com https://api.linkedin.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join(';'),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
};

// List of public paths that do not require authentication
const publicPaths = [
  '/api/amazon',
  '/amazon-seller-tools',
  '/blog',
  '/',
  '/images',
  '/api/content',
];

// Function to apply security headers to the response
function applySecurityHeaders(response: NextResponse, nonce?: string) {
  const headers = generateSecurityHeaders(nonce);
  // Apply each header to the response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

// Function to handle maintenance mode
async function handleMaintenanceMode(
  request: NextRequest,
): Promise<NextResponse | null> {
  // Check if maintenance mode is enabled
  const maintenanceMode = await get('maintenance_mode');
  if (maintenanceMode) {
    // Redirect to maintenance page
    const response = NextResponse.redirect(
      new URL('/maintenance', request.url),
    );
    applySecurityHeaders(response);
    return response;
  }
  return null;
}

// Function to handle authentication
async function handleAuthentication(
  request: NextRequest,
  path: string,
  token: JWT | null,
): Promise<NextResponse | null> {
  // Check if the path is public
  const isPublicPath = publicPaths.some(
    (publicPath) => path.startsWith(publicPath) || path === publicPath,
  );

  // If not public and no token, redirect to sign-in
  if (!isPublicPath && !token) {
    const redirectUrl = new URL('/api/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(redirectUrl);
  }
  return null;
}

// Main middleware function
export async function middleware(request: NextRequest) {
  try {
    // Generate a unique nonce for Content Security Policy
    const nonce = Buffer.from(uuidv4()).toString('base64');

    // Handle maintenance mode
    const maintenanceResponse = await handleMaintenanceMode(request);
    if (maintenanceResponse) {
      return maintenanceResponse;
    }

    const path = request.nextUrl.pathname;

    // Get the authentication token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Handle authentication
    const authResponse = await handleAuthentication(request, path, token);
    if (authResponse) {
      return authResponse;
    }

    const response = NextResponse.next();

    // Apply security headers to the response
    applySecurityHeaders(response, nonce);

    // Set the nonce in a header for use in components
    response.headers.set('x-nonce', nonce);

    // Add a request ID for tracking
    const requestId = uuidv4();
    response.headers.set('X-Request-ID', requestId);

    return response;
  } catch (error) {
    // Log any errors that occur in the middleware
    logger.error('Middleware error:', {
      error,
      path: request.nextUrl.pathname,
    });

    // Return an error response with security headers
    const errorResponse = new NextResponse(null, { status: 500 });
    applySecurityHeaders(errorResponse);
    return errorResponse;
  }
}

// Configuration for the middleware, specifying which paths to apply it to
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/user/:path*',
    '/api/protected/:path*',
    '/((?!_next/static|favicon.ico|robots.txt).*)',
  ],
};
