// src/lib/amazon-tools/keyword-trend-service.ts
import { getItem, setItem } from '@/lib/indexeddb-service';
import { logError } from '@/lib/error-handling';
import { format, isValid, parse } from 'date-fns';
import { z } from 'zod';

// const STANDARD_DATE_FORMAT = 'yyyy-MM-dd';

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
const DATE_FORMATS = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy'] as const;

export const trendDataSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100),
  date: z.string().refine(
    (date) => {
      // Try parsing with multiple date formats
      return DATE_FORMATS.some((fmt) => {
        const parsed = parse(date, fmt, new Date());
        return isValid(parsed);
      });
    },
    `Invalid date format. Supported formats: ${DATE_FORMATS.join(', ')}`,
  ),
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

  private static standardizeDate(dateStr: string): string {
    let standardDate = '';

    for (const fmt of DATE_FORMATS) {
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
      console.time(`Load keyword trends for ${cacheKey} from cache`);
      const cached = await getItem(cacheKey);
      console.timeEnd(`Load keyword trends for ${cacheKey} from cache`);

      // Return cached data if valid
      if (cached) {
        return cached as TrendAnalysisResult;
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
      console.time(`Save keyword trends for ${cacheKey} to cache`);
      await setItem(cacheKey, result);
      console.timeEnd(`Save keyword trends for ${cacheKey} to cache`);

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

  // Rollback strategy: To revert to the previous version, simply remove the IndexedDB code
}
