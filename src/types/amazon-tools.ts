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

export type DataType =
  | ProductResearchData
  | KeywordTrackingData
  | ListingOptimizationData
  | AnalyticsData;
