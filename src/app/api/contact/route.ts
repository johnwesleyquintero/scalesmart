import { NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

interface EmailPayload {
  name: string;
  email: string;
  message: string;
}

export async function POST(request: Request) {
  const body: EmailPayload = await request.json();

  // Validate input
  if (!body.name || !body.email || !body.message) {
    return NextResponse.json(
      createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
      { status: 400 },
    );
  }

  // Email functionality disabled - using console log for now
  console.log('Contact form submission:', {
    from: `${body.name} <${body.email}>`,
    to: process.env.CONTACT_EMAIL,
    subject: `New message from ${body.name}`,
    message: body.message,
  });

  return NextResponse.json({
    success: true,
    message: 'Contact form submission logged (email functionality disabled)',
  });
}
