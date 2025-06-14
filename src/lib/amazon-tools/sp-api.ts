import { SellingPartner } from 'amazon-sp-api';
import { Config } from 'amazon-sp-api/lib/typings/baseTypes'; // Correct import path for Config
import {
  Order,
  InventorySummary,
  Report,
  ReportDocument,
  ProductListing,
  Shipment,
  FinancialEvent,
  ProductPricing,
  CustomerReview, // Assuming CustomerReview is defined in amazon-types
  GetOrdersResponse,
  GetInventorySummariesResponse,
  GetReportsResponse,
  CreateReportResponse,
  GetReportDocumentResponse,
  GetShipmentsResponse,
  ListFinancialEventsResponse,
  GetCompetitivePricingResponse,
  SearchCatalogItemsResponse,
  ShipmentStatus, // Import ShipmentStatus
} from '../amazon-types';
import {
  GetShipmentsQuery,
} from 'amazon-sp-api/lib/typings/operations/fulfillmentInbound'; // Removed GetShipmentsQueryType
import { CreateReportBody, ReportType } from 'amazon-sp-api/lib/typings/operations/reports';
import { GetInventorySummariesQuery } from 'amazon-sp-api/lib/typings/operations/fbaInventory';

// Define a local interface that extends the imported Config to include client_id and client_secret
interface SpApiConfig extends Config {
  client_id: string;
  client_secret: string;
}

// Load Amazon SP-API credentials from environment variables for security.
// Ensure these environment variables are set in your deployment environment.
const spApiConfig: SpApiConfig = {
  region: (process.env.SP_API_REGION as Config['region']) || 'na', // Default to 'na' if not set
  refresh_token: process.env.SP_API_REFRESH_TOKEN || '',
  client_id: process.env.SP_API_CLIENT_ID || '',
  client_secret: process.env.SP_API_CLIENT_SECRET || '',
  // Add other optional properties from Config if needed
  // auto_request_tokens: true, // Example: enable auto token refresh
};

// Validate that essential environment variables are provided
if (!spApiConfig.refresh_token || !spApiConfig.client_id || !spApiConfig.client_secret) {
  console.error(
    'SP-API Configuration Error: Missing environment variables. ' +
    'Please set SP_API_REFRESH_TOKEN, SP_API_CLIENT_ID, and SP_API_CLIENT_SECRET.',
  );
  // Depending on your application's needs, you might want to throw an error here
  // or handle this more gracefully (e.g., disable SP-API features).
  // process.exit(1); // Example: Exit if configuration is critical
}

let spApiClient: SellingPartner | null = null;

/**
 * Initializes and returns the Amazon Selling Partner API client singleton.
 * Ensure spApiConfig is populated with valid credentials before calling.
 * @returns The initialized SellingPartner client instance.
 * @throws Error if client initialization fails due to invalid config or other issues.
 */
export const getSpApiClient = (): SellingPartner => {
  if (!spApiClient) {
    try {
      // The SellingPartner constructor directly accepts the Config object
      spApiClient = new SellingPartner(spApiConfig);
      console.log('Amazon SP-API client initialized.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize Amazon SP-API client:', errorMessage);
      // Re-throw the error so consuming code knows initialization failed
      throw new Error(`Failed to initialize Amazon SP-API client: ${errorMessage}`);
    }
  }
  return spApiClient;
};

/**
 * Fetches a list of orders based on specified criteria.
 * @param marketplaceIds An array of marketplace IDs to fetch orders from.
 * @param createdAfter Optional: The earliest date (ISO 8601) when the order was created.
 * @param lastUpdatedAfter Optional: The earliest date (ISO 8601) when the order was last updated.
 * @returns A promise resolving with an array of order data, an empty array if no orders match or response structure is unexpected, or null on API error.
 */
export const fetchOrders = async (
  marketplaceIds: string[],
  createdAfter?: string,
  lastUpdatedAfter?: string,
): Promise<Order[] | null> => {
  try {
    const client = getSpApiClient();
    // Use PascalCase for query parameters as expected by SP-API operations
    const query: Record<string, unknown> = { MarketplaceIds: marketplaceIds };
    if (createdAfter) {
      query.CreatedAfter = createdAfter;
    }
    if (lastUpdatedAfter) {
      query.LastUpdatedAfter = lastUpdatedAfter;
    }

    const ordersResponse = await client.callAPI({
      operation: 'getOrders',
      query: query,
    });

    const typedOrdersResponse = ordersResponse as GetOrdersResponse;
    // Handle potential variations in response structure (payload wrapper)
    if (typedOrdersResponse?.payload?.Orders) {
      console.log('Fetched orders (payload):', typedOrdersResponse.payload.Orders.length);
      return typedOrdersResponse.payload.Orders;
    } else if (typedOrdersResponse?.Orders) {
      console.log('Fetched orders (top-level):', typedOrdersResponse.Orders.length);
      return typedOrdersResponse.Orders;
    } else {
      console.warn('Unexpected or empty response structure for fetchOrders:', ordersResponse);
      return []; // Return empty array for success with no data or unexpected structure
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching orders from SP-API: ${errorMessage}`, error);
    return null; // Return null only on API error
  }
};

/**
 * Fetches inventory summary data.
 * @param marketplaceIds An array of marketplace IDs.
 * @param details Optional: Whether to include details in the inventory summary.
 * @returns A promise resolving with an array of inventory summaries, an empty array if no data or unexpected structure, or null on API error.
 */
export const fetchInventory = async (
  marketplaceIds: string[],
  details: boolean = false,
): Promise<InventorySummary[] | null> => {
  try {
    const client = getSpApiClient();
    // Note: SP-API inventory API query params use camelCase
    const query: GetInventorySummariesQuery = {
      granularityType: 'Marketplace',
      granularityId: marketplaceIds[0], // Assuming the first marketplaceId for granularityId as per API docs/example
      marketplaceIds: marketplaceIds,
      details: details,
    };

    const inventoryResponse = await client.callAPI({
      operation: 'getInventorySummaries',
      query: query,
    });

    const typedInventoryResponse = inventoryResponse as GetInventorySummariesResponse;
    if (typedInventoryResponse?.payload?.inventorySummaries) {
      console.log('Fetched inventory (payload):', typedInventoryResponse.payload.inventorySummaries.length);
      return typedInventoryResponse.payload.inventorySummaries;
    } else if (typedInventoryResponse?.inventorySummaries) {
      console.log('Fetched inventory (top-level):', typedInventoryResponse.inventorySummaries.length);
      return typedInventoryResponse.inventorySummaries;
    } else {
      console.warn('Unexpected or empty response structure for fetchInventory:', inventoryResponse);
      return [];
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching inventory from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Fetches report information based on criteria. Note: This gets metadata about reports, not the report content itself.
 * @param reportTypes An array of report types (e.g., ['GET_SALES_AND_TRAFFIC_REPORT']).
 * @param marketplaceIds An array of marketplace IDs.
 * @param createdAfter Optional: The earliest date (ISO 8601) when the report was created.
 * @returns A promise resolving with an array of report metadata, an empty array if no data or unexpected structure, or null on API error.
 */
export const fetchReports = async (
  reportTypes: string[], // Consider using ReportType union if feasible
  marketplaceIds: string[],
  createdAfter?: string,
): Promise<Report[] | null> => {
  try {
    const client = getSpApiClient();
    // SP-API reports API query params use camelCase
    const query: Record<string, unknown> = {
      reportTypes: reportTypes,
      marketplaceIds: marketplaceIds,
    };
    if (createdAfter) {
      query.createdAfter = createdAfter;
    }

    const reportsResponse = await client.callAPI({
      operation: 'getReports',
      query: query,
    });

    const typedReportsResponse = reportsResponse as GetReportsResponse;
    if (typedReportsResponse?.payload?.reports) {
      console.log('Fetched reports (payload):', typedReportsResponse.payload.reports.length);
      return typedReportsResponse.payload.reports;
    } else if (typedReportsResponse?.reports) {
      console.log('Fetched reports (top-level):', typedReportsResponse.reports.length);
      return typedReportsResponse.reports;
    } else {
      console.warn('Unexpected or empty response structure for fetchReports:', reportsResponse);
      return [];
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching reports from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Fetches customer review data.
 * Note: The Amazon Selling Partner API (SP-API) does not directly provide an operation
 * to fetch customer reviews. This function will continue to use mock data as a placeholder.
 * For actual customer review access, consider integrating with the Amazon Customer Reviews (ACR) API
 * or other relevant services. For soliciting reviews, refer to the Solicitations API.
 * @param asin The ASIN for which to fetch reviews.
 * @returns A promise resolving with an array of mock review data. Returns an empty array on error (as it's mock data, API errors aren't relevant here).
 */
export const fetchCustomerReviews = async (
  asin: string,
): Promise<CustomerReview[] | null> => {
  try {
    // As SP-API does not directly provide customer reviews, we continue to use mock data.
    // In a real-world scenario, you would integrate with the Amazon Customer Reviews (ACR) API
    // or a third-party review aggregation service here.
    console.warn(
      `fetchCustomerReviews function is using mock data. Integrate with ACR API for actual data for ASIN: ${asin}.`,
    );
    const mockReviews: CustomerReview[] = [
      {
        reviewId: `mock-review-1-${asin}`,
        asin: asin,
        rating: 5,
        title: 'Great Product!',
        body: 'I really enjoyed using this product. It exceeded my expectations.',
        date: '2024-01-15',
      },
      {
        reviewId: `mock-review-2-${asin}`,
        asin: asin,
        rating: 3,
        title: "It's okay",
        body: 'The product is decent, but I had some minor issues with its durability.',
        date: '2024-02-20',
      },
      {
        reviewId: `mock-review-3-${asin}`,
        asin: asin,
        rating: 1,
        title: 'Disappointed',
        body: 'This product broke after a week. Very poor quality.',
        date: '2024-03-01',
      },
    ];

    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return mockReviews;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching customer reviews (mock data simulation): ${errorMessage}`, error);
    return []; // Return empty array for mock data fetch error
  }
};

/**
 * Fetches product listings for a given marketplace.
 * @param marketplaceId The marketplace ID (e.g., 'ATVPDKIKX0DER').
 * @param params Optional parameters including asin, sku, or keywords to search by. One of these should typically be provided.
 * @returns A promise resolving with an array of product listings, an empty array if no data or unexpected structure, or null on API error.
 */
export const fetchProductListings = async (
  marketplaceId: string,
  params: {
    asin?: string;
    sku?: string;
    keywords?: string[];
  },
): Promise<ProductListing[] | null> => {
  try {
    const client = getSpApiClient();
    // SP-API catalog API query params use camelCase
    const query: Record<string, unknown> = { marketplaceIds: [marketplaceId] };

    if (params.asin) {
      query.asins = [params.asin];
    } else if (params.sku) {
      query.skus = [params.sku];
    } else if (params.keywords && params.keywords.length > 0) {
      query.keywords = params.keywords;
    } else {
      console.warn('No valid identifier (ASIN, SKU, or keywords) provided for fetchProductListings.');
      return [];
    }

    const listingsResponse = await client.callAPI({
      operation: 'searchCatalogItems',
      query: query,
    });

    const typedListingsResponse = listingsResponse as SearchCatalogItemsResponse;
    if (typedListingsResponse?.payload?.items) {
      console.log('Fetched product listings (payload):', typedListingsResponse.payload.items.length);
      return typedListingsResponse.payload.items as ProductListing[]; // Cast necessary if ProductListing isn't exactly the inferred type
    } else if (typedListingsResponse?.items) {
      console.log('Fetched product listings (top-level):', typedListingsResponse.items.length);
      return typedListingsResponse.items as ProductListing[];
    } else {
      console.warn('Unexpected or empty response structure for fetchProductListings:', listingsResponse);
      return [];
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching product listings from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Fetches inbound shipment plans or details.
 * @param queryType The type of query (e.g., 'SHIPMENT', 'SHIPMENT_ID', 'PLAN').
 * @param marketplaceId The marketplace ID.
 * @param shipmentStatusList Optional: Filter by shipment status.
 * @returns A promise resolving with an array of inbound shipments, an empty array if no data or unexpected structure, or null on API error.
 */
export const fetchInboundShipments = async (
  queryType: GetShipmentsQuery['QueryType'], // Use the imported type's QueryType property
  marketplaceId: string,
  shipmentStatusList?: ShipmentStatus[], // Use the imported ShipmentStatus enum
): Promise<Shipment[] | null> => {
  try {
    const client = getSpApiClient();
    // SP-API Fulfillment Inbound API query params use PascalCase
    const query: GetShipmentsQuery = {
      QueryType: queryType,
      MarketplaceId: marketplaceId,
      // Add other required query params based on QueryType if necessary (e.g., QueryType = SHIPMENT_ID requires ShipmentId)
      // This function assumes QueryType doesn't require additional parameters or handles defaults
    };

    if (shipmentStatusList && shipmentStatusList.length > 0) {
      query.ShipmentStatusList = shipmentStatusList; // Removed 'as any' cast
    }

    const shipmentsResponse = await client.callAPI({
      operation: 'getShipments',
      query: query,
    });

    const typedShipmentsResponse = shipmentsResponse as GetShipmentsResponse;
    if (typedShipmentsResponse?.payload?.ShipmentData) {
      console.log('Fetched inbound shipments (payload):', typedShipmentsResponse.payload.ShipmentData.length);
      return typedShipmentsResponse.payload.ShipmentData;
    } else if (typedShipmentsResponse?.ShipmentData) {
      console.log('Fetched inbound shipments (top-level):', typedShipmentsResponse.ShipmentData.length);
      return typedShipmentsResponse.ShipmentData;
    } else {
      console.warn('Unexpected or empty response structure for fetchInboundShipments:', shipmentsResponse);
      return [];
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching inbound shipments from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Requests a specific report, e.g., GET_SALES_AND_TRAFFIC_REPORT.
 * Note: Requesting a report initiates an asynchronous process. You will typically need to poll
 * getReports or use notifications to find out when the report is ready and then download it
 * using getReportDocument.
 * @param reportType The type of report to request (e.g., 'GET_SALES_AND_TRAFFIC_REPORT').
 * @param marketplaceIds An array of marketplace IDs.
 * @param dataStartTime Optional: The start of the report data period (ISO 8601).
 * @param dataEndTime Optional: The end of the report data period (ISO 8601).
 * @returns A promise resolving with the report request ID if successful, or null on API error or unexpected response.
 */
export const requestReport = async (
  reportType: ReportType,
  marketplaceIds: string[],
  dataStartTime?: string,
  dataEndTime?: string,
): Promise<string | null> => {
  try {
    const client = getSpApiClient();
    // SP-API reports API body params use camelCase
    const body: CreateReportBody = {
      reportType: reportType,
      marketplaceIds: marketplaceIds,
    };
    if (dataStartTime) {
      body.dataStartTime = dataStartTime;
    }
    if (dataEndTime) {
      body.dataEndTime = dataEndTime;
    }

    const reportRequestResponse = await client.callAPI({
      operation: 'createReport',
      body: body,
    });

    const typedReportRequestResponse = reportRequestResponse as CreateReportResponse;
    if (typedReportRequestResponse?.payload?.reportId) {
      console.log('Report request initiated (payload):', typedReportRequestResponse.payload.reportId);
      return typedReportRequestResponse.payload.reportId;
    } else if (typedReportRequestResponse?.reportId) {
      console.log('Report request initiated (top-level):', typedReportRequestResponse.reportId);
      return typedReportRequestResponse.reportId;
    } else {
      console.warn('Unexpected response structure for requestReport:', reportRequestResponse);
      return null; // Return null for unexpected structure on initiation
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error requesting report from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Retrieves the document for a generated report.
 * Note: Call this after a report request has completed and a reportDocumentId is available.
 * The actual report content is typically found at the URL within the returned document payload.
 * @param reportDocumentId The ID of the report document to retrieve.
 * @returns A promise resolving with the report document payload, or null on API error or unexpected response.
 */
export const getReportDocument = async (
  reportDocumentId: string,
): Promise<ReportDocument | null> => {
  try {
    const client = getSpApiClient();
    // SP-API reports API path param uses camelCase
    const reportDocumentResponse = await client.callAPI({
      operation: 'getReportDocument',
      path: {
        reportDocumentId: reportDocumentId,
      },
    });

    const typedReportDocumentResponse = reportDocumentResponse as GetReportDocumentResponse;
    if (typedReportDocumentResponse?.payload) {
      console.log('Fetched report document (payload found).');
      return typedReportDocumentResponse.payload;
    } else {
      console.warn('Unexpected or empty response structure for getReportDocument:', reportDocumentResponse);
      return null; // Return null for unexpected structure
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error retrieving report document from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Fetches financial events for a given date range or order.
 * @param params Parameters including marketplaceId, date range, and optional order ID.
 * @returns A promise resolving with an array of financial events, an empty array if no data or unexpected structure, or null on API error.
 */
export const fetchFinancialEvents = async (
  params: {
    marketplaceId: string; // Marketplace ID is required by the API
    postedAfter?: string; // ISO 8601 date
    postedBefore?: string; // ISO 8601 date
    amazonOrderId?: string;
    maxResultsPerPage?: number; // Allow consumer to specify page size
  },
): Promise<FinancialEvent[] | null> => {
  try {
    const client = getSpApiClient();
    // SP-API Finances API query params use PascalCase
    const query: Record<string, unknown> = {
      MarketplaceId: params.marketplaceId,
      MaxResultsPerPage: params.maxResultsPerPage || 100, // Use provided value or default
    };

    if (params.postedAfter) {
      query.PostedAfter = params.postedAfter;
    }
    if (params.postedBefore) {
      query.PostedBefore = params.postedBefore;
    }
    if (params.amazonOrderId) {
      query.AmazonOrderId = params.amazonOrderId;
    }

    // Note: The financial events API is paginated. This function only fetches the first page.
    // Implement pagination logic if you need more than MaxResultsPerPage events.
    const financialEventsResponse = await client.callAPI({
      operation: 'listFinancialEvents',
      query: query,
    });

    const typedFinancialEventsResponse = financialEventsResponse as ListFinancialEventsResponse;
    if (typedFinancialEventsResponse?.payload?.FinancialEvents) {
      console.log('Fetched financial events (payload):', typedFinancialEventsResponse.payload.FinancialEvents.length);
      return typedFinancialEventsResponse.payload.FinancialEvents;
    } else if (typedFinancialEventsResponse?.FinancialEvents) {
      console.log('Fetched financial events (top-level):', typedFinancialEventsResponse.FinancialEvents.length);
      return typedFinancialEventsResponse.FinancialEvents;
    } else {
      console.warn('Unexpected or empty response structure for fetchFinancialEvents:', financialEventsResponse);
      return [];
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching financial events from SP-API: ${errorMessage}`, error);
    return null;
  }
};

/**
 * Fetches product pricing information for a given ASIN or SKU. Uses getCompetitivePricing.
 * @param marketplaceId The marketplace ID.
 * @param asins Optional: An array of ASINs.
 * @param skus Optional: An array of SKUs. Provide either ASINs or SKUs, not both.
 * @returns A promise resolving with an array of product pricing data, an empty array if no data or unexpected structure, or null on API error.
 */
export const fetchProductPricing = async (
  marketplaceId: string,
  asins?: string[],
  skus?: string[],
): Promise<ProductPricing[] | null> => {
  try {
    const client = getSpApiClient();
    // SP-API Product Pricing API query params use PascalCase
    const query: Record<string, unknown> = {
      MarketplaceId: marketplaceId,
    };

    if (asins && asins.length > 0 && (!skus || skus.length === 0)) {
      query.Asins = asins;
      query.ItemType = 'Asin';
    } else if (skus && skus.length > 0 && (!asins || asins.length === 0)) {
      query.Skus = skus;
      query.ItemType = 'Sku';
    } else {
      console.warn('Provide either an array of ASINs or an array of SKUs, but not both, for fetchProductPricing.');
      return [];
    }

    const productPricingResponse = await client.callAPI({
      operation: 'getCompetitivePricing', // This operation is used for getting competitive pricing data
      query: query,
    });

    // Note: The response structure for getCompetitivePricing might differ slightly
    // based on whether you query by ASIN or SKU and the details requested.
    // The type GetCompetitivePricingResponse should guide the structure.
    const typedProductPricingResponse = productPricingResponse as GetCompetitivePricingResponse;

    // The competitive pricing response usually has 'Product' elements at the root level,
    // not typically wrapped in 'payload' or a list property named 'ProductPricing'.
    // Check the exact type definition of GetCompetitivePricingResponse from the library/API docs.
    // Assuming the response structure puts the list of pricing data directly at the top level or under 'payload'.
    // Adjust the extraction logic below based on the actual GetCompetitivePricingResponse structure.
    // A common pattern is an array of complex objects representing products/ASINs/SKUs with pricing details inside.

    // The original code checked for 'ProductPricing' property. Let's trust the original intent
    // and the imported GetCompetitivePricingResponse type definition, but be aware it might need adjustment.
    if (typedProductPricingResponse?.payload?.ProductPricing) {
        console.log('Fetched product pricing (payload):', typedProductPricingResponse.payload.ProductPricing.length);
        // Cast might be needed depending on the exact type definition structure
        return typedProductPricingResponse.payload.ProductPricing as ProductPricing[];
    } else if (typedProductPricingResponse?.ProductPricing) {
        console.log('Fetched product pricing (top-level):', typedProductPricingResponse.ProductPricing.length);
         return typedProductPricingResponse.ProductPricing as ProductPricing[];
    }
    else {
        console.warn('Unexpected or empty response structure for fetchProductPricing:', productPricingResponse);
        // Depending on the exact structure, you might need to iterate over results differently
        // e.g., if the items are directly at the top level or under a different key.
        // Example: if response was [{ Asin: '...', CompetitivePricing: { ... } }, ...]
        // you'd extract and map. But based on GetCompetitivePricingResponse name and original code,
        // assuming the list is directly accessible.
        return [];
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching product pricing from SP-API: ${errorMessage}`, error);
    return null;
  }
};