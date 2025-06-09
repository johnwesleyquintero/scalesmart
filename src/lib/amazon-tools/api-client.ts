// Amazon Tools API Client
// This file contains the API client for interacting with the Amazon Tools API.
import { logError } from '../error-handling';

/**
 * Options for configuring the ApiClient.
 */
interface ApiClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * A client for interacting with the Amazon Tools API.
 * Handles request construction, timeouts, and basic error handling.
 */
class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  /**
   * Creates an instance of ApiClient.
   * @param options - Configuration options for the client.
   */
  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000; // Default 30s timeout
  }

  /**
   * Makes a generic API request to the specified endpoint.
   * @template T - The expected response type.
   * @param endpoint - The API endpoint (e.g., '/keywords/analyze').
   * @param options - Standard RequestInit options for the fetch call.
   * @returns A promise that resolves with the parsed JSON response.
   * @throws {Error} If the network request fails or the response is not OK.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Construct headers carefully
      const finalHeaders = new Headers(options.headers); // Initialize with incoming headers
      finalHeaders.set('Content-Type', 'application/json'); // Set/overwrite our default
      if (this.apiKey) {
        finalHeaders.set('X-Api-Key', this.apiKey); // Add API key
      }

      // Construct fetch options to be type-safe
      const fetchOptions: RequestInit = {
        ...options, // Spread other options like method, body, etc.
        headers: finalHeaders, // Use the carefully constructed headers
        signal: controller.signal,
      };

      const response = await fetch(fullUrl, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text(); // Attempt to get more error details
        } catch {
          // Ignore if body cannot be read
        }
        const message = `API Error for ${fullUrl}: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 100)}`;
        logError({
          message,
          component: 'ApiClient',
          severity: 'high',
          error: new Error(message),
        });
        throw new Error(message);
      }

      return response.json();
    } catch (error) {
      logError({
        message: `API request failed for ${fullUrl}`,
        component: 'ApiClient',
        severity: 'high',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Calls the Keyword Intelligence API to analyze a list of keywords.
   * @param keywords - An array of keywords to analyze.
   * @returns A promise resolving to an array of keyword analysis results.
   */
  async analyzeKeywords(keywords: string[]): Promise<
    {
      keyword: string;
      searchVolume: number;
      competition: number;
      trend: number[];
    }[]
  > {
    return this.request('/keywords/analyze', {
      method: 'POST',
      body: JSON.stringify({ keywords }),
    });
  }

  /**
   * Fetches data for a specific ASIN from the ASIN Data API.
   * @param asin - The ASIN (Amazon Standard Identification Number) to retrieve data for.
   * @returns A promise resolving to the ASIN's detailed data.
   */
  async getAsinData(asin: string): Promise<{
    title: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    reviewCount: number;
    bsr: number;
  }> {
    try {
      return await this.request(`/asin/${asin}`);
    } catch (error) {
      logError({
        message: `Failed to get ASIN data for ASIN: ${asin}`,
        component: 'ApiClient',
        severity: 'medium',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error; // Re-throw the error to be handled by the component
    }
  }

  /**
   * Analyzes competition for a given ASIN using the Competition Analysis API.
   * @param asin - The ASIN for which to analyze competition.
   * @returns A promise resolving to competition data and market metrics.
   */
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

  /**
   * Estimates sales based on product category, BSR, and price using the Sales Estimation API.
   * @param params - Parameters for sales estimation (category, bsr, price).
   * @returns A promise resolving to estimated monthly sales, confidence, and range.
   */
  async estimateSales(params: {
    category: string;
    bsr: number;
    price: number;
  }): Promise<{
    estimatedMonthlySales: number;
    confidence: number;
    range: { min: number; max: number };
  }> {
    return this.request('/sales/estimate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

/**
 * Singleton instance of the ApiClient for global use.
 * Configured with base URL and API key from environment variables.
 */
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
});
