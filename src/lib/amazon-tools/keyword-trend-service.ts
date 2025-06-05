import { getItem, setItem } from '@/lib/indexeddb-service';
import { logError } from '@/lib/error-handling';
import { format, isValid, parse } from 'date-fns';
import { z } from 'zod';

// --- Constants ---
const API_BASE_URL = 'https://api.keywordtrends.com/v1';
const INDEXED_DB_STORE_NAME = 'keywordTrendsCache';
const DATE_FORMATS = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy'] as const;
const MAX_DATA_POINTS_PER_REQUEST = 1000;

// --- Types ---
/**
 * Represents a single data point in the trend analysis chart.
 * Contains a date and dynamic keyword-search volume pairs.
 */
export interface TrendDataPoint {
  date: string;
  [keyword: string]: string | number; // Dynamic keys for keyword search volumes
}

/**
 * Represents the complete result of a keyword trend analysis.
 */
export interface TrendAnalysisResult {
  chartData: TrendDataPoint[];
  keywords: string[];
}

// --- Validation Schemas ---
/**
 * Zod schema for validating individual keyword trend data inputs.
 */
export const trendDataSchema = z.object({
  /**
   * The keyword string.
   * Must be at least 1 character and at most 100 characters.
   */
  keyword: z.string().min(1, 'Keyword is required').max(100),
  /**
   * The date string associated with the trend data.
   * Validated against multiple common date formats.
   */
  date: z
    .string()
    .refine(
      (date) =>
        DATE_FORMATS.some((fmt) => isValid(parse(date, fmt, new Date()))),
      `Invalid date format. Supported formats: ${DATE_FORMATS.join(', ')}`,
    ),
  /**
   * The search volume for the keyword on the given date.
   * Can be a number or a string that transforms into a non-negative number.
   */
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

/**
 * Type inferred from `trendDataSchema` for validated input data.
 */
export type TrendDataInput = z.infer<typeof trendDataSchema>;

// --- Service Implementation ---
/**
 * Manages fetching, caching, and analyzing keyword trend data.
 * Utilizes an external API and IndexedDB for caching.
 */
export class KeywordTrendService {
  /**
   * Fetches search volume data for a specific keyword and date from the external API.
   * @param keyword - The keyword to fetch data for.
   * @param date - The date in 'yyyy-MM-dd' format.
   * @returns A promise that resolves with the search volume number.
   * @throws {Error} If the API request fails or returns a non-OK status.
   */
  private static async fetchTrendData(
    keyword: string,
    date: string,
  ): Promise<number> {
    const fullUrl = `${API_BASE_URL}/search-volume?keyword=${encodeURIComponent(keyword)}&date=${date}`;
    try {
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${process.env.KEYWORD_TREND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed for ${fullUrl} with status ${response.status}`,
        );
      }

      const data = await response.json();
      return data.searchVolume;
    } catch (error) {
      logError({
        message: `Failed to fetch trend data from API for ${fullUrl}`,
        component: 'KeywordTrendService',
        severity: 'high',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { keyword, date },
      });
      throw error;
    }
  }

  /**
   * Generates a consistent cache key for a given set of trend data inputs.
   * The key is based on sorted keyword-date pairs to ensure uniqueness regardless of input order.
   * @param data - An array of `TrendDataInput` objects.
   * @returns A string representing the cache key.
   */
  private static getCacheKey(data: TrendDataInput[]): string {
    // Sort the data by keyword and date to ensure a consistent cache key
    const sortedData = [...data].sort((a, b) => {
      if (a.keyword !== b.keyword) return a.keyword.localeCompare(b.keyword);
      return a.date.localeCompare(b.date);
    });
    return JSON.stringify(sortedData.map((d) => ({ k: d.keyword, d: d.date })));
  }

  /**
   * Standardizes a date string to 'yyyy-MM-dd' format using predefined formats.
   * @param dateStr - The date string to standardize.
   * @returns The standardized date string.
   * @throws {Error} If the input date string cannot be parsed by any of the supported formats.
   */
  private static standardizeDate(dateStr: string): string {
    for (const fmt of DATE_FORMATS) {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd');
      }
    }
    throw new Error(
      `Failed to standardize date: "${dateStr}". It does not match any supported formats: ${DATE_FORMATS.join(', ')}`,
    );
  }

  /**
   * Analyzes keyword trends by fetching data, processing it, and structuring it for charting.
   * Includes caching mechanism using IndexedDB to reduce redundant API calls.
   * @param rawData - An array of raw data objects (expected to conform to `TrendDataInput` after validation).
   * @returns A promise that resolves with `TrendAnalysisResult` containing chart data and keywords.
   * @throws {Error} If no data is provided, or if the number of data points exceeds the API limit.
   */
  public static async analyzeTrends(
    rawData: unknown[], // Use unknown[] as input might not be fully validated yet
  ): Promise<TrendAnalysisResult> {
    if (!rawData || rawData.length === 0) {
      throw new Error('No data provided for analysis.');
    }
    if (rawData.length > MAX_DATA_POINTS_PER_REQUEST) {
      throw new Error(
        `Maximum of ${MAX_DATA_POINTS_PER_REQUEST} data points allowed per request.`,
      );
    }

    try {
      // Generate cache key from input data (after casting for getCacheKey)
      const cacheKey = this.getCacheKey(rawData as TrendDataInput[]);
      console.time(`Load keyword trends for ${cacheKey} from cache`);
      const cached = await getItem(cacheKey, INDEXED_DB_STORE_NAME);
      console.timeEnd(`Load keyword trends for ${cacheKey} from cache`);

      if (cached) {
        return cached as TrendAnalysisResult;
      }

      // Validate and process each row, fetching search volume from API
      const validatedData = await Promise.all(
        rawData.map(async (row) => {
          const validated = trendDataSchema.parse(row); // Zod validation
          const standardizedDate = this.standardizeDate(validated.date);
          const searchVolume = await this.fetchTrendData(
            validated.keyword,
            standardizedDate,
          );
          return {
            ...validated,
            date: standardizedDate,
            search_volume: searchVolume,
          };
        }),
      );

      // Transform data for chart: group by date and collect all unique keywords
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
      const keywordList = Array.from(keywords).sort(); // Sort keywords for consistent chart legend

      const chartData: TrendDataPoint[] = sortedDates.map((date) => {
        const point: TrendDataPoint = { date };
        keywordList.forEach((kw) => {
          point[kw] = dataByDate[date][kw] ?? 0; // Default to 0 if no data for a keyword on a specific date
        });
        return point;
      });

      const result = { chartData, keywords: keywordList };

      // Cache the results
      console.time(`Save keyword trends for ${cacheKey} to cache`);
      await setItem(cacheKey, result, INDEXED_DB_STORE_NAME);
      console.timeEnd(`Save keyword trends for ${cacheKey} to cache`);

      return result;
    } catch (error) {
      logError({
        message: 'Error analyzing keyword trends',
        component: 'KeywordTrendService',
        severity: 'high',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }
}
