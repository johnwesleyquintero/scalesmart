import { NextResponse } from 'next/server';
import { getSpApiClient } from '@/lib/amazon-tools/sp-api';

export async function GET() {
  try {
    // Attempt to initialize the SP-API client on the server
    getSpApiClient();
    return NextResponse.json(
      { message: 'Amazon SP-API client initialized successfully on server.' },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      'Failed to initialize Amazon SP-API client on server:',
      error,
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to Amazon SP-API.',
      },
      { status: 500 },
    );
  }
}

// You can add POST, PUT, DELETE methods here for other SP-API operations
// For example, to fetch orders:
/*
export async function POST(request: Request) {
  try {
    const { operation, params } = await request.json();
    const client = getSpApiClient();
    let result;

    switch (operation) {
      case 'fetchOrders':
        // Example: Fetch orders using client.callAPI
        // result = await client.callAPI({
        //   operation: 'getOrders',
        //   query: {
        //     CreatedAfter: params.createdAfter,
        //     MarketplaceIds: params.marketplaceIds,
        //   },
        // });
        result = { message: 'Orders fetched (placeholder)' }; // Placeholder
        break;
      // Add more cases for other operations
      default:
        return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in SP-API operation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform SP-API operation.' },
      { status: 500 }
    );
  }
}
*/
