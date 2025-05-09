import Papa from 'papaparse';
import { logger } from './logger';

// Define supported data types and their generators
type DataType = 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'asin'; // Added 'asin' for potential specific generation

interface DataTypeConfig {
  type: DataType;
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    values?: string[];
    format?: 'ISO' | 'Locale'; // Refined date format options
    prefix?: string;
    suffix?: string;
    length?: number; // For string/asin
  };
}

interface ColumnConfig {
  name: string;
  dataType: DataTypeConfig;
  required?: boolean;
  description?: string;
}

interface SampleDataConfig {
  columns: ColumnConfig[];
  rowCount?: number;
  customGenerators?: Record<string, (config: DataTypeConfig) => any>;
}

// Data generation functions
const dataGenerators = {
  string: (config: DataTypeConfig['options'] = {}) => {
    const { prefix = '', suffix = '', length = 8 } = config; // Default length 8
    // Security: Acceptable for sample data generation
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues); // Browser-specific crypto
    const randomStr = Array.from(
      randomValues,
      (val) => chars[val % chars.length],
    ).join('');
    return `${prefix}${randomStr}${suffix}`;
  },

  number: (config: DataTypeConfig['options'] = {}) => {
    const { min = 0, max = 100, decimals = 0 } = config;
    // Security: Safe for demo data generation
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer); // Browser-specific crypto
    const num = (randomBuffer[0] / 4294967295) * (max - min) + min;
    return Number(num.toFixed(decimals));
  },

  date: (config: DataTypeConfig['options'] = {}) => {
    const { format = 'ISO' } = config;
    // Security: Appropriate for non-cryptographic use
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer); // Browser-specific crypto
    // Generate dates within the last year
    const randomPastTime =
      (randomBuffer[0] / 4294967295) * 365 * 24 * 60 * 60 * 1000;
    const date = new Date(Date.now() - randomPastTime);
    // Return YYYY-MM-DD format for better CSV compatibility usually
    return date.toISOString().split('T')[0];
    // Or use format option if needed:
    // return format === 'ISO' ? date.toISOString().split('T')[0] : date.toLocaleDateString();
  },

  boolean: () =>
    // Security: Cryptographically secure random boolean
    crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 > 0.5,

  enum: (config: DataTypeConfig['options'] = {}) => {
    const { values = ['Option1', 'Option2', 'Option3'] } = config;
    // Security: Safe for demo data randomization
    return values[
      crypto.getRandomValues(new Uint32Array(1))[0] % values.length // Browser-specific crypto
    ];
  },

  // Simple ASIN generator (10 uppercase letters/numbers starting with B0)
  asin: (config: DataTypeConfig['options'] = {}) => {
    const { length = 8 } = config; // 8 random chars + B0 = 10
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues); // Browser-specific crypto
    const randomStr = Array.from(
      randomValues,
      (val) => chars[val % chars.length],
    ).join('');
    return `B0${randomStr}`;
  },
};

/**
 * Generates sample data based on the provided configuration
 */
const generateSampleData = (
  config: SampleDataConfig,
): Record<string, any>[] => {
  const { columns, rowCount = 5, customGenerators = {} } = config;

  try {
    return Array.from({ length: rowCount }, () => {
      const row: Record<string, any> = {};

      columns.forEach(({ name, dataType, required = true }) => {
        // 20% chance to skip non-required fields
        if (
          !required &&
          crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 > 0.8 // Browser-specific crypto
        ) {
          row[name] = ''; // Assign empty string for skipped optional columns
          return;
        }

        const generator =
          customGenerators[dataType.type] || dataGenerators[dataType.type];
        if (!generator) {
          logger.warn(
            `Unsupported data type: ${dataType.type} for column ${name}. Skipping.`,
          );
          row[name] = ''; // Assign empty string if generator missing
          // Or throw error if preferred:
          // throw new Error(`Unsupported data type: ${dataType.type}`);
        } else {
          row[name] = generator(dataType.options as any);
        }
      });

      return row;
    });
  } catch (error) {
    logger.error('Error generating sample data', { error, config });
    throw new Error(
      `Failed to generate sample data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

// Predefined sample data configurations
const sampleDataConfigs: Record<string, SampleDataConfig> = {
  // Existing FBA config (renamed for clarity, maybe 'profitability'?)
  profitability: {
    columns: [
      {
        name: 'product',
        dataType: { type: 'string', options: { prefix: 'Product-' } },
        required: true,
        description: 'Product name or identifier',
      },
      {
        name: 'cost',
        dataType: { type: 'number', options: { min: 5, max: 50, decimals: 2 } },
        required: true,
        description: 'Product cost',
      },
      {
        name: 'price',
        dataType: {
          type: 'number',
          options: { min: 15, max: 100, decimals: 2 },
        },
        required: true,
        description: 'Selling price',
      },
      {
        name: 'fees', // Assuming this includes FBA + Referral
        dataType: { type: 'number', options: { min: 2, max: 15, decimals: 2 } },
        required: true,
        description: 'Total Amazon Fees',
      },
    ],
    rowCount: 5,
  },

  // Existing Keyword config
  keyword: {
    columns: [
      {
        name: 'product', // Or maybe 'Target ASIN'/'Campaign'? Context dependent
        dataType: { type: 'string', options: { prefix: 'Product-' } },
        required: true,
      },
      {
        name: 'keywords',
        dataType: { type: 'string' }, // Could generate multiple keywords later
        required: true,
      },
      {
        name: 'searchVolume',
        dataType: { type: 'number', options: { min: 100, max: 50000 } }, // Adjusted min
        required: true,
      },
      {
        name: 'competition',
        dataType: {
          type: 'enum',
          options: { values: ['Low', 'Medium', 'High'] },
        },
        required: true,
      },
      {
        // Example: Adding CPC
        name: 'cpc',
        dataType: {
          type: 'number',
          options: { min: 0.1, max: 5.0, decimals: 2 },
        },
        required: false, // Make it optional
        description: 'Cost Per Click (Optional)',
      },
    ],
    rowCount: 10, // Increased rows
  },

  // Existing PPC config
  ppc: {
    columns: [
      {
        // Added Date
        name: 'date',
        dataType: { type: 'date' },
        required: true,
        description: 'Date of PPC Data',
      },
      {
        name: 'campaignName', // More specific name
        dataType: { type: 'string', options: { prefix: 'Campaign-' } },
        required: true,
      },
      {
        name: 'campaignType', // More specific name
        dataType: {
          type: 'enum',
          options: {
            values: [
              'Auto',
              'SP Keyword',
              'SP ASIN',
              'SB Keyword',
              'SD Audience',
            ], // More specific types
          },
        },
        required: true,
      },
      {
        name: 'spend',
        dataType: {
          type: 'number',
          options: { min: 10, max: 500, decimals: 2 }, // Adjusted min
        },
        required: true,
      },
      {
        name: 'sales',
        dataType: {
          type: 'number',
          options: { min: 0, max: 2000, decimals: 2 }, // Adjusted min to 0
        },
        required: true,
      },
      {
        name: 'impressions',
        dataType: { type: 'number', options: { min: 100, max: 20000 } },
        required: true,
      },
      {
        name: 'clicks',
        dataType: { type: 'number', options: { min: 0, max: 500 } }, // Adjusted min to 0
        required: true,
      },
      {
        // Example: Adding Orders
        name: 'orders',
        dataType: { type: 'number', options: { min: 0, max: 50 } },
        required: false, // Optional
        description: 'Number of Orders (Optional)',
      },
    ],
    rowCount: 15, // Increased rows
  },

  // --- NEW CONFIGURATIONS ---

  acos: {
    columns: [
      {
        // Added Date
        name: 'date',
        dataType: { type: 'date' },
        required: true,
        description: 'Date of the record',
      },
      {
        name: 'productName',
        dataType: { type: 'string', options: { prefix: 'Product-' } },
        required: true,
        description: 'Product Name',
      },
      {
        name: 'campaign',
        dataType: { type: 'string', options: { prefix: 'Campaign-' } },
        required: true,
        description: 'Campaign Name',
      },
      {
        name: 'adSpend',
        dataType: {
          type: 'number',
          options: { min: 10, max: 200, decimals: 2 },
        },
        required: true,
        description: 'Advertising Spend',
      },
      {
        name: 'sales',
        dataType: {
          type: 'number',
          options: { min: 0, max: 1000, decimals: 2 },
        }, // Min 0
        required: true,
        description: 'Total Sales from Ads',
      },
      {
        name: 'clicks',
        dataType: { type: 'number', options: { min: 0, max: 100 } }, // Min 0
        required: true,
        description: 'Number of Clicks',
      },
      {
        name: 'impressions',
        dataType: { type: 'number', options: { min: 100, max: 5000 } },
        required: true,
        description: 'Number of Impressions',
      },
    ],
    rowCount: 10,
  },

  sales: {
    columns: [
      {
        // Added Date
        name: 'date',
        dataType: { type: 'date' },
        required: true,
        description: 'Date of Sales Record',
      },
      {
        name: 'asin',
        dataType: { type: 'asin' }, // Use specific ASIN generator
        required: true,
        description: 'Amazon Standard Identification Number',
      },
      {
        name: 'sku',
        dataType: { type: 'string', options: { prefix: 'SKU-', length: 12 } },
        required: false, // Optional
        description: 'Stock Keeping Unit (Optional)',
      },
      {
        name: 'units',
        dataType: { type: 'number', options: { min: 0, max: 50 } }, // Min 0
        required: true,
        description: 'Units Sold',
      },
      {
        name: 'revenue',
        dataType: {
          type: 'number',
          options: { min: 0, max: 1000, decimals: 2 },
        }, // Min 0
        required: true,
        description: 'Total Revenue',
      },
      {
        name: 'ppcSpend',
        dataType: {
          type: 'number',
          options: { min: 0, max: 100, decimals: 2 },
        },
        required: false,
        description: 'PPC Spend (Optional)',
      },
      {
        name: 'organicSales',
        dataType: {
          type: 'number',
          options: { min: 0, max: 900, decimals: 2 },
        }, // Min 0
        required: false,
        description: 'Organic Sales Revenue (Optional)',
      },
    ],
    rowCount: 20, // More rows for sales data
  },

  competitor: {
    columns: [
      {
        // Added Date
        name: 'date',
        dataType: { type: 'date' },
        required: true,
        description: 'Date of Competitor Snapshot',
      },
      {
        name: 'asin',
        dataType: { type: 'asin' },
        required: true,
        description: 'Competitor ASIN',
      },
      {
        name: 'name',
        dataType: {
          type: 'string',
          options: { prefix: 'Competitor Product ' },
        },
        required: false, // Optional name
        description: 'Competitor Product Name (Optional)',
      },
      {
        name: 'price',
        dataType: {
          type: 'number',
          options: { min: 10, max: 150, decimals: 2 },
        },
        required: true,
        description: 'Competitor Price',
      },
      {
        name: 'reviews',
        dataType: { type: 'number', options: { min: 0, max: 5000 } },
        required: true,
        description: 'Number of Reviews',
      },
      {
        name: 'rating',
        dataType: {
          type: 'number',
          options: { min: 1.0, max: 5.0, decimals: 1 },
        },
        required: true,
        description: 'Average Rating',
      },
      {
        name: 'conversion_rate',
        dataType: { type: 'number', options: { min: 1, max: 30, decimals: 2 } }, // As percentage
        required: false, // Often estimated, make optional
        description: 'Estimated Conversion Rate (%) (Optional)',
      },
      {
        name: 'click_through_rate',
        dataType: {
          type: 'number',
          options: { min: 0.1, max: 5.0, decimals: 2 },
        }, // As percentage
        required: false, // Often estimated, make optional
        description: 'Estimated Click-Through Rate (%) (Optional)',
      },
    ],
    rowCount: 8,
  },

  inventory: {
    columns: [
      {
        // Added Date
        name: 'date',
        dataType: { type: 'date' },
        required: true,
        description: 'Date of Inventory Snapshot',
      },
      {
        name: 'productId', // Can be ASIN or SKU
        dataType: { type: 'asin' }, // Use ASIN for consistency here
        required: true,
        description: 'Product Identifier (ASIN/SKU)',
      },
      {
        name: 'productName',
        dataType: { type: 'string', options: { prefix: 'My Product-' } },
        required: false, // Optional
        description: 'Product Name (Optional)',
      },
      {
        name: 'currentInventory',
        dataType: { type: 'number', options: { min: 0, max: 1000 } },
        required: true,
        description: 'Current Stock Level',
      },
      {
        name: 'averageDailySales',
        dataType: { type: 'number', options: { min: 0, max: 50, decimals: 1 } },
        required: true,
        description: 'Average Daily Sales Velocity',
      },
      {
        name: 'safetyStock',
        dataType: { type: 'number', options: { min: 0, max: 200 } },
        required: false, // Optional
        description: 'Safety Stock Level (Optional)',
      },
      {
        name: 'leadTime', // In days
        dataType: { type: 'number', options: { min: 7, max: 90 } },
        required: false, // Optional
        description: 'Supplier Lead Time (Days) (Optional)',
      },
      {
        name: 'status',
        dataType: {
          type: 'enum',
          options: { values: ['Healthy', 'Low', 'Excess', 'Critical'] },
        },
        required: false, // Optional
        description: 'Inventory Health Status (Optional)',
      },
    ],
    rowCount: 10,
  },
};

/**
 * Generates sample CSV data for the specified data type
 */
export function generateSampleCsv(
  dataType: keyof typeof sampleDataConfigs,
): string {
  const config = sampleDataConfigs[dataType];
  if (!config) {
    logger.error(`Unsupported data type for CSV generation: ${dataType}`);
    // Return empty header row or throw error? Returning header is safer for download.
    // throw new Error(`Unsupported data type: ${dataType}`);
    return ''; // Or return a default header?
  }

  try {
    const data = generateSampleData(config);
    if (data.length === 0) {
      // Generate header even if no data rows
      const headers = config.columns.map((col) => col.name);
      return Papa.unparse([headers], { header: false }); // Unparse just the header array
    }
    // Papaparse automatically uses the keys of the first object as headers
    return Papa.unparse(data, { header: true });
  } catch (error) {
    logger.error('Error generating sample CSV', { error, dataType });
    throw new Error(
      `Failed to generate sample CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Triggers a browser download for a sample CSV file.
 */
export function downloadSampleCsv(
  dataType: keyof typeof sampleDataConfigs,
  fileName?: string,
): void {
  // Ensure this runs only in the browser
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined'
  ) {
    logger.error(
      'CSV download function called outside of browser environment.',
    );
    throw new Error('CSV download is only available in the browser.');
  }

  try {
    console.log(`[CSV Download] Starting download for type: ${dataType}`);

    const csv = generateSampleCsv(dataType);
    if (!csv) {
      // Handle case where generateSampleCsv might return empty (e.g., unsupported type logged)
      logger.error(
        `[CSV Download] Generated CSV string is empty for type ${dataType}, aborting download. Check logs for errors.`,
      );
      // Optionally, inform the user via UI feedback (e.g., toast notification)
      alert(
        `Could not generate sample CSV for ${dataType}. Please check the console for errors.`,
      );
      return;
    }
    console.log(
      `[CSV Download] Successfully generated CSV with ${csv.split('\n').length} rows (including header)`,
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    console.log('[CSV Download] Created Blob URL for download');

    const link = document.createElement('a');
    // Use a more descriptive default filename if not provided
    const defaultFileName = `sample-${dataType}-data-${new Date().toISOString().split('T')[0]}.csv`;
    const downloadName = fileName || defaultFileName;
    link.href = url;
    link.setAttribute('download', downloadName);
    console.log(
      `[CSV Download] Initiating download with filename: ${downloadName}`,
    );

    // Append to body, click, and remove is a standard robust way to trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object to prevent memory leaks
    URL.revokeObjectURL(url);
    console.log('[CSV Download] Completed download and cleaned up resources');
  } catch (error: unknown) {
    // Log the specific error
    logger.error('Error during CSV download process', {
      error,
      dataType,
      fileName,
    });

    // Provide user feedback
    alert(
      `Failed to download sample CSV for ${dataType}. Please check the console for details.`,
    );

    // Re-throw or handle as appropriate for the calling context
    if (error instanceof Error) {
      throw new Error(
        `Failed to download CSV for ${dataType}: ${error.message}`,
      );
    } else {
      throw new Error(
        `Failed to download CSV for ${dataType}: An unknown error occurred.`,
      );
    }
  }
}
