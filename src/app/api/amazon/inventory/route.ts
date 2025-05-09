import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { InventoryData } from '../../../../lib/amazon-types';
import { AmazonAlgorithms } from '../../../../lib/calculations/amazon-algorithms';

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();

    const schema = z.object({
      productId: z.string(),
      salesLast30Days: z.number().optional(),
      leadTime: z.number().optional(),
      currentInventory: z.number(),
      averageDailySales: z.number(),
      safetyStock: z.number(),
      status: z.enum(['healthy', 'low', 'excess', 'critical']),
    });

    const parsedInventoryData = schema.safeParse(requestBody);

    if (!parsedInventoryData.success) {
      console.log(parsedInventoryData.error.issues);
      return NextResponse.json(
        { error: 'Invalid inventory data' },
        { status: 400 },
      );
    }

    const inventoryData: InventoryData =
      parsedInventoryData.data as InventoryData;

    // Validate required fields
    if (!inventoryData.salesLast30Days || !inventoryData.leadTime) {
      return NextResponse.json(
        { error: 'Missing required inventory parameters' },
        { status: 400 },
      );
    }

    const recommendation = AmazonAlgorithms.calculateInventoryRecommendation(
      inventoryData.currentInventory,
      inventoryData.averageDailySales,
    );

    return NextResponse.json({
      data: recommendation,
      analysis: {
        message: 'Real-time inventory optimization calculated',
        timestamp: new Date().toISOString(),
        algorithmVersion: '1.0.0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process inventory optimization', details: error },
      { status: 500 },
    );
  }
}
