// src/types/amazon-tools.ts

// Interface for calculation data stored in IndexedDB (used by Amazon Tools)
export interface CalculationData {
  campaign: string;
  adSpend: number;
  sales: number;
  impressions?: number;
  clicks?: number;
  acos?: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  revenuePerClickRate?: number;
  date: string; // ISO string
  currencySymbol?: string; // Added based on usage in acos-calculator
}

export interface ParsedFileData<T> {
  fileName: string;
  data: T[]; // Or a more specific type based on expected data structure
}

export interface ProductResearchData {
  name: string;
  price: number;
  asin: string;
  brand?: string; // Added brand
  category?: string; // Added category
  reviews?: number; // Added reviews
  rating?: number; // Added rating
}

export interface KeywordTrackingData {
  keyword: string;
  rank: number;
  searchVolume: number;
  competition?: string; // Added competition
  cpc?: number; // Added cpc
}

export interface ListingOptimizationData {
  title: string;
  bulletPoints: string[];
  description: string;
  backendKeywords?: string; // Added backendKeywords
  subjectMatter?: string; // Added subjectMatter
}

export interface AnalyticsData {
  date?: string; // Added date for potential time-series analysis
  totalSales?: number; // Made optional to allow for missing data in tests/real-world scenarios
  unitsSold?: number; // Made optional for consistency with totalSales
  salesTrend: { date: string; sales: number }[];
  acos?: number; // Added acos
  roas?: number; // Added roas
  impressions?: number; // Added impressions
  clicks?: number; // Added clicks
  cpc?: number; // Added cpc
}

export interface CompetitorMonitoringData {
  asin: string;
  productName: string;
  currentPrice: number;
  historicalPrices?: { date: string; price: number }[];
  bsr?: number; // Best Seller Rank
  reviewsCount?: number;
  rating?: number;
  stockLevel?: string; // e.g., "In Stock", "Low Stock", "Out of Stock"
  keywordPerformance?: { keyword: string; rank: number }[];
}

export enum InventoryHealthStatus {
  HEALTHY = 'healthy',
  LOW = 'low',
  EXCESS = 'excess',
  CRITICAL = 'critical',
}

export interface InventoryData {
  productId: string;
  currentInventory: number;
  averageDailySales: number;
  salesLast30Days?: number;
  leadTime?: number;
  safetyStock: number;
  status: InventoryHealthStatus;
  lastUpdated?: string; // ISO date string
}

export interface CustomerReviewData {
  reviewId: string;
  asin: string;
  rating: number;
  title: string;
  body: string;
  date: string; // ISO date string
  sentiment?: 'positive' | 'negative' | 'neutral'; // AI-derived sentiment
  themes?: string[]; // AI-derived themes
}

export type DataType =
  | ProductResearchData
  | KeywordTrackingData
  | ListingOptimizationData
  | AnalyticsData
  | CompetitorMonitoringData
  | InventoryData
  | CustomerReviewData;
