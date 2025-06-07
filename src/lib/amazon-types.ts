/**
 * Represents various potential identifiers or attributes for a product.
 * Note: This interface combines different types (actual identifiers like ASIN/SKU/UPC
 * with descriptive attributes like keyword/niche/brand/category).
 */
export interface Identifier {
  asin: string;
  sku: string;
  upc: string;
  keyword: string;
  niche: string;
  brand: string;
  category: string;
}

/**
 * Represents a row of processed data, typically for comparison or charting.
 */
export interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number; // Review count
  rating: number; // Average rating
  conversion_rate: number;
  click_through_rate: number;
}

/**
 * Represents core performance and physical attributes of a product.
 */
export interface Product {
  conversionRate: number;
  sessions: number; // Number of sessions the product page received
  reviewRating: number; // Average review rating
  reviewCount: number; // Total number of reviews
  priceCompetitiveness: number; // Index or score indicating price position vs competitors
  inventoryHealth: number; // Index or score indicating inventory status
  weight: number; // Product weight
  volume: number; // Product volume
  category: ProductCategory;
  lastUpdated: Date;
}

/**
 * Defines the fee structure for FBA (Fulfillment by Amazon).
 */
export interface FeeStructure {
  baseFee: number; // Base fulfillment fee per unit
  perKgFee: number; // Additional fee per kilogram
  weightThreshold: number; // Weight above which perKgFee applies
  monthlyStorageFee: number; // Monthly storage fee per cubic unit
  referralPercentage: number; // Standard referral fee percentage
  categoryFees: Record<ProductCategory, number>; // Specific referral fees by category
}

/**
 * Represents FBA-specific data for a product.
 */
export interface FBAData {
  productId: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  storageDuration: number; // Days stored in fulfillment center
  unitsSold: number; // Units sold via FBA
  referralFeePercentage: number;
}

/**
 * Represents various performance and physical data points for a product.
 * Properties are optional as data might be incomplete or not always available.
 */
export interface ProductData {
  productId: string;
  conversionRate?: number;
  sessions?: number;
  reviewRating?: number;
  reviewCount?: number;
  priceCompetitiveness?: number;
  inventoryHealth?: number;
  weight?: number;
  salesVelocity?: number; // Units sold per period (e.g., day/week/month)
}

/**
 * Represents data typically found on a product listing page.
 */
export interface ProductListingData {
  asin: string;
  title: string;
  bulletPoints: string[];
  description: string;
  imageCount: number;
  rating: number; // Average customer rating
  reviewCount: number; // Total number of reviews
  hasAPlusContent: boolean; // Indicates if A+ content is present
  fulfillmentType: 'FBA' | 'FBM'; // Fulfillment method
}

/**
 * Parameters used for calculating a product's overall score.
 */
export interface ProductScoreParams {
  conversionRate: number;
  sessions: number;
  reviewRating: number;
  reviewCount: number;
  priceCompetitiveness: number;
  inventoryHealth: number;
  weight: number;
  volume: number;
  category: ProductCategory;
}

/**
 * Parameters used for determining an optimal price.
 */
export interface OptimalPriceParams {
  currentPrice: number;
  competitorPrices: number[];
  productScore: number; // Derived score from ProductScoreParams
}

/**
 * Represents data and status related to product inventory.
 * Note: The method signature calculateInventoryRecommendation has been removed from the interface
 * as behavior methods typically reside outside of data interfaces.
 */
export interface InventoryData {
  productId: string;
  salesLast30Days?: number; // Total sales over the last 30 days
  leadTime?: number; // Time in days from order to stock arrival
  currentInventory: number;
  averageDailySales: number;
  safetyStock: number; // Minimum stock level to avoid stockouts
  status: InventoryHealthStatus;
}

/**
 * Enum for defining product categories relevant to fees or fulfillment.
 */
export enum ProductCategory {
  STANDARD = 'standard',
  OVERSIZE = 'oversize',
  HAZMAT = 'hazmat',
  APPAREL = 'apparel',
}

/**
 * Enum for defining the health status of inventory levels.
 */
export enum InventoryHealthStatus {
  HEALTHY = 'healthy',
  LOW = 'low', // Below safety stock
  EXCESS = 'excess', // Holding too much stock
  CRITICAL = 'critical', // Near zero or out of stock
}

/**
 * Type alias for common metrics used in data processing or charting.
 */
export type MetricType =
  | 'price'
  | 'reviews' // Corresponds to reviewCount in some interfaces
  | 'rating' // Corresponds to reviewRating in some interfaces
  | 'conversion_rate'
  | 'click_through_rate';

/**
 * Represents a generic data point for charts, typically with a name (label)
 * and potentially various numeric/string values.
 */
export interface ChartDataPoint {
  name: string;
  [key: string]: string | number; // Allows arbitrary data keys
}

/**
 * Represents a competitor's data row, extending the base processed row
 * and optionally including the competitor's name.
 */
export interface CompetitorDataRow extends ProcessedRow {
  name?: string;
}

/**
 * Represents detailed data for an Amazon product, including financials and physical attributes.
 */
export interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  cost: number;
  fbaFees: number;
  referralFee: number;
  category: ProductCategory; // Using enum for consistency
  dimensions?: ProductDimensions;
}

/**
 * Represents the physical dimensions and weight of a product.
 */
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight: number; // Weight is often included with dimensions for shipping/storage calculations
  unit: 'in' | 'cm'; // Unit for length, width, height
  weightUnit: 'lb' | 'kg'; // Unit for weight
}

/**
 * Represents historical sales data for a product on a specific date.
 */
export interface SalesData {
  asin: string;
  date: string; // ISO date string or similar format
  units: number;
  revenue: number;
  ppcSpend?: number; // Optional spend on paid advertising
  organicSales?: number; // Optional sales from organic traffic
}

/**
 * Represents data points for a specific keyword.
 */
export interface KeywordData {
  keyword: string;
  searchVolume: number; // Estimated monthly searches
  difficulty: number; // Score indicating ranking difficulty
  relevancy: number; // Score indicating relevance to product
  currentRank?: number; // Optional current organic search rank
}

/**
 * Represents competitor data obtained from Amazon listings or tools.
 */
export interface CompetitorData {
  asin: string;
  title: string;
  price: number;
  bsr?: number; // Optional Best Seller Rank
  rating: number; // Average rating
  reviewCount: number; // Total reviews
  sellerType: 'FBA' | 'FBM' | 'AMZ'; // Fulfillment method of the competitor
}

/**
 * Type alias for standard reporting timeframes.
 */
export type ReportTimeframe = 'last7' | 'last30' | 'last90' | 'custom';

/**
 * Represents keyword data processed for strategic use, e.g., PPC campaigns.
 */
export interface ProcessedKeywordData {
  keyword: string;
  searchVolume: number;
  competition: number; // A metric indicating competition level
  recommendedBid: number; // Suggested PPC bid
  trend: string; // Description or identifier for search volume trend
  cpc: number; // Average Cost Per Click
}
