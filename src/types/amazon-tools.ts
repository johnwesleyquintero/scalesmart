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
