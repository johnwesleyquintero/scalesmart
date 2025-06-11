import { NextRequest, NextResponse } from 'next/server';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
  try {
    // Assuming the request body contains a JSON object with a 'prompt' field
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        createErrorResponse('Invalid request body. "prompt" field is required and must be a string.', 'INVALID_INPUT'),
        { status: 400 }
      );
    }

    const recommendation = await getAIDrivenRecommendation(prompt);

    return NextResponse.json({ recommendation });

  } catch (error) {
    console.error('Amazon Tools Recommendation API Error:', error);
    // Use the centralized error handler
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}