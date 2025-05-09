import { logError } from '../error-handling';

interface ApiClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000; // Default 30s timeout
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
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
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      logError({
        message: `API request failed: ${endpoint}`,
        component: 'ApiClient',
        severity: 'high',
        error: error as Error,
      });
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
    return this.request('/keywords/analyze', {
      method: 'POST',
      body: JSON.stringify({ keywords }),
    });
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
    return this.request('/sales/estimate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
});
