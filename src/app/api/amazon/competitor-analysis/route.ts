import { InventoryOptimizationError } from '@/lib/amazon-tools/errors/errors';
import { loadStaticData } from '@/lib/load-static-data';
import { z } from 'zod';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

// Define stricter types for CSV data
interface CompetitorData {
  [key: string]: string | number;
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
}

// Type for processed metrics data
interface MetricsData {
  [metric: string]: number[];
}

function processCSVData(data: string[]): CompetitorData[] {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  const result: CompetitorData[] = rows.map((row) => {
    const values = row.split(',');
    const obj: CompetitorData = {
      asin: '',
      price: 0,
      reviews: 0,
      rating: 0,
      conversion_rate: 0,
      click_through_rate: 0,
    };

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value: string | number = values[i];

      if (
        [
          'price',
          'reviews',
          'rating',
          'conversion_rate',
          'click_through_rate',
        ].includes(header)
      ) {
        const numValue = Number(value);
        value = isNaN(numValue) ? 0 : numValue;
      }

      obj[header] = value;
    }
    return obj;
  });
  return result;
}

export async function POST(request: Request) {
  const schema = z.object({
    asin: z.string().optional(),
    metrics: z.array(z.string()).optional(),
    sellerData: z.array(z.string()).optional(),
    competitorData: z.array(z.string()).optional(),
  });

  const parsedBody = schema.safeParse(await request.json());

  if (!parsedBody.success) {
    console.log(parsedBody.error.issues);
    return new Response(
      JSON.stringify(
        createErrorResponse(
          parsedBody.error.message,
          'VALIDATION_ERROR',
          parsedBody.error.issues,
        ),
      ),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { metrics, sellerData, competitorData } = parsedBody.data;

    // Process uploaded CSV data
    const metricsData: MetricsData = {};

    if (!sellerData || !competitorData) {
      throw new InventoryOptimizationError(
        'Please provide both seller and competitor CSV data files for analysis',
        'MISSING_DATA',
      );
    }

    const sellerRows = processCSVData(sellerData);
    const competitorRows = processCSVData(competitorData);
    const allData = [...sellerRows, ...competitorRows];

    if (metrics) {
      metrics.forEach((metric: string) => {
        metricsData[metric] = allData.map((row) => row[metric] as number);
      });
    } else {
      throw new InventoryOptimizationError(
        'Please provide either CSV data files or an ASIN for analysis',
        'MISSING_METRICS_OR_ASIN',
      );
    }

    const data = await loadStaticData('case-studies');

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    if (err instanceof InventoryOptimizationError) {
      return new Response(
        JSON.stringify(
          createErrorResponse(err.message, err.errorCode, err.details),
        ),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }
    return new Response(JSON.stringify(handleApiError(err)), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
