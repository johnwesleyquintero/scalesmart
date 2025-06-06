import { getItem, setItem } from '@/lib/indexeddb-service';
import { logError } from '@/lib/error-handling';
import { format, isValid, parse } from 'date-fns';
import { z } from 'zod';

// --- Constants ---
const API_BASE_URL = 'https://api.keywordtrends.com/v1';
const INDEXED_DB_STORE_NAME = 'keywordTrendsCache';
const DATE_FORMAT_ISO = 'yyyy-MM-dd';
const DATE_FORMATS = [DATE_FORMAT_ISO, 'MM/dd/yyyy', 'dd-MM-yyyy'] as const;
const SUPPORTED_DATE_FORMATS_STR = DATE_FORMATS.join(', ');
const MAX_DATA_POINTS_PER_REQUEST = 1000;
const API_BATCH_SIZE = 50;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hour cache duration

// Define constants for duplicate strings
const ERROR_MESSAGE_PREFIX = 'KeywordTrendService';
const CACHE_READ_FAILED = 'Cache read failed';
const CACHE_WRITE_FAILED = 'Cache write failed';
const BATCH_API_REQUEST_FAILED = 'Batch API request failed';
const API_REQUEST_FAILED = 'API request failed';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

// --- Types ---
export interface TrendDataPoint {
  date: string;
  keywords: Record<string, number>;
}

export interface TrendAnalysisResult {
  chartData: TrendDataPoint[];
  keywords: string[];
  cachedAt?: Date;
}

// --- Custom Error Types ---
class KeywordTrendError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'KeywordTrendError';
  }
}

class ApiRequestError extends KeywordTrendError {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

class ValidationError extends KeywordTrendError {
  constructor(
    message: string,
    public readonly validationErrors?: unknown[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// --- Validation Schemas ---
const dateSchema = z
  .string()
  .refine(
    (date) => DATE_FORMATS.some((fmt) => isValid(parse(date, fmt, new Date()))),
    `Invalid date format. Supported formats: ${SUPPORTED_DATE_FORMATS_STR}`,
  );

const searchVolumeSchema = z.union([
  z.number().min(0, 'Search volume must be non-negative'),
  z.string().transform((val, ctx) => {
    const parsed = Number(val);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Search volume must be a number',
      });
      return z.NEVER;
    }
    if (parsed < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Search volume must be non-negative',
      });
      return z.NEVER;
    }
    return parsed;
  }),
]);

export const trendDataSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100),
  date: dateSchema,
  search_volume: searchVolumeSchema,
});

export type TrendDataInput = z.infer<typeof trendDataSchema>;

const apiResponseSchema = z.object({
  searchVolume: z.number().min(0),
  rateLimitRemaining: z.number().optional(),
  rateLimitReset: z.number().optional(),
});

// --- Utility Functions ---
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(processor))));
  }
  return results;
}

// --- Service Implementation ---
export class KeywordTrendService {
  private static async fetchTrendDataBatch(
    requests: { keyword: string; date: string }[],
  ): Promise<number[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/search-volume/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      });

      if (!response.ok) {
        throw new ApiRequestError(
          response.status,
          `${API_BASE_URL}/search-volume/batch`,
          `${BATCH_API_REQUEST_FAILED} with status ${response.status}`,
        );
      }

      const data = await response.json();
      return z
        .array(apiResponseSchema)
        .parse(data)
        .map((r) => r.searchVolume);
    } catch (error) {
      logError({
        message: BATCH_API_REQUEST_FAILED,
        component: `${ERROR_MESSAGE_PREFIX}.fetchTrendDataBatch`,
        severity: 'high',
        error:
          error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE),
        context: { requestCount: requests.length },
      });
      throw error;
    }
  }

  private static async getCachedResult(
    cacheKey: string,
  ): Promise<TrendAnalysisResult | null> {
    try {
      const cached = await getItem<{
        result: TrendAnalysisResult;
        cachedAt: number;
      }>(cacheKey);

      if (!cached) return null;

      if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
        return null;
      }

      return { ...cached.result, cachedAt: new Date(cached.cachedAt) };
    } catch (error) {
      logError({
        message: CACHE_READ_FAILED,
        component: `${ERROR_MESSAGE_PREFIX}.getCachedResult`,
        severity: 'low',
        error:
          error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE),
      });
      return null;
    }
  }

  private static async setCachedResult(
    cacheKey: string,
    result: TrendAnalysisResult,
  ): Promise<void> {
    try {
      await setItem(cacheKey, { result, cachedAt: Date.now() });
    } catch (error) {
      logError({
        message: CACHE_WRITE_FAILED,
        component: `${ERROR_MESSAGE_PREFIX}.setCachedResult`,
        severity: 'medium',
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  private static getCacheKey(data: TrendDataInput[]): string {
    const sortedData = [...data].sort((a, b) => {
      const keywordCompare = a.keyword.localeCompare(b.keyword);
      return keywordCompare !== 0
        ? keywordCompare
        : a.date.localeCompare(b.date);
    });

    return `trends:${sortedData
      .map((d) => `${d.keyword}:${d.date}`)
      .join('|')}`;
  }

  private static standardizeDate(dateStr: string): string {
    for (const fmt of DATE_FORMATS) {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        return format(parsed, DATE_FORMAT_ISO);
      }
    }

    throw new ValidationError(
      `Unsupported date format: "${dateStr}". Supported formats: ${SUPPORTED_DATE_FORMATS_STR}`,
    );
  }

  private static validateInput(rawData: unknown[]): void {
    if (!rawData?.length) {
      throw new ValidationError('No data provided for analysis');
    }

    if (rawData.length > MAX_DATA_POINTS_PER_REQUEST) {
      throw new ValidationError(
        `Maximum of ${MAX_DATA_POINTS_PER_REQUEST} data points allowed per request`,
      );
    }
  }

  private static async processRawData(
    rawData: unknown[],
  ): Promise<TrendDataInput[]> {
    try {
      const parsedData = z.array(trendDataSchema).parse(rawData);

      return await processInBatches(parsedData, API_BATCH_SIZE, async (row) => {
        const standardizedDate = this.standardizeDate(row.date);
        const searchVolume = await this.fetchTrendData(
          row.keyword,
          standardizedDate,
        );
        return {
          ...row,
          date: standardizedDate,
          search_volume: searchVolume,
        };
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Data validation failed', error.errors);
      }
      throw error;
    }
  }

  private static transformToChartData(
    validatedData: TrendDataInput[],
  ): TrendAnalysisResult {
    const dateMap = new Map<string, Map<string, number>>();
    const keywordSet = new Set<string>();

    for (const { keyword, date, search_volume } of validatedData) {
      keywordSet.add(keyword);

      if (!dateMap.has(date)) {
        dateMap.set(date, new Map());
      }
      dateMap.get(date)?.set(keyword, search_volume);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const sortedKeywords = Array.from(keywordSet).sort();

    const chartData = sortedDates.map((date) => ({
      date,
      keywords: Object.fromEntries(
        sortedKeywords.map((kw) => [kw, dateMap.get(date)?.get(kw) ?? 0]),
      ),
    }));

    return {
      chartData,
      keywords: sortedKeywords,
    };
  }

  public static async analyzeTrends(
    rawData: unknown[],
  ): Promise<TrendAnalysisResult> {
    this.validateInput(rawData);

    const cacheKey = this.getCacheKey(rawData as TrendDataInput[]);
    const cachedResult = await this.getCachedResult(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const validatedData = await this.processRawData(rawData);
    const result = this.transformToChartData(validatedData);

    await this.setCachedResult(cacheKey, result);

    return result;
  }

  private static async fetchTrendData(
    keyword: string,
    date: string,
  ): Promise<number> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/search-volume?keyword=${encodeURIComponent(keyword)}&date=${date}`,
      );

      if (!response.ok) {
        throw new ApiRequestError(
          response.status,
          `${API_BASE_URL}/search-volume`,
          `${API_REQUEST_FAILED} with status ${response.status}`,
        );
      }

      const data = await response.json();
      return z.number().parse(data.searchVolume);
    } catch (error) {
      logError({
        message: API_REQUEST_FAILED,
        component: `${ERROR_MESSAGE_PREFIX}.fetchTrendData`,
        severity: 'high',
        error:
          error instanceof Error ? error : new Error(UNKNOWN_ERROR_MESSAGE),
        context: { keyword, date },
      });
      throw error;
    }
  }
}
