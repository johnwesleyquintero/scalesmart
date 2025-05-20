import { get } from '@vercel/edge-config';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import publicPaths from './config/publicPaths';

export async function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled
  const maintenanceMode = await get('maintenance_mode');
  if (maintenanceMode) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  const path = request.nextUrl.pathname;

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
      const url = new URL('/api/auth/signin', request.url);
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
    const url = new URL('/api/auth/signin', request.url); // Construct the sign-in URL
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
