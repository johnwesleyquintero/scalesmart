// Consolidated ChartDataEntry definition

export type MetricKey = 'acos' | 'roas' | 'ctr' | 'cpc';

export type TimeRange =
  | 'last_7_days'
  | 'last_30_days'
  | 'month_to_date'
  | 'year_to_date'
  | 'all_time'
  | 'custom';

export interface DashboardViewPreferences {
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timeRange: TimeRange;
  customDateRange?: { from: Date | undefined; to: Date | undefined };
}

export type ProductCategory =
  | 'Books'
  | 'Electronics'
  | 'Home'
  | 'Sports'
  | 'General';

// Consolidated ChartDataEntry definition

// Consolidated ProductData type moved to amazon-types.ts
export interface ProductData {
  productId: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  storageDuration: number;
  unitsSold: number;
  referralFeePercentage: number;
  product: string;
  cost: number;
  price: number;
  fees: number;
  category: ProductCategory;
  profit?: number;
  roi?: number;
  margin?: number;
}

export interface KeywordData {
  product: string;
  originalKeywords: string[];
  cleanedKeywords: string[];
  duplicatesRemoved: number;
  keywords: string[];
}

// Consolidated ChartDataEntry definition

export interface CsvRow {
  [key: string]: string | number;
}

export interface ChartDataEntry {
  price: number;
  [key: string]: string | number;
}

// Consolidated ChartDataEntry definition

export interface UploaderProps {
  onUpload: (data: string | number[]) => Promise<void>;
}

export interface SampleCsvButtonProps {
  toolName: string;
}

export interface TooltipProps {
  wrapperStyle?: {
    backgroundColor: string;
    border: string;
    borderRadius: number;
  };
  formatter?: (value: string | number, name: string) => (string | number)[];
}
