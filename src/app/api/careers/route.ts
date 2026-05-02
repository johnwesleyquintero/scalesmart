export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';
import { GOOGLE_SHEETS_WEBHOOK_URL } from '@/constants/links';

interface CareerPayload {
  fullName: string;
  email: string;
  whatsapp: string;
  msTeams?: string;
  profession: string;
  proposal: string;
  cvLink: string;
  tools: string;
  skills: string;
  referral?: string;
}

export async function POST(request: Request) {
  try {
    const body: CareerPayload = await request.json();

    // Validate required fields
    if (
      !body.fullName ||
      !body.email ||
      !body.whatsapp ||
      !body.profession ||
      !body.proposal ||
      !body.cvLink ||
      !body.tools ||
      !body.skills
    ) {
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
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        type: 'JOB_APPLICATION',
        submittedAt: new Date().toISOString(),
      }),
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`Google Sheets Webhook Error: ${response.status} ${response.statusText}`);
      throw new Error(`Google Apps Script returned status: ${response.status}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Application Submitted successfully',
    });
  } catch (error) {
    console.error('Careers API Error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
