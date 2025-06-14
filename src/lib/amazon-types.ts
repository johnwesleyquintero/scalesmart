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

// Interfaces for Amazon SP-API Catalog Items v2022-04-01 response
// These are simplified and should be expanded based on actual API documentation
export interface CatalogItemAttribute {
  locale?: string;
  value?: string;
}

export interface CatalogItemAttributes {
  item_name?: CatalogItemAttribute[];
  // Add other attributes as needed, e.g., brand, color, size
}

export interface CatalogItemBuyingPrice {
  amount?: number;
  currency?: string;
}

export interface CatalogItemSummary {
  buyingPrice?: CatalogItemBuyingPrice;
  itemClassification?: string; // e.g., "PRODUCT"
  // Add other summary fields as needed
}

export interface CatalogItemSalesRank {
  rank?: number;
  // Add other sales rank fields as needed
}

export interface CatalogItemCustomerReviews {
  count?: number;
  averageRating?: number;
}

export interface CatalogItem {
  asin: string;
  attributes?: CatalogItemAttributes;
  summaries?: CatalogItemSummary[];
  salesRanks?: CatalogItemSalesRank[];
  customerReviews?: CatalogItemCustomerReviews;
  // Add other top-level item properties as needed
}

export interface SearchCatalogItemsResponse {
  payload?: {
    items?: CatalogItem[];
    pagination?: {
      nextToken?: string;
    };
  };
  items?: CatalogItem[]; // Direct access for backward compatibility or alternative response structure
  pagination?: {
    nextToken?: string;
  };
}

export interface Order {
  AmazonOrderId: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: string;
  FulfillmentChannel: string;
  SalesChannel: string;
  OrderChannel: string;
  ShipServiceLevel: string;
  ShippingAddress?: {
    Name: string;
    AddressLine1: string;
    City: string;
    StateOrRegion: string;
    PostalCode: string;
    CountryCode: string;
  };
  OrderTotal?: {
    CurrencyCode: string;
    Amount: string;
  };
  NumberOfItemsShipped?: number;
  NumberOfItemsUnshipped?: number;
  PaymentMethod: string;
  MarketplaceId: string;
  BuyerEmail?: string;
  BuyerName?: string;
  ShipmentServiceLevelCategory?: string;
  EasyShipShipmentStatus?: string;
  PaymentMethodDetails?: string[];
  IsBusinessOrder: boolean;
  PurchaseOrderNumber?: string;
  IsPrime: boolean;
  IsPremiumOrder: boolean;
  PromiseResponseDueDate?: string;
  IsEstimatedShipDateSet: boolean;
  EarliestShipDate?: string;
  LatestShipDate?: string;
  EarliestDeliveryDate?: string;
  LatestDeliveryDate?: string;
}

export interface OrderItem {
  ASIN: string;
  SellerSKU: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  QuantityShipped: number;
  PointsGranted?: {
    PointsNumber: number;
    PointsMonetaryValue: {
      CurrencyCode: string;
      Amount: string;
    };
  };
  ProductInfo?: {
    NumberOfItems: number;
  };
  ShippingPrice?: {
    CurrencyCode: string;
    Amount: string;
  };
  ItemPrice?: {
    CurrencyCode: string;
    Amount: string;
  };
  PromotionDiscount?: {
    CurrencyCode: string;
    Amount: string;
  };
  CODFee?: {
    CurrencyCode: string;
    Amount: string;
  };
  CODFeeDiscount?: {
    CurrencyCode: string;
    Amount: string;
  };
  IsGift: boolean;
  GiftMessageText?: string;
  GiftWrapPrice?: {
    CurrencyCode: string;
    Amount: string;
  };
  ItemTax?: {
    CurrencyCode: string;
    Amount: string;
  };
  ShippingTax?: {
    CurrencyCode: string;
    Amount: string;
  };
  GiftWrapTax?: {
    CurrencyCode: string;
    Amount: string;
  };
  ShippingDiscount?: {
    CurrencyCode: string;
    Amount: string;
  };
  ShippingDiscountTax?: {
    CurrencyCode: string;
    Amount: string;
  };
  PromotionIds?: string[];
  DeclineReason?: string;
  IsTransparency?: boolean;
  SerialNumberRequired?: boolean;
  IsCustomized?: boolean;
  CustomizedURL?: string;
}

export interface InventorySummary {
  asin: string;
  fnSku: string;
  sellerSku: string;
  condition: string;
  supplyType: string;
  totalSupplyQuantity: number;
  inStockSupplyQuantity: number;
  earliestAvailability?: {
    unit: 'Days' | 'Weeks';
    value: number;
  };
}

export interface Report {
  reportId: string;
  reportType: string;
  dataStartTime: string;
  dataEndTime: string;
  processingStatus: 'CANCELLED' | 'DONE' | 'FATAL' | 'IN_PROGRESS' | 'IN_QUEUE';
  processingEndTime?: string;
  processingStartTime?: string;
  reportDocumentId?: string;
}

export interface ReportDocument {
  reportDocumentId: string;
  url: string;
  compressionAlgorithm?: 'GZIP';
}

export interface ProductListing {
  asin: string;
  marketplaceId: string;
  productType: string;
  attributes: Record<string, unknown>; // This can be more specific based on actual attributes
}

export interface Shipment {
  shipmentId: string;
  shipmentName: string;
  destinationFulfillmentCenterId: string;
  shipmentStatus: string;
  labelType: string;
  // Add more properties as needed from the Fulfillment Inbound Shipment API
}

export interface FinancialEvent {
  AmazonOrderId?: string;
  SellerOrderId?: string;
  MarketplaceName?: string;
  // This can be expanded with more specific financial event types
  // e.g., ShipmentEvent, RefundEvent, FeeRefundEvent, AdjustmentEvent, etc.
  // For simplicity, using a generic structure for now.
  PostedDate: string;
  Amount: {
    CurrencyCode: string;
    CurrencyAmount: number;
  };
  Description: string;
}

export interface ProductPricing {
  asin: string;
  marketplaceId: string;
  price: {
    amount: number;
    currencyCode: string;
  };
  // Add more pricing details like Buy Box eligibility, offers, etc.
}

export interface CustomerReview {
  reviewId: string;
  asin: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  // Add more properties as needed for customer reviews
}

export interface GetOrdersResponse {
  payload?: {
    Orders?: Order[];
  };
  Orders?: Order[];
}

export interface GetInventorySummariesResponse {
  payload?: {
    inventorySummaries?: InventorySummary[];
  };
  inventorySummaries?: InventorySummary[];
}

export interface GetReportsResponse {
  payload?: {
    reports?: Report[];
  };
  reports?: Report[];
}

export interface CreateReportResponse {
  payload?: {
    reportId?: string;
  };
  reportId?: string;
}

export interface GetReportDocumentResponse {
  payload?: ReportDocument;
}

export interface GetShipmentsResponse {
  payload?: {
    ShipmentData?: Shipment[];
  };
  ShipmentData?: Shipment[];
}

export interface ListFinancialEventsResponse {
  payload?: {
    FinancialEvents?: FinancialEvent[];
  };
  FinancialEvents?: FinancialEvent[];
}

export interface GetCompetitivePricingResponse {
  payload?: {
    ProductPricing?: ProductPricing[];
  };
  ProductPricing?: ProductPricing[];
}

/**
 * Enum for defining Amazon FBA shipment statuses.
 */
export enum ShipmentStatus {
  WORKING = 'WORKING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CHECKED_IN = 'CHECKED_IN',
  RECEIVING = 'RECEIVING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
  ERROR = 'ERROR',
}
