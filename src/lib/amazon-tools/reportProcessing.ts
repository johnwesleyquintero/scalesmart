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
    transform: (value: unknown) => parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0, // Remove currency symbols
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
    transform: (value: unknown) => parseInt(String(value)) || 0,
  },
  {
    id: 'rating',
    label: 'Rating',
    aliases: ['Average Review Rating', 'Rating'],
    transform: (value: unknown) => parseFloat(String(value)) || 0,
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
    transform: (value: unknown) => parseInt(String(value)) || 0,
  },
  {
    id: 'searchVolume',
    label: 'Search Volume',
    aliases: ['Search Volume', 'Monthly Search Volume'],
    transform: (value: unknown) => parseInt(String(value)) || 0,
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
    transform: (value: unknown) => parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0,
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
      const dateStr = String(value || '');
      // Attempt to parse various date formats
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toISOString().split('T')[0]; // Return ISO date string or original if invalid
    },
  },
  {
    id: 'totalSales',
    label: 'Total Sales',
    aliases: ['Total Sales', 'Sales', 'Product Sales'],
    transform: (value: unknown) => parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0,
  },
  {
    id: 'unitsSold',
    label: 'Units Sold',
    aliases: ['Units Sold', 'Units Ordered', 'Quantity'],
    transform: (value: unknown) => parseInt(String(value)) || 0,
  },
  {
    id: 'acos',
    label: 'ACoS',
    aliases: ['ACoS', 'Advertising Cost of Sales'],
    transform: (value: unknown) => parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0, // Handle percentage if needed
  },
  {
    id: 'roas',
    label: 'ROAS',
    aliases: ['ROAS', 'Return on Ad Spend'],
    transform: (value: unknown) => parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0,
  },
  {
    id: 'impressions',
    label: 'Impressions',
    aliases: ['Impressions'],
    transform: (value: unknown) => parseInt(String(value)) || 0,
  },
  {
    id: 'clicks',
    label: 'Clicks',
    aliases: ['Clicks'],
    transform: (value: unknown) => parseInt(String(value)) || 0,
  },
  {
    id: 'cpc',
    label: 'CPC',
    aliases: ['CPC', 'Cost Per Click'],
    transform: (value: unknown) => parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0,
  },
  // salesTrend is calculated from aggregated data, not directly from a single column
];

// Function to get the appropriate configuration based on category
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
