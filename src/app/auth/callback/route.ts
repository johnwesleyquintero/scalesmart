import supabase from '@/lib/supabase/server'; // Import the default exported Supabase client
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // Use the origin from headers for the redirect URL
  const origin = (await headers()).get('origin');

  // If a code is present, attempt to exchange it for a session
  if (code) {
    // Use the imported default supabase client instance
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error.message);
      // Redirect to login with an error message if exchange fails
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // Redirect back to the origin (or a default page) after successful exchange or if no code was present
  // You might want to redirect to a specific dashboard page instead of the origin
  return NextResponse.redirect(origin || '/');
}
