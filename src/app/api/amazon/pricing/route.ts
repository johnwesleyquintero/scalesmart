import { NextResponse } from 'next/server';
import { AmazonAlgorithms } from '../../../../lib/calculations/amazon-algorithms';

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
      console.log(parsedData.error.issues);
      return NextResponse.json(
        { error: 'Invalid pricing data' },
        { status: 400 },
      );
    }

    const { basePrice, competition, demandFactor } = parsedData.data;

    if (!basePrice || !competition.length || !demandFactor) {
      return NextResponse.json(
        { error: 'Missing required pricing parameters' },
        { status: 400 },
      );
    }

    const optimalPrice = AmazonAlgorithms.calculateOptimalPrice(
      parsedData.data.basePrice,
      parsedData.data.competition[0],
      [parsedData.data.demandFactor],
      Array(30).fill(95),
      0.8,
      1.2,
    );

    return NextResponse.json({
      data: { optimalPrice },
      analysis: {
        message: 'Dynamic pricing calculation completed',
        timestamp: new Date().toISOString(),
        algorithmVersion: '1.1.0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process pricing strategy', details: error },
      { status: 500 },
    );
  }
}
