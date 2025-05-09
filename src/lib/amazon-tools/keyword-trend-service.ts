// src/lib/amazon-tools/keyword-trend-service.ts
import { logError } from '@/lib/error-handling';
import { format, isValid, parse } from 'date-fns';
import { z } from 'zod';

// --- Types ---
export interface TrendDataPoint {
  date: string;
  [keyword: string]: string | number;
}

export interface TrendAnalysisResult {
  chartData: TrendDataPoint[];
  keywords: string[];
}

// --- Validation Schemas ---
export const trendDataSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100),
  date: z.string().refine((date) => {
    // Try parsing with multiple date formats
    const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    return formats.some((fmt) => {
      const parsed = parse(date, fmt, new Date());
      return isValid(parsed);
    });
  }, 'Invalid date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY'),
  search_volume: z.union([
    z.number().min(0, 'Search volume must be non-negative'),
    z.string().transform((val, ctx) => {
      const parsed = Number(val);
      if (isNaN(parsed) || parsed < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Search volume must be a non-negative number',
        });
        return z.NEVER;
      }
      return parsed;
    }),
  ]),
});

export type TrendDataInput = z.infer<typeof trendDataSchema>;

// --- Cache Implementation ---
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const trendCache = new Map<
  string,
  { data: TrendAnalysisResult; timestamp: number }
>();

// --- Service Implementation ---
export class KeywordTrendService {
  private static async fetchTrendData(
    keyword: string,
    date: string,
  ): Promise<number> {
    try {
      const response = await fetch(
        `https://api.keywordtrends.com/v1/search-volume?keyword=${encodeURIComponent(keyword)}&date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.KEYWORD_TREND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.searchVolume;
    } catch (error) {
      logError({
        message: 'Failed to fetch trend data from API',
        component: 'KeywordTrendService',
        severity: 'high',
        error: error as Error,
        context: { keyword, date },
      });
      throw error;
    }
  }

  private static getCacheKey(data: TrendDataInput[]): string {
    return JSON.stringify(
      data.map((d) => ({ k: d.keyword, d: d.date })).sort(),
    );
  }

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  private static standardizeDate(dateStr: string): string {
    const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    let standardDate = '';

    for (const fmt of formats) {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        standardDate = format(parsed, 'yyyy-MM-dd');
        break;
      }
    }

    if (!standardDate) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    return standardDate;
  }

  public static async analyzeTrends(
    rawData: unknown[],
  ): Promise<TrendAnalysisResult> {
    // Validate input data exists
    if (!rawData || rawData.length === 0) {
      throw new Error('No data provided for analysis');
    }

    // Validate each data point doesn't exceed API limits
    if (rawData.length > 1000) {
      throw new Error('Maximum of 1000 data points allowed per request');
    }

    try {
      // Generate cache key from input data
      const cacheKey = this.getCacheKey(rawData as TrendDataInput[]);
      const cached = trendCache.get(cacheKey);

      // Return cached data if valid
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }

      // Validate and process each row
      const validatedData = await Promise.all(
        rawData.map(async (row) => {
          const validated = trendDataSchema.parse(row);
          return {
            ...validated,
            date: this.standardizeDate(validated.date),
            search_volume: await this.fetchTrendData(
              validated.keyword,
              validated.date,
            ),
          };
        }),
      );

      // Transform data for chart
      const dataByDate: { [date: string]: { [keyword: string]: number } } = {};
      const keywords = new Set<string>();

      validatedData.forEach(({ keyword, date, search_volume }) => {
        keywords.add(keyword);
        if (!dataByDate[date]) {
          dataByDate[date] = {};
        }
        dataByDate[date][keyword] = search_volume;
      });

      const sortedDates = Object.keys(dataByDate).sort();
      const keywordList = Array.from(keywords);

      const chartData: TrendDataPoint[] = sortedDates.map((date) => {
        const point: TrendDataPoint = { date };
        keywordList.forEach((kw) => {
          point[kw] = dataByDate[date][kw] ?? 0;
        });
        return point;
      });

      const result = { chartData, keywords: keywordList };

      // Cache the results
      trendCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      logError({
        message: 'Error analyzing keyword trends',
        component: 'KeywordTrendService',
        severity: 'high',
        error: error as Error,
      });
      throw error;
    }
  }
}
