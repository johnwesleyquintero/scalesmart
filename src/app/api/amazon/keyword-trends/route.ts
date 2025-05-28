import {
  type KeywordTrend,
  type KeywordTrendData,
} from '@/lib/models/keyword-trends';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';
import { keywordTrendsGetSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
);

const KEYWORD_TREND_TABLE = 'keyword_trends';

function processCSVData(data: string[]): KeywordTrend[] {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  const trends: KeywordTrend[] = [];

  rows.forEach((row) => {
    const values = row.split(',');
    const volume = Number(values[headers.indexOf('volume')]);
    const date = values[headers.indexOf('date')];
    const keyword = values[headers.indexOf('keyword')];

    trends.push({
      keyword,
      date,
      volume,
      createdAt: new Date(),
    });
  });

  return trends;
}

export async function POST(request: Request) {
  try {
    const { csvData } = (await request.json()) as { csvData: string[] };
    let trendData: KeywordTrendData[] = [];

    if (csvData.length === 0) {
      throw new Error(
        'Please provide valid CSV data for keyword trend analysis',
      );
    }

    // Process and store the data
    const trends = processCSVData(csvData);
    const { error: insertError } = await supabase
      .from(KEYWORD_TREND_TABLE)
      .insert(trends);

    if (insertError) throw insertError;

    // Retrieve and format the data
    const dates = [...new Set(trends.map((t) => t.date))].sort((a, b) =>
      a.localeCompare(b),
    );
    const keywords = [...new Set(trends.map((t) => t.keyword))];

    trendData = await Promise.all(
      dates.map(async (date) => {
        const dataPoint: KeywordTrendData = { name: date };
        const { data: dateEntries, error: queryError } = await supabase
          .from(KEYWORD_TREND_TABLE)
          .select('*')
          .eq('date', date);

        if (queryError) throw queryError;

        keywords.forEach((keyword) => {
          const entry = dateEntries.find(
            (e: KeywordTrend) => e.keyword === keyword,
          ) as KeywordTrend | undefined;
          dataPoint[keyword] = entry ? entry.volume : 0;
        });
        return dataPoint;
      }),
    );

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Error processing keyword trends:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      keyword: searchParams.get('keyword') || undefined,
    };

    const validationResult = keywordTrendsGetSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((err) => err.message).join(', ');
      return NextResponse.json(
        createErrorResponse(`Invalid query parameters: ${errorMessages}`, 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }

    const { keyword } = validationResult.data;

    let query = supabase.from(KEYWORD_TREND_TABLE).select('*');

    if (keyword) {
      query = query.eq('keyword', keyword);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching keyword trends:', error);
      return NextResponse.json(
        createErrorResponse('Error fetching keyword trends', 'DATABASE_ERROR'),
        { status: 500 },
      );
    }

    // Format data for visualization
    const dates = [...new Set(data.map((t) => t.date))].sort((a, b) =>
      a.localeCompare(b),
    );
    const keywordsInResult = [...new Set(data.map((t) => t.keyword))];

    const trendData: KeywordTrendData[] = dates.map((date) => {
      const dataPoint: KeywordTrendData = { name: date };
      keywordsInResult.forEach((kw) => {
        const entry = data.find(
          (e: KeywordTrend) => e.date === date && e.keyword === kw,
        ) as KeywordTrend | undefined;
        dataPoint[kw] = entry ? entry.volume : 0;
      });
      return dataPoint;
    });

    return NextResponse.json(trendData);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse(`Validation error: ${error.errors.map((err) => err.message).join(', ')}`, 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }
    console.error('Error fetching keyword trends:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
