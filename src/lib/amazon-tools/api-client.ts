import { fetchKeywordAnalysis } from '@/lib/api/keyword-analysis';
import { useCacheStore } from '@/stores/cache-store';
import { ApiError, handleApiError } from '../api/error-handler';
import { logger } from '../api/logger';
import { retryRequest } from '../api/retry';

interface ApiClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  listingDataEndpoint?: string;
}

class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private listingDataEndpoint?: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000; // Default 30s timeout
    this.listingDataEndpoint = options.listingDataEndpoint;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const startTime = Date.now();
    logger.info(`API Request: ${endpoint}`, {
      url: `${this.baseUrl}${endpoint}`,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    });

    try {
      const response = await retryRequest(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'X-Api-Key': this.apiKey }),
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText} - ${endpoint}`,
          );
        }

        return response;
      });

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info(`API Response: ${endpoint}`, {
        url: `${this.baseUrl}${endpoint}`,
        status: response.status,
        responseTime: responseTime,
        data: data,
      });

      return data as { estimatedMonthlySales: number; confidence: number; range: { min: number; max: number; } } | undefined;
    } catch (error: unknown) {
      handleApiError(error, { url: endpoint, method: options.method });
      throw error;
    }
  }

  // Keyword Intelligence API
  async analyzeKeywords(keywords: string[]): Promise<
    {
      keyword: string;
      searchVolume: number;
      competition: number;
      trend: number[];
    }[]
  > {
    // Use fetchKeywordAnalysis to get the keyword analysis data
    const listingData = { title: keywords.join(', ') };
    const analysisResults = await fetchKeywordAnalysis(listingData);
    return analysisResults;
  }

  // ASIN Data API
  async getAsinData(asin: string): Promise<{
    title: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    reviewCount: number;
    bsr: number;
  }> {
    return this.request(`/asin/${asin}`);
  }

  // Competition Analysis API
  async analyzeCompetition(asin: string): Promise<{
    competitors: Array<{
      asin: string;
      price: number;
      rating: number;
      reviewCount: number;
      bsr: number;
    }>;
    marketMetrics: {
      averagePrice: number;
      averageRating: number;
      averageReviewCount: number;
      competitionLevel: 'low' | 'medium' | 'high';
    };
  }> {
    return this.request(`/competition/${asin}`);
  }

  // Sales Estimation API
  async estimateSales(params: {
    category: string;
    bsr: number;
    price: number;
  }): Promise<{
    estimatedMonthlySales: number;
    confidence: number;
    range: { min: number; max: number };
  }> {
    const cacheKey = `sales-estimate:${JSON.stringify(params)}`;
    const ttl = 3600; // 1 hour

    const cachedData = (await useCacheStore.getState().getItem(cacheKey)) as { estimatedMonthlySales: number; confidence: number; range: { min: number; max: number; } } | undefined;

    if (cachedData && typeof cachedData === 'object' && 'estimatedMonthlySales' in cachedData && 'confidence' in cachedData && 'range' in cachedData) {
      logger.info(`Sales estimate from cache - ${cacheKey}`);
      return cachedData;
    }

    try {
      const data = await this.request<{
        estimatedMonthlySales: number;
        confidence: number;
        range: { min: number; max: number };
      }>('/sales/estimate', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      await useCacheStore.getState().setItem(cacheKey, data);
      logger.info(`Sales estimate stored in cache - ${cacheKey} - ttl: ${ttl}`);
      return data as { estimatedMonthlySales: number; confidence: number; range: { min: number; max: number; } } | undefined;
    } catch (error: unknown) {
      logger.error(`Sales estimate API error - ${(error as Error).message}`, {
        url: '/sales/estimate',
        method: 'POST',
        params: params,
      });

      if (error instanceof ApiError) {
        handleApiError(error, { url: '/sales/estimate', method: 'POST' });
        throw error;
      } else {
        // Wrap the error in an ApiError for consistent handling
        const apiError = new ApiError(500, 'Failed to estimate sales', error);
        handleApiError(apiError, { url: '/sales/estimate', method: 'POST' });
        throw apiError;
      }
    }
  }

  // Listing Data API
  async getListingData(asin: string): Promise<unknown> {
    if (!this.listingDataEndpoint) {
      throw new Error('Listing data endpoint is not configured.');
    }
    return this.request(`${this.listingDataEndpoint}/${asin}`);
  }
}

// Create and export a singleton instance

const apiKey = process.env.NEXT_PUBLIC_API_KEY;
if (!apiKey) {
  console.warn('NEXT_PUBLIC_API_KEY is not set. API requests may fail.');
}

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
  apiKey: apiKey,
  listingDataEndpoint: process.env.NEXT_PUBLIC_LISTING_DATA_ENDPOINT,
});
