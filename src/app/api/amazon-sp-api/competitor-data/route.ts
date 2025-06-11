import { NextResponse } from 'next/server';
import { getSpApiClient } from '@/lib/amazon-tools/sp-api';
import { SearchCatalogItemsResponse } from '@/lib/amazon-types';

export async function POST(request: Request) {
  try {
    const { asin } = await request.json();
    if (!asin) {
      return NextResponse.json({ error: 'ASIN is required' }, { status: 400 });
    }

    const client = getSpApiClient();
    // Example: Call the Catalog Items API to get product details by ASIN
    // This is a placeholder and needs to be adapted to the actual SP-API operation
    // For example, using getCatalogItem or searchCatalogItems
    // The actual response structure from amazon-sp-api for getCatalogItem can vary.
    // For 'getCatalogItem' operation with path `/catalog/2022-04-01/items/{asin}`,
    // the response typically contains the item details directly or within a 'payload' object.
    // We'll cast to 'any' for flexibility and add a TODO to refine the type.
    // The response structure from amazon-sp-api can vary.
    const productDetailsResponse: SearchCatalogItemsResponse =
      await client.callAPI({
        operation: 'searchCatalogItems', // Changed operation to searchCatalogItems
        query: {
          keywords: asin, // Pass ASIN as a keyword for searchCatalogItems
          marketplaceIds: ['ATVPDKIKX0DER'], // Replace with actual marketplace ID(s)
          includedData: 'attributes,summaries,salesRanks,customerReviews',
        },
      });

    // The item data might be directly in productDetailsResponse or nested under 'payload' or 'items'.
    const item = productDetailsResponse.items?.[0]; // Removed payload as it seems incorrect based on the error

    if (!item) {
      return NextResponse.json(
        { error: 'Product not found or invalid response structure.' },
        { status: 404 },
      );
    }

    const productName =
      item.attributes?.item_name?.[0]?.value || 'Unknown Product';
    const currentPrice = item.summaries?.[0]?.buyingPrice?.amount || 0;
    const bsr = item.salesRanks?.[0]?.rank || undefined;
    const reviewsCount = item.customerReviews?.count || undefined;
    const rating = item.customerReviews?.averageRating || undefined;

    const competitorData = {
      asin: item.asin,
      productName,
      currentPrice,
      bsr,
      reviewsCount,
      rating,
      // Add other fields as needed, e.g., historicalPrices, stockLevel (if available via other APIs)
    };

    return NextResponse.json(competitorData, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching competitor data from SP-API:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch competitor data from Amazon SP-API.',
      },
      { status: 500 },
    );
  }
}
