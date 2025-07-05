import { CsvTransformerConfig } from '@/types/csv-transformer-config';
import {
  productResearchConfig,
  keywordTrackingConfig,
  listingOptimizationConfig,
  analyticsConfig,
} from './configs';

// Function to get the appropriate configuration based on category
/**
 * Retrieves the appropriate CSV transformer configuration based on the report category.
 * @param category The category of the report (e.g., 'product-research', 'analytics').
 * @returns The CsvTransformerConfig for the specified category, or undefined if not found.
 */
export function getReportConfig(
  category: string,
): CsvTransformerConfig | undefined {
  switch (category) {
    case 'product-research':
      return productResearchConfig;
    case 'keyword-tracking':
      return keywordTrackingConfig;
    case 'listing-optimization':
      return listingOptimizationConfig;
    case 'analytics':
      return analyticsConfig;
    default:
      console.warn(`No report configuration found for category: ${category}`);
      return undefined;
  }
}

// Note: The actual mapping from raw CSV headers to canonical names is handled by findCanonicalName in headerMappings.ts.
// The CsvTransformerConfig defines how those canonical names (or aliases) map to the *target* data structure fields and any post-mapping transformations.
// The transformCsvData function in csv-transformer.ts uses both the mapping (implicitly via aliases in config) and the config.
