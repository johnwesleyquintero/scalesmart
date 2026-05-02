import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

// This endpoint now returns an empty shell.
// Content is fetched dynamically from GitHub on the client side.
export async function GET() {
  try {
    return NextResponse.json({
      message: 'Content is now served via the GitHub API on the client side.',
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
