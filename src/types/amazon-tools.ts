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
}

export interface KeywordTrackingData {
  keyword: string;
  rank: number;
  searchVolume: number;
}

export interface ListingOptimizationData {
  title: string;
  bulletPoints: string[];
  description: string;
}

export interface AnalyticsData {
  totalSales: number;
  unitsSold: number;
  salesTrend: { date: string; sales: number }[];
}

export type DataType =
  | ProductResearchData
  | KeywordTrackingData
  | ListingOptimizationData
  | AnalyticsData;
