import { Ratelimit } from '@upstash/ratelimit';
import { logger } from './logger';
import { monitoring } from './monitoring';

const API_ENDPOINT = process.env.KEYWORD_ANALYZER_API_ENDPOINT;
// const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
// const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Create a new ratelimiter to prevent abuse of the API. Allows 5 requests per minute.
const ratelimit = new Ratelimit({
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: '@upstash/ratelimit',
});

// Define the structure for listing data
interface ListingDataType {
  title: string;
  [key: string]: string | number | boolean | null | undefined; // Allow other properties
}

// Validates the listing data to ensure it has the required properties.
function isValidListingData(data: ListingDataType): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  if (!data.title) {
    return false;
  }
  return true;
}

export async function fetchKeywordAnalysis(listingData: ListingDataType) {
  if (!API_ENDPOINT) {
    logger.error('KEYWORD_ANALYZER_API_ENDPOINT is not defined');
    monitoring.captureException(
      new Error('KEYWORD_ANALYZER_API_ENDPOINT is not defined'),
    );
    throw new Error('Keyword analysis service unavailable');
  }

  if (!isValidListingData(listingData)) {
    logger.error('Invalid listing data');
    monitoring.captureException(new Error('Invalid listing data'));
    throw new Error('Invalid listing data');
  }

  // Rate limit the API endpoint
  const { success } = await ratelimit.limit('keyword-analysis-api');

  if (!success) {
    logger.warn('Rate limit exceeded');
    monitoring.captureException(new Error('Rate limit exceeded'));
    throw new Error('Too many requests');
  }

  try {
    logger.info(`Sending request to ${API_ENDPOINT} with data:`, listingData);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });

    if (!response.ok) {
      logger.error(
        `API Route Error: ${response.status} - ${response.statusText}`,
      );
      monitoring.captureException(
        new Error(
          `API Route Error: ${response.status} - ${response.statusText}`,
        ),
      );
      throw new Error(
        `Failed to analyze keywords: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    logger.info('Keyword analysis successful. Response data:', data);
    return data;
  } catch (error: unknown) {
    logger.error('API Route Error:', error);
    monitoring.captureException(error);
    throw new Error('Failed to analyze keywords');
  }
}
