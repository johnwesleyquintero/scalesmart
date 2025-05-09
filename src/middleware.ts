import { get } from '@vercel/edge-config';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const maintenanceMode = await get('maintenance_mode');
  if (maintenanceMode) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = [
    '/api/amazon',
    '/amazon-seller-tools',
    '/blog',
    '/',
  ].includes(path);

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Allow access to public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected path without token
  if (!token) {
    const url = new URL('/api/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
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
