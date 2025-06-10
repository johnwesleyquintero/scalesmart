import {
  CsvTransformerConfig,
  CsvTransformerFieldConfig,
} from '@/types/csv-transformer-config';
import {
  ProductResearchData,
  KeywordTrackingData,
  ListingOptimizationData,
  AnalyticsData,
  DataType,
} from '@/types/amazon-tools';
import { CsvColumnMapping } from '@/types/data-mapping'; // Assuming CsvColumnMapping is needed here or in transformCsvData

// Placeholder CsvTransformerConfig for Product Research reports
const productResearchConfig: CsvTransformerConfig = [
  {
    id: 'name',
    label: 'Product Name',
    aliases: ['Product Title', 'Title', 'Item Name'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'price',
    label: 'Price',
    aliases: ['Price', 'Current Price', 'Your Price'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse price value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'asin',
    label: 'ASIN',
    aliases: ['ASIN', '(Parent) ASIN', '(Child) ASIN', 'Product ASIN'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'brand',
    label: 'Brand',
    aliases: ['Brand', 'Brand Name'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'category',
    label: 'Category',
    aliases: ['Category', 'Product Category'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'reviews',
    label: 'Reviews',
    aliases: ['Customer Reviews', 'Number of Reviews'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse reviews value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'rating',
    label: 'Rating',
    aliases: ['Average Review Rating', 'Rating'],
    transform: (value: unknown) => {
      const parsedValue = parseFloat(String(value));
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse rating value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  // Add more relevant fields as needed based on common product research reports
];

const keywordTrackingConfig: CsvTransformerConfig = [
  {
    id: 'keyword',
    label: 'Keyword',
    aliases: ['Keyword', 'Search Term', 'Customer Search Term'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'rank',
    label: 'Rank',
    aliases: ['Rank', 'Keyword Rank', 'Organic Rank'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse rank value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'searchVolume',
    label: 'Search Volume',
    aliases: ['Search Volume', 'Monthly Search Volume'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(
          `Could not parse search volume value: "${value}". Using 0.`,
        );
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'competition',
    label: 'Competition',
    aliases: ['Competition', 'Keyword Competition'],
    transform: (value: unknown) => String(value || ''), // Or a numerical transformation if applicable
  },
  {
    id: 'cpc',
    label: 'CPC',
    aliases: ['CPC', 'Cost Per Click'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse CPC value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  // Add more relevant fields as needed based on common keyword tracking reports
];

const listingOptimizationConfig: CsvTransformerConfig = [
  {
    id: 'title',
    label: 'Title',
    aliases: ['Product Title', 'Title', 'Item Name'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'bulletPoints',
    label: 'Bullet Points',
    aliases: ['Bullet Points', 'Key Product Features', 'Feature Bullets'],
    transform: (value: unknown) =>
      String(value || '')
        .split(/[\n\r]+/) // Split by newline or carriage return
        .map((point) => point.trim())
        .filter(Boolean), // Remove empty strings
  },
  {
    id: 'description',
    label: 'Description',
    aliases: ['Product Description', 'Description', 'Item Description'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'backendKeywords',
    label: 'Backend Keywords',
    aliases: ['Search Terms', 'Backend Search Terms'],
    transform: (value: unknown) => String(value || ''),
  },
  {
    id: 'subjectMatter',
    label: 'Subject Matter',
    aliases: ['Subject Matter'],
    transform: (value: unknown) => String(value || ''),
  },
  // Add more relevant fields as needed based on common listing optimization reports
];

const analyticsConfig: CsvTransformerConfig = [
  {
    id: 'date',
    label: 'Date',
    aliases: ['Date', 'Order Date', 'Ship Date'],
    transform: (value: unknown) => {
      const dateStr = String(value || '').trim();
      if (!dateStr) {
        console.warn(`Empty date value encountered. Returning empty string.`);
        return ''; // Or handle as null/undefined depending on requirements
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(
          `Could not parse date value: "${value}". Returning original string.`,
        );
        return dateStr; // Return original string if parsing fails
      }
      return date.toISOString().split('T')[0]; // Return ISO date string
    },
  },
  {
    id: 'totalSales',
    label: 'Total Sales',
    aliases: ['Total Sales', 'Sales', 'Product Sales'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse total sales value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'unitsSold',
    label: 'Units Sold',
    aliases: ['Units Sold', 'Units Ordered', 'Quantity'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse units sold value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'acos',
    label: 'ACoS',
    aliases: ['ACoS', 'Advertising Cost of Sales'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse ACoS value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'roas',
    label: 'ROAS',
    aliases: ['ROAS', 'Return on Ad Spend'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse ROAS value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'impressions',
    label: 'Impressions',
    aliases: ['Impressions'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse impressions value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'clicks',
    label: 'Clicks',
    aliases: ['Clicks'],
    transform: (value: unknown) => {
      const parsedValue = parseInt(String(value), 10);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse clicks value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  {
    id: 'cpc',
    label: 'CPC',
    aliases: ['CPC', 'Cost Per Click'],
    transform: (value: unknown) => {
      const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
      const parsedValue = parseFloat(cleanedValue);
      if (isNaN(parsedValue)) {
        console.warn(`Could not parse CPC value: "${value}". Using 0.`);
        return 0;
      }
      return parsedValue;
    },
  },
  // salesTrend is calculated from aggregated data, not directly from a single column
];

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
