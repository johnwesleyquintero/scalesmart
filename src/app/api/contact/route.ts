import { NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';
import { GOOGLE_SHEETS_WEBHOOK_URL } from '@/constants/links';

interface ContactPayload {
  name: string;
  email: string;
  service: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactPayload = await request.json();

    // Validate input
    if (!body.name || !body.email || !body.message || !body.service) {
      return NextResponse.json(
        createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        createErrorResponse('Invalid email address', 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }

    // Send data to Google Sheets via Apps Script Webhook
    // Executing this server-side avoids browser CORS issues
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      redirect: 'follow', // Apps Script often redirects
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned status: ${response.status}`);
    }

    return NextResponse.json({
      success: true,
      message: 'System Logged successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
