import { SellingPartner } from 'amazon-sp-api';
import {
  Order,
  InventorySummary,
  Report,
  ReportDocument,
  ProductListing,
  Shipment,
  FinancialEvent,
  ProductPricing,
  CustomerReview,
  GetOrdersResponse,
  GetInventorySummariesResponse,
  GetReportsResponse,
  CreateReportResponse,
  GetReportDocumentResponse,
  GetShipmentsResponse,
  ListFinancialEventsResponse,
  GetCompetitivePricingResponse,
  SearchCatalogItemsResponse,
} from '../amazon-types';

// Define a local interface matching the expected Config type structure
interface AmazonSpApiConfig {
  region: 'na' | 'eu' | 'fe';
  refresh_token: string;
  client_id: string;
  client_secret: string;
  // Add other optional properties from Config if needed, e.g.,
  // access_token?: string;
  // auto_request_tokens?: boolean;
  // access_token_sandbox?: boolean;
}


// Load Amazon SP-API credentials from environment variables for security.
// Ensure these environment variables are set in your deployment environment.
const spApiConfig: AmazonSpApiConfig = {
  region: (process.env.SP_API_REGION as 'na' | 'eu' | 'fe') || 'na', // Default to 'na' if not set
  refresh_token: process.env.SP_API_REFRESH_TOKEN || '',
  client_id: process.env.SP_API_CLIENT_ID || '',
  client_secret: process.env.SP_API_CLIENT_SECRET || '',
};

// Validate that essential environment variables are provided
if (
  !spApiConfig.refresh_token ||
  !spApiConfig.client_id ||
  !spApiConfig.client_secret
) {
  console.error(
    'Missing Amazon SP-API environment variables. Please set SP_API_REFRESH_TOKEN, SP_API_CLIENT_ID, and SP_API_CLIENT_SECRET.',
  );
  // Depending on your application's needs, you might want to throw an error here
  // or handle this more gracefully (e.g., disable SP-API features).
}

let spApiClient: SellingPartner | null = null; // Corrected type

/**
 * Initializes and returns the Amazon Selling Partner API client.
 * Ensure spApiConfig is populated with valid credentials before calling.
 * @returns The initialized SellingPartner client instance.
 */
export const getSpApiClient = (): SellingPartner => {
  // Corrected type
  if (!spApiClient) {
    try {
      spApiClient = new SellingPartner(spApiConfig); // Corrected class name
      console.log('Amazon SP-API client initialized.');
    } catch (error: unknown) {
      // Use unknown for caught errors
      console.error('Failed to initialize Amazon SP-API client:', error);
      // Depending on your error handling strategy, you might want to throw the error
      // Check if error is an instance of Error before accessing message
      throw new Error(
        `Failed to initialize Amazon SP-API client: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return spApiClient;
};

/**
 * Example function to fetch a list of orders.
 * TODO: Implement actual API call logic based on your needs.
 * @returns A promise resolving with order data or null on error.
 */
export const fetchOrders = async (
  marketplaceIds: string[],
  createdAfter?: string,
  lastUpdatedAfter?: string,
): Promise<Order[] | null> => {
  try {
    const client = getSpApiClient();
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

    // The SP-API typically returns orders in a 'payload' or 'Orders' field
    // Adjust this based on the actual response structure from the SP-API documentation
    const typedOrdersResponse = ordersResponse as GetOrdersResponse;
    if (typedOrdersResponse && typedOrdersResponse.payload && typedOrdersResponse.payload.Orders) {
      console.log('Fetched orders:', typedOrdersResponse.payload.Orders);
      return typedOrdersResponse.payload.Orders;
    } else if (typedOrdersResponse && typedOrdersResponse.Orders) {
      console.log('Fetched orders:', typedOrdersResponse.Orders);
      return typedOrdersResponse.Orders;
    } else {
      console.warn('Unexpected response structure for fetchOrders:', ordersResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching orders from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

// TODO: Add more functions for other SP-API operations (inventory, reports, etc.)

/**
 * Example function to fetch inventory data.
 * TODO: Implement actual API call logic based on your needs.
 * @returns A promise resolving with inventory data or null on error.
 */
export const fetchInventory = async (
  marketplaceIds: string[],
  details: boolean = false,
): Promise<InventorySummary[] | null> => {
  try {
    const client = getSpApiClient();
    const inventoryResponse = await client.callAPI({
      operation: 'getInventorySummaries',
      query: {
        granularityType: 'Marketplace',
        granularityId: marketplaceIds[0], // Assuming the first marketplaceId for granularityId
        marketplaceIds: marketplaceIds,
        details: details,
      },
    });

    const typedInventoryResponse = inventoryResponse as GetInventorySummariesResponse;
    if (typedInventoryResponse && typedInventoryResponse.payload && typedInventoryResponse.payload.inventorySummaries) {
      console.log('Fetched inventory:', typedInventoryResponse.payload.inventorySummaries);
      return typedInventoryResponse.payload.inventorySummaries;
    } else if (typedInventoryResponse && typedInventoryResponse.inventorySummaries) {
      console.log('Fetched inventory:', typedInventoryResponse.inventorySummaries);
      return typedInventoryResponse.inventorySummaries;
    } else {
      console.warn('Unexpected response structure for fetchInventory:', inventoryResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching inventory from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Example function to fetch report data.
 * TODO: Implement actual API call logic based on your needs.
 * @returns A promise resolving with report data or null on error.
 */
export const fetchReports = async (
  reportTypes: string[],
  marketplaceIds: string[],
  createdAfter?: string,
): Promise<Report[] | null> => {
  try {
    const client = getSpApiClient();
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
    if (typedReportsResponse && typedReportsResponse.payload && typedReportsResponse.payload.reports) {
      console.log('Fetched reports:', typedReportsResponse.payload.reports);
      return typedReportsResponse.payload.reports;
    } else if (typedReportsResponse && typedReportsResponse.reports) {
      console.log('Fetched reports:', typedReportsResponse.reports);
      return typedReportsResponse.reports;
    } else {
      console.warn('Unexpected response structure for fetchReports:', reportsResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching reports from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
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
 * @returns A promise resolving with review data or null on error.
 */
export const fetchCustomerReviews = async (
  asin: string,
): Promise<CustomerReview[] | null> => {
  try {
    // As SP-API does not directly provide customer reviews, we continue to use mock data.
    // In a real-world scenario, you would integrate with the Amazon Customer Reviews (ACR) API
    // or a third-party review aggregation service here.
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

    console.warn(
      `fetchCustomerReviews function is using mock data. Integrate with ACR API for actual data for ASIN: ${asin}.`,
    );
    return mockReviews;
  } catch (error: unknown) {
    console.error(
      `Error fetching customer reviews: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Fetches product listings for a given marketplace.
 * TODO: Implement actual API call logic based on your needs.
 * @param marketplaceId The marketplace ID (e.g., 'ATVPDKIKX0DER').
 * @returns A promise resolving with product listing data or null on error.
 */
export const fetchProductListings = async (
  marketplaceId: string,
  asin?: string,
  sku?: string,
  keywords?: string[],
): Promise<ProductListing[] | null> => {
  try {
    const client = getSpApiClient();
    const query: Record<string, unknown> = { marketplaceIds: [marketplaceId] };

    if (asin) {
      query.asins = [asin];
    } else if (sku) {
      query.skus = [sku];
    } else if (keywords && keywords.length > 0) {
      query.keywords = keywords;
    } else {
      console.warn('No valid identifier (ASIN, SKU, or keywords) provided for fetchProductListings.');
      return [];
    }

    const listingsResponse = await client.callAPI({
      operation: 'searchCatalogItems',
      query: query,
    });

    const typedListingsResponse = listingsResponse as SearchCatalogItemsResponse;
    if (typedListingsResponse && typedListingsResponse.payload && typedListingsResponse.payload.items) {
      console.log('Fetched product listings:', typedListingsResponse.payload.items);
      return typedListingsResponse.payload.items as ProductListing[];
    } else if (typedListingsResponse && typedListingsResponse.items) {
      console.log('Fetched product listings:', typedListingsResponse.items);
      return typedListingsResponse.items as ProductListing[];
    } else {
      console.warn('Unexpected response structure for fetchProductListings:', listingsResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching product listings from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Fetches inbound shipment plans or details.
 * TODO: Implement actual API call logic based on your needs.
 * @returns A promise resolving with inbound shipment data or null on error.
 */
export const fetchInboundShipments = async (
  queryType: 'SHIPMENT' | 'SHIPMENT_ITEM', // Revert to string literal types
  marketplaceId?: string,
  shipmentStatusList?: string[],
): Promise<Shipment[] | null> => {
  try {
    const client = getSpApiClient();
    const query: Record<string, unknown> = { QueryType: queryType };

    if (marketplaceId) {
      query.MarketplaceId = marketplaceId;
    }
    if (shipmentStatusList && shipmentStatusList.length > 0) {
      query.ShipmentStatusList = shipmentStatusList;
    }

    const shipmentsResponse = await client.callAPI({
      operation: 'getShipments',
      query: query,
    });

    const typedShipmentsResponse = shipmentsResponse as GetShipmentsResponse;
    if (typedShipmentsResponse && typedShipmentsResponse.payload && typedShipmentsResponse.payload.ShipmentData) {
      console.log('Fetched inbound shipments:', typedShipmentsResponse.payload.ShipmentData);
      return typedShipmentsResponse.payload.ShipmentData;
    } else if (typedShipmentsResponse && typedShipmentsResponse.ShipmentData) {
      console.log('Fetched inbound shipments:', typedShipmentsResponse.ShipmentData);
      return typedShipmentsResponse.ShipmentData;
    } else {
      console.warn('Unexpected response structure for fetchInboundShipments:', shipmentsResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching inbound shipments from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Requests a specific report, e.g., GET_SALES_AND_TRAFFIC_REPORT.
 * TODO: Implement actual API call logic based on your needs.
 * @param reportType The type of report to request (e.g., 'GET_SALES_AND_TRAFFIC_REPORT').
 * @param marketplaceIds An array of marketplace IDs.
 * @returns A promise resolving with the report request ID or null on error.
 */
export const requestReport = async (
  reportType: string, // Revert to string
  marketplaceIds: string[],
  dataStartTime?: string,
  dataEndTime?: string,
): Promise<string | null> => {
  try {
    const client = getSpApiClient();
    const body: Record<string, unknown> = {
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
    if (typedReportRequestResponse && typedReportRequestResponse.payload && typedReportRequestResponse.payload.reportId) {
      console.log('Report request initiated:', typedReportRequestResponse.payload.reportId);
      return typedReportRequestResponse.payload.reportId;
    } else if (typedReportRequestResponse && typedReportRequestResponse.reportId) {
      console.log('Report request initiated:', typedReportRequestResponse.reportId);
      return typedReportRequestResponse.reportId;
    } else {
      console.warn('Unexpected response structure for requestReport:', reportRequestResponse);
      return null;
    }
  } catch (error: unknown) {
    console.error(
      `Error requesting report from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Retrieves the document for a generated report.
 * TODO: Implement actual API call logic based on your needs.
 * @param reportDocumentId The ID of the report document to retrieve.
 * @returns A promise resolving with the report document content or null on error.
 */
export const getReportDocument = async (
  reportDocumentId: string,
): Promise<ReportDocument | null> => {
  try {
    const client = getSpApiClient();
    const reportDocumentResponse = await client.callAPI({
      operation: 'getReportDocument',
      path: {
        reportDocumentId: reportDocumentId,
      },
    });

    const typedReportDocumentResponse = reportDocumentResponse as GetReportDocumentResponse;
    if (typedReportDocumentResponse && typedReportDocumentResponse.payload) {
      console.log('Fetched report document:', typedReportDocumentResponse.payload);
      return typedReportDocumentResponse.payload;
    } else {
      console.warn('Unexpected response structure for getReportDocument:', reportDocumentResponse);
      return null;
    }
  } catch (error: unknown) {
    console.error(
      `Error retrieving report document from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Fetches financial events for a given date range or order.
 * @param marketplaceId The marketplace ID.
 * @param postedAfter The start date (ISO 8601 format) for financial events.
 * @param postedBefore The end date (ISO 8601 format) for financial events.
 * @param amazonOrderId Optional: An Amazon order ID to filter events.
 * @returns A promise resolving with financial event data or null on error.
 */
export const fetchFinancialEvents = async (
  marketplaceId: string,
  postedAfter?: string,
  postedBefore?: string,
  amazonOrderId?: string,
): Promise<FinancialEvent[] | null> => {
  try {
    const client = getSpApiClient();
    const query: Record<string, unknown> = {
      MaxResultsPerPage: 100, // Adjust as needed
    };

    if (postedAfter) {
      query.PostedAfter = postedAfter;
    }
    if (postedBefore) {
      query.PostedBefore = postedBefore;
    }
    if (amazonOrderId) {
      query.AmazonOrderId = amazonOrderId;
    }

    const financialEventsResponse = await client.callAPI({
      operation: 'listFinancialEvents',
      query: query,
    });

    const typedFinancialEventsResponse = financialEventsResponse as ListFinancialEventsResponse;
    if (typedFinancialEventsResponse && typedFinancialEventsResponse.payload && typedFinancialEventsResponse.payload.FinancialEvents) {
      console.log('Fetched financial events:', typedFinancialEventsResponse.payload.FinancialEvents);
      return typedFinancialEventsResponse.payload.FinancialEvents;
    } else if (typedFinancialEventsResponse && typedFinancialEventsResponse.FinancialEvents) {
      console.log('Fetched financial events:', typedFinancialEventsResponse.FinancialEvents);
      return typedFinancialEventsResponse.FinancialEvents;
    } else {
      console.warn('Unexpected response structure for fetchFinancialEvents:', financialEventsResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching financial events from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

/**
 * Fetches product pricing information for a given ASIN or SKU.
 * @param marketplaceId The marketplace ID.
 * @param asins Optional: An array of ASINs.
 * @param skus Optional: An array of SKUs.
 * @returns A promise resolving with product pricing data or null on error.
 */
export const fetchProductPricing = async (
  marketplaceId: string,
  asins?: string[],
  skus?: string[],
): Promise<ProductPricing[] | null> => {
  try {
    const client = getSpApiClient();
    const query: Record<string, unknown> = {
      MarketplaceId: marketplaceId,
    };

    if (asins && asins.length > 0) {
      query.Asins = asins;
      query.ItemType = 'Asin';
    } else if (skus && skus.length > 0) {
      query.Skus = skus;
      query.ItemType = 'Sku';
    } else {
      console.warn('No ASINs or SKUs provided for fetchProductPricing.');
      return [];
    }

    const productPricingResponse = await client.callAPI({
      operation: 'getCompetitivePricing', // Or 'getListingOffers' depending on exact need
      query: query,
    });

    const typedProductPricingResponse = productPricingResponse as GetCompetitivePricingResponse;
    if (typedProductPricingResponse && typedProductPricingResponse.payload && typedProductPricingResponse.payload.ProductPricing) {
      console.log('Fetched product pricing:', typedProductPricingResponse.payload.ProductPricing);
      return typedProductPricingResponse.payload.ProductPricing;
    } else if (typedProductPricingResponse && typedProductPricingResponse.ProductPricing) {
      console.log('Fetched product pricing:', typedProductPricingResponse.ProductPricing);
      return typedProductPricingResponse.ProductPricing;
    } else {
      console.warn('Unexpected response structure for fetchProductPricing:', productPricingResponse);
      return [];
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching product pricing from SP-API: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};
