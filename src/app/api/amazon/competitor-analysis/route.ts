import { InventoryOptimizationError } from '@/lib/amazon-tools/errors/errors';
import { loadStaticData } from '@/lib/load-static-data';
import { z } from 'zod';
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
  const result: CompetitorData[] = [];
  for (const row of rows) {
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
      obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
    }
    result.push(obj);
  }
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
    return new Response(parsedBody.error.message, { status: 400 });
  }

  try {
    const { metrics, sellerData, competitorData } = parsedBody.data;

    // Process uploaded CSV data
    const metricsData: MetricsData = {};

    if (!sellerData || !competitorData) {
      throw new Error(
        'Please provide both seller and competitor CSV data files for analysis',
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
      throw new Error(
        'Please provide either CSV data files or an ASIN for analysis',
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
        JSON.stringify({
          message: err.message,
          code: err.errorCode,
          details: err.details,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }
    return new Response(
      JSON.stringify({
        message:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
