import { NextResponse } from 'next/server';
import { AmazonAlgorithms } from '../../../../lib/calculations/amazon-algorithms';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const schema = z.object({
      basePrice: z.number(),
      competition: z.array(z.number()),
      demandFactor: z.number(),
    });

    const requestBody = await request.json();
    const parsedData = schema.safeParse(requestBody);

    if (!parsedData.success) {
      console.error('[API Pricing] Validation Error:', parsedData.error.issues);
      const errorResponse = createErrorResponse(
        'Invalid pricing data',
        'VALIDATION_ERROR',
        parsedData.error.issues,
      );
      console.log('[API Pricing] Sending error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { basePrice, competition, demandFactor } = parsedData.data;

    if (!basePrice || !competition.length || !demandFactor) {
      const errorResponse = createErrorResponse(
        'Missing required pricing parameters',
        'MISSING_PARAMETERS',
      );
      console.log(
        '[API Pricing] Sending missing parameters error response:',
        errorResponse,
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const optimalPrice = AmazonAlgorithms.calculateOptimalPrice(
      parsedData.data.basePrice,
      parsedData.data.competition[0],
      [parsedData.data.demandFactor],
      Array(30).fill(95),
      0.8,
      1.2,
    );

    const successResponse = {
      data: { optimalPrice },
      analysis: {
        message: 'Dynamic pricing calculation completed',
        timestamp: new Date().toISOString(),
        algorithmVersion: '1.1.0',
      },
    };
    console.log('[API Pricing] Sending success response:', successResponse);
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error('[API Pricing] Uncaught error:', error);
    const errorResponse = handleApiError(error);
    console.log('[API Pricing] Sending API error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: Request) {
  console.log('[API Pricing] GET request received, not supported.');
  return NextResponse.json(
    createErrorResponse('Method Not Allowed', 'METHOD_NOT_ALLOWED'),
    { status: 405, headers: { Allow: 'POST' } },
  );
}
