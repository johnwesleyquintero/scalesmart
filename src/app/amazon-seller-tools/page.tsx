// c:\Users\johnw\portfolio\src\app\amazon-seller-tools\page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  format,
  addDays,
} from 'date-fns';

// Tool Components
import GenericCsvDataMapper from '@/components/shared/GenericCsvDataMapper'; // <--- IMPORT GenericCsvDataMapper
import AcosCalculator from '@/components/amazon-seller-tools/acos-calculator';
import { CompetitorAnalyzer } from '@/components/amazon-seller-tools/competitor-analyzer';
import DescriptionEditor from '@/components/amazon-seller-tools/description-editor';
import FbaCalculator from '@/components/amazon-seller-tools/fba-calculator';
import KeywordAnalyzer from '@/components/amazon-seller-tools/keyword-analyzer';
import KeywordDeduplicator from '@/components/amazon-seller-tools/keyword-deduplicator';
import KeywordTrendAnalyzer from '@/components/amazon-seller-tools/keyword-trend-analyzer';
import ListingQualityChecker from '@/components/amazon-seller-tools/listing-quality-checker';
import OptimalPriceCalculator from '@/components/amazon-seller-tools/optimal-price-calculator';
import PpcCampaignAuditor from '@/components/amazon-seller-tools/ppc-campaign-auditor';
import ProductScoreCalculator from '@/components/amazon-seller-tools/product-score-calculator';
import ProfitMarginCalculator from '@/components/amazon-seller-tools/profit-margin-calculator';
import SalesEstimator from '@/components/amazon-seller-tools/sales-estimator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  BookOpen,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'; // Icons for comparison

// Import the sample CSV file. Next.js will provide a URL to it.

// --- Interface ---
// Define DashboardMetrics interface ONCE
// This interface now aims to hold a more comprehensive set of metrics,
// potentially from different report types, aggregated at the unique_identifier (ASIN/SKU) + date level.
export interface DashboardMetrics {
  date: string; // YYYY-MM-DD
  unique_identifier?: string; // ASIN, SKU, etc.

  // Business Report / Total Metrics (typically ASIN level)
  total_sales?: number;
  total_orders?: number;
  total_sessions?: number;
  total_page_views?: number; // Often in Business Reports like "Page Views"
  total_conversion_rate?: number; // (total_orders / total_sessions) * 100

  // Advertising Metrics (assumed to be attributable to the unique_identifier/ASIN for this structure)
  ad_impressions?: number;
  ad_clicks?: number;
  ad_spend?: number;
  ad_sales?: number; // Ad-attributed sales
  ad_orders?: number; // Ad-attributed orders

  // Calculated Advertising Metrics
  acos?: number; // (ad_spend / ad_sales) * 100
  roas?: number; // (ad_sales / ad_spend)
  cpc?: number; // (ad_spend / ad_clicks)
  ctr?: number; // (ad_clicks / ad_impressions) * 100
  ad_conversion_rate?: number; // (ad_orders / ad_clicks) * 100

  // Other potential metrics (can be expanded)
  profit?: number; // Requires cost data, more complex
  inventory_level?: number;
  review_rating?: number;

  // Customer Acquisition Cost & Lifetime Value (can be complex to attribute)
  cac?: number;
  ltv?: number;
  // Add index signature to satisfy Record<string, unknown> constraint
  [key: string]: unknown;
}

// Constants for repeated strings
const GROUP_FINANCIALS = 'Financials';
const DESC_SAMPLE_DATA = 'Sample Data';
const SUFFIX_SAMPLE_DATA = '(Sample Data)';
const DATE_FORMAT_TOOLTIP_DEFAULT = 'MMM d, yyyy';
const DEFAULT_CHANGE_TEXT = 'vs prev. period';
const POSITIVE_INFINITY_CHANGE_TEXT = '+∞% vs prev. period';
const NEGATIVE_INFINITY_CHANGE_TEXT = '-∞% vs prev. period';
import type { CsvColumnMapping } from '@/types/data-mapping';

// --- Target Metrics for Mapper ---

// Define the structure and requirements for mapping

interface TargetMetricConfig {
  key: keyof DashboardMetrics;
  label: string;
  required: boolean;
  expectedType: 'string' | 'number' | 'date' | 'boolean';
  hint?: string;
  group?: string; // For organizing in the mapper UI
}

const DATE_TYPE = 'date';
const STRING_TYPE = 'string';
const NUMBER_TYPE = 'number';
const CORE_GROUP = 'Core';
const OVERALL_PERFORMANCE_GROUP = 'Overall Performance';
const ADVERTISING_GROUP = 'Advertising';
const OPERATIONS_GROUP = 'Operations';
const PRODUCT_HEALTH_GROUP = 'Product Health';
const TARGET_METRICS_CONFIG_RAW: TargetMetricConfig[] = [
  // Core Identifiers
  {
    key: 'date',
    label: 'Date/Period',
    required: true,
    expectedType: DATE_TYPE,
    hint: 'e.g., YYYY-MM-DD or MM/DD/YYYY',
    group: CORE_GROUP,
  },
  {
    key: 'unique_identifier',
    label: 'ASIN / SKU (Unique ID)',
    required: false,
    expectedType: STRING_TYPE,
    hint: 'Product identifier like B00EXAMPLE. Essential for multi-report merging.',
    group: CORE_GROUP,
  },

  // Business Report / Overall Performance Metrics
  {
    key: 'total_sales',
    label: 'Total Sales ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall sales for the ASIN (e.g., from Business Report "Ordered product sales")',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'total_orders',
    label: 'Total Orders/Units',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall orders/units for the ASIN (e.g., "Total order items")',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'total_sessions',
    label: 'Total Sessions',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall sessions for the ASIN (e.g., "(Parent ASIN) Sessions" from Business Report)',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'total_page_views',
    label: 'Total Page Views',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall page views for the ASIN (e.g., "(Parent ASIN) Page Views" from Business Report)',
    group: OVERALL_PERFORMANCE_GROUP,
  },

  // Advertising Performance Metrics
  {
    key: 'ad_impressions',
    label: 'Ad Impressions',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Impressions from advertising reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_clicks',
    label: 'Ad Clicks',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Clicks from advertising reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_spend',
    label: 'Ad Spend ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Total advertising spend from reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_sales',
    label: 'Ad Sales ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Sales attributed to ads from reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_orders',
    label: 'Ad Orders',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Orders attributed to ads from reports',
    group: ADVERTISING_GROUP,
  },

  // Other Optional Metrics (can be expanded)
  {
    key: 'profit',
    label: 'Profit ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Manually calculated or from specific profit reports',
    group: GROUP_FINANCIALS,
  },
  {
    key: 'inventory_level',
    label: 'Inventory Level',
    required: false,
    expectedType: NUMBER_TYPE,
    group: OPERATIONS_GROUP,
  },
  {
    key: 'review_rating',
    label: 'Review Rating',
    required: false,
    expectedType: NUMBER_TYPE,
    group: PRODUCT_HEALTH_GROUP,
  },
  {
    key: 'cac',
    label: 'CAC ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Customer Acquisition Cost',
    group: GROUP_FINANCIALS,
  },
  {
    key: 'ltv',
    label: 'LTV ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Customer Lifetime Value',
    group: GROUP_FINANCIALS,
  },
];

const TARGET_METRICS_CONFIG = TARGET_METRICS_CONFIG_RAW;
// --- Sample Data ---
const SAMPLE_CARD_DATA = {
  total_conversion_rate: 5.21,
  total_sales_sample: 12345.67, // Renamed to avoid conflict if total_sales is a key in DashboardMetrics
  avg_clicks: 152.3,
};

const SAMPLE_CHART_DATA: DashboardMetrics[] = [
  {
    date: 'Jan',
    unique_identifier: 'ASIN_A',
    total_sales: 8500,
    total_orders: 85,
    total_sessions: 1900,
    total_conversion_rate: 4.5,
    ad_spend: 500,
    ad_sales: 2000,
    ad_clicks: 120,
    ad_impressions: 15000,
  },
  {
    date: 'Feb',
    unique_identifier: 'ASIN_A',
    total_sales: 9200,
    total_orders: 92,
    total_sessions: 1840,
    total_conversion_rate: 5.0,
    ad_spend: 550,
    ad_sales: 2200,
    ad_clicks: 135,
    ad_impressions: 16500,
  },
  {
    date: 'Mar',
    unique_identifier: 'ASIN_A',
    total_sales: 11500,
    total_orders: 115,
    total_sessions: 2090,
    total_conversion_rate: 5.5,
    ad_spend: 600,
    ad_sales: 3000,
    ad_clicks: 160,
    ad_impressions: 18000,
  },
  {
    date: 'Apr',
    unique_identifier: 'ASIN_A',
    total_sales: 10800,
    total_orders: 108,
    total_sessions: 2038,
    total_conversion_rate: 5.3,
    ad_spend: 580,
    ad_sales: 2800,
    ad_clicks: 150,
    ad_impressions: 17500,
  },
  {
    date: 'May',
    unique_identifier: 'ASIN_A',
    total_sales: 12500,
    total_orders: 125,
    total_sessions: 2155,
    total_conversion_rate: 5.8,
    ad_spend: 650,
    ad_sales: 3500,
    ad_clicks: 175,
    ad_impressions: 19000,
  },
  {
    date: 'Jun',
    unique_identifier: 'ASIN_A',
    total_sales: 13100,
    total_orders: 131,
    total_sessions: 2183,
    total_conversion_rate: 6.0,
    ad_spend: 700,
    ad_sales: 3800,
    ad_clicks: 180,
    ad_impressions: 20000,
  },
];

// --- Placeholder Components ---
const PlaceholderCard = ({
  title,
  value,
  unit,
  description,
  colorClass = 'text-gray-600',
}: {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  colorClass?: string;
}) => (
  <Card className="opacity-75">
    <CardContent className="p-4">
      <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
        {title}
      </h3>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {typeof value === 'number'
          ? value.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })
          : value}
        {unit}
      </div>
      <div className="text-sm text-gray-500 mt-1">{description}</div>
    </CardContent>
  </Card>
);

// Define PlaceholderChartContainer ONCE
const PlaceholderChartContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="opacity-75">
    <CardContent className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
        {title}{' '}
        <span className="text-sm font-normal">{SUFFIX_SAMPLE_DATA}</span>
      </h3>
      {children}
    </CardContent>
  </Card>
);

// --- Helper Functions for Data Processing ---

// Define getDateFromRow ONCE
const getDateFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
): string => {
  const mappedHeaderString = mappedHeader as string | null;
  const potentialHeaders = [
    mappedHeaderString,
    'Date',
    'Settlement end date',
    'Day',
    'Week',
    'Month',
  ].filter(Boolean) as string[];
  for (const header of potentialHeaders) {
    if (row[header]) return row[header];
  }
  return 'Unknown';
};

const getStringValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
): string | undefined => {
  const mappedHeaderString = mappedHeader as string | null;
  return mappedHeaderString && row[mappedHeaderString]
    ? String(row[mappedHeaderString]).trim()
    : undefined;
};

// Define getNumericValueFromRow ONCE
const getNumericValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
  fallbackHeaders: string[] = [],
): number => {
  const mappedHeaderString = mappedHeader as string | null;
  const headersToCheck = [mappedHeaderString, ...fallbackHeaders].filter(
    Boolean,
  ) as string[];
  for (const header of headersToCheck) {
    const rawValue = row[header];
    if (rawValue !== undefined && rawValue !== null) {
      const cleanedValue = String(rawValue).replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleanedValue);
      if (!isNaN(num)) return num;
    }
  }
  return 0; // Default to 0 if not found or invalid
};

// Define transformCsvRow ONCE
const transformCsvRow = (
  row: Record<string, string>,
  mapping: CsvColumnMapping,
): DashboardMetrics | null => {
  const dateHeader = mapping.date;
  const date = getDateFromRow(row, dateHeader);
  if (date === 'Unknown') {
    return null; // Skip rows where date cannot be determined
  }

  const unique_identifier = getStringValueFromRow(
    row,
    mapping.unique_identifier,
  );

  // Overall Performance Metrics
  const total_sales = getNumericValueFromRow(row, mapping.total_sales, [
    'Ordered product sales',
    'Gross Sales',
  ]);
  const total_orders = getNumericValueFromRow(row, mapping.total_orders, [
    'Total order items',
    'Units Ordered',
  ]);
  const total_sessions = getNumericValueFromRow(row, mapping.total_sessions, [
    'Sessions', // Business Report (Child ASIN)
    '(Parent ASIN) Sessions', // Business Report (Parent ASIN)
  ]);
  const total_page_views = getNumericValueFromRow(
    row,
    mapping.total_page_views,
    [
      'Page Views', // Business Report (Child ASIN)
      '(Parent ASIN) Page Views', // Business Report (Parent ASIN)
    ],
  );

  const rawTotalConversionRate =
    total_sessions && total_sessions > 0 && total_orders
      ? (total_orders / total_sessions) * 100
      : 0;
  const total_conversion_rate = parseFloat(rawTotalConversionRate.toFixed(2));

  // Advertising Metrics
  const ad_impressions = getNumericValueFromRow(row, mapping.ad_impressions, [
    'Impressions',
  ]);
  const ad_clicks = getNumericValueFromRow(row, mapping.ad_clicks, ['Clicks']); // Common in Ad reports
  const ad_spend = getNumericValueFromRow(row, mapping.ad_spend, [
    'Spend',
    'Cost',
  ]);
  const ad_sales = getNumericValueFromRow(row, mapping.ad_sales, [
    'Sales',
    '7 Day Total Sales ',
  ]); // Check specific ad report headers
  const ad_orders = getNumericValueFromRow(row, mapping.ad_orders, [
    'Orders',
    '7 Day Total Orders ',
  ]); // Check specific ad report headers

  // Calculated Advertising Metrics
  const acos =
    ad_spend && ad_sales && ad_sales > 0 ? (ad_spend / ad_sales) * 100 : 0;
  const roas = ad_spend && ad_spend > 0 && ad_sales ? ad_sales / ad_spend : 0;
  const cpc = ad_spend && ad_clicks && ad_clicks > 0 ? ad_spend / ad_clicks : 0;
  const ctr =
    ad_impressions && ad_impressions > 0 && ad_clicks
      ? (ad_clicks / ad_impressions) * 100
      : 0;
  const ad_conversion_rate =
    ad_clicks && ad_clicks > 0 && ad_orders ? (ad_orders / ad_clicks) * 100 : 0;

  // Other metrics
  const profit = getNumericValueFromRow(row, mapping.profit);
  const inventory_level = getNumericValueFromRow(row, mapping.inventory_level);
  const review_rating = getNumericValueFromRow(row, mapping.review_rating);
  const cac = getNumericValueFromRow(row, mapping.cac);
  const ltv = getNumericValueFromRow(row, mapping.ltv);

  const metricData: DashboardMetrics = {
    date: date,
    unique_identifier: unique_identifier,
    total_sales: total_sales,
    total_orders: total_orders,
    total_sessions: total_sessions,
    total_page_views: total_page_views,
    total_conversion_rate: isNaN(total_conversion_rate)
      ? 0
      : total_conversion_rate,
    ad_impressions: ad_impressions,
    ad_clicks: ad_clicks,
    ad_spend: ad_spend,
    ad_sales: ad_sales,
    ad_orders: ad_orders,
    acos: parseFloat(acos.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    ad_conversion_rate: parseFloat(ad_conversion_rate.toFixed(2)),
    profit: profit,
    inventory_level: inventory_level,
    review_rating: review_rating,
    cac: cac,
    ltv: ltv,
  };
  return metricData;
};

// --- Component ---
// Define UnifiedDashboard component ONCE
export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For general loading/refresh
  const [isParsing, setIsParsing] = useState(false); // Specific state for file parsing/processing
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NEW State for Mapping ---
  const [showMapper, setShowMapper] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstCsvDataRow, setFirstCsvDataRow] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [timeGranularity, setTimeGranularity] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('daily');
  // --- End NEW State ---

  const SALES_LABEL = 'Sales';
  const PLACEHOLDER_AXIS_STROKE_COLOR = '#a0a0a0';

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowMapper(false); // Ensure mapper is hidden on refresh
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setMetrics([]); // Optionally clear metrics on refresh
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate action
    setIsLoading(false);
  }, []);

  // --- MODIFIED handleFileChange ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsing(true);
    setError(null);
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);

    // Pre-parse to get headers
    Papa.parse(file, {
      header: true,
      preview: 2, // Parse header + first data row to get a sample
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields;
        const sampleRow = results.data[0] as Record<string, string> | undefined;

        if (!headers || headers.length === 0) {
          setError('Could not read headers from the CSV file. Is it valid?');
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        setCsvHeaders(headers);
        setFirstCsvDataRow(sampleRow);
        setSelectedFile(file); // Store the file for later full parsing
        setShowMapper(true); // Show the mapper UI
        setIsParsing(false); // Stop parsing indicator for mapping phase
      },
      error: (error: Error) => {
        console.error('Error pre-parsing CSV:', error);
        setError(`Failed to read file headers: ${error.message}`);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });

    // Don't reset file input value here, reset after full processing or cancel
  };

  // --- MODIFIED handleMappingComplete ---
  const handleMappingComplete = (mapping: CsvColumnMapping) => {
    console.log('Mapping confirmed:', mapping);
    if (!selectedFile) {
      setError('No file selected for processing.');
      setShowMapper(false);
      return;
    }

    setShowMapper(false);
    setIsParsing(true); // Start processing indicator
    setError(null);
    setMetrics([]);

    // Now parse the *full* file using the mapping
    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Parsed Full CSV Data:', results.data);
        try {
          // Use the extracted helper function for transformation
          const transformedMetrics = results.data
            .map((row) => transformCsvRow(row, mapping))
            .filter((metric): metric is DashboardMetrics => metric !== null); // Filter out nulls (rows that couldn't be processed)

          console.log('Transformed Metrics:', transformedMetrics);

          if (transformedMetrics.length === 0 && results.data.length > 0) {
            setError(
              'Could not extract valid data using the provided mapping. Check mapping and report format/headers.',
            );
            setMetrics([]);
          } else if (transformedMetrics.length === 0) {
            setError(
              'No data rows found or processed successfully in the file.',
            );
            setMetrics([]);
          } else {
            setMetrics(transformedMetrics);
            setError(null); // Clear error on success
          }
        } catch (transformError: unknown) {
          console.error('Error transforming data:', transformError);
          setError(
            `Error processing report data: ${(transformError as Error).message}`,
          );
          setMetrics([]);
        } finally {
          setIsParsing(false);
          // Reset file input after successful processing
          if (fileInputRef.current) fileInputRef.current.value = '';
          setSelectedFile(null); // Clear stored file
        }
      },
      error: (error: Error) => {
        console.error('Error parsing full CSV:', error);
        setError(`Failed to parse file: ${error.message}`);
        setMetrics([]);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null); // Clear stored file
      },
    });
  };

  // --- NEW handleMappingCancel ---
  const handleMappingCancel = () => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null); // Clear any errors from pre-parsing
    setIsParsing(false);
    // Reset file input if user cancels mapping
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Mapping cancelled.');
  };

  const handleDownloadSampleCsv = async () => {
    try {
      const response = await fetch('/api/download');
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_amazon_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error('Error downloading sample CSV:', error);
      setError(`Download failed: ${(error as Error).message}`);
    }
  };

  const handleUploadClick = () => {
    // Reset state before triggering upload to ensure clean slate
    setMetrics([]);
    setError(null);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear previous selection
    }
    fileInputRef.current?.click();
  };

  const handleExport = useCallback(() => {
    console.log('Exporting dashboard data...');
    if (metrics.length === 0) {
      setError('No data to export.');
      return;
    }
    try {
      const csv = Papa.unparse(metrics);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dashboard_metrics.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err: unknown) {
      setError(
        `Failed to export data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }, [metrics]);

  // Define an intermediate type for aggregation to make properties non-optional

  // --- Data Aggregation for Time Drill-Down ---
  const aggregateMetricsByTime = (
    data: DashboardMetrics[],
    granularity: typeof timeGranularity,
  ): DashboardMetrics[] => {
    if (granularity === 'daily' || !data.length) {
      return data;
    }

    const getPeriodStart = (dateStr: string): Date => {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateObj; // Should not happen with valid data

      switch (granularity) {
        case 'weekly':
          return startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday
        case 'monthly':
          return startOfMonth(dateObj);
        case 'quarterly':
          return startOfQuarter(dateObj);
        case 'yearly':
          return startOfYear(dateObj);
        default:
          return dateObj;
      }
    };

    const aggregated = data.reduce(
      (acc, metric) => {
        const periodStartDate = getPeriodStart(metric.date);
        const periodKey = format(periodStartDate, 'yyyy-MM-dd');

        if (!acc[periodKey]) {
          acc[periodKey] = {
            ...metric, // Copy non-numeric fields from the first metric in the period
            unique_identifier: metric.unique_identifier || 'Aggregated', // Or handle unique_id aggregation differently
            date: periodKey, // Use the period start date
            // Initialize all numeric fields to 0 for summation
            total_sales: 0,
            total_orders: 0,
            total_sessions: 0,
            total_page_views: 0,
            ad_impressions: 0,
            ad_clicks: 0,
            ad_spend: 0,
            ad_sales: 0,
            ad_orders: 0,
            profit: 0, // Sum if applicable
            inventory_level: 0, // Typically last value or not summed, handle as needed
            review_rating: 0, // Typically average or last value, handle as needed
            cac: 0, // Sum if applicable
            ltv: 0, // Sum if applicable
          };
        }

        const current = acc[periodKey];
        current.total_sales =
          (current.total_sales || 0) + (metric.total_sales || 0);
        current.total_orders =
          (current.total_orders || 0) + (metric.total_orders || 0);
        current.total_sessions =
          (current.total_sessions || 0) + (metric.total_sessions || 0);
        current.total_page_views =
          (current.total_page_views || 0) + (metric.total_page_views || 0);
        current.ad_impressions =
          (current.ad_impressions || 0) + (metric.ad_impressions || 0);
        current.ad_clicks = (current.ad_clicks || 0) + (metric.ad_clicks || 0);
        current.ad_spend = (current.ad_spend || 0) + (metric.ad_spend || 0);
        current.ad_sales = (current.ad_sales || 0) + (metric.ad_sales || 0);
        current.ad_orders = (current.ad_orders || 0) + (metric.ad_orders || 0);
        current.profit = (current.profit || 0) + (metric.profit || 0);
        current.cac = (current.cac || 0) + (metric.cac || 0);
        current.ltv = (current.ltv || 0) + (metric.ltv || 0);

        return acc;
      },
      {} as Record<string, DashboardMetrics>,
    );

    return Object.values(aggregated)
      .map((m: DashboardMetrics) => {
        // Recalculate derived metrics from aggregated sums
        const total_conversion_rate_avg =
          m.total_sessions && m.total_sessions > 0 && m.total_orders
            ? (m.total_orders / m.total_sessions) * 100
            : 0; // Fallback to rate of sums

        const acos =
          m.ad_spend && m.ad_sales && m.ad_sales > 0
            ? (m.ad_spend / m.ad_sales) * 100
            : 0;
        const roas =
          m.ad_spend && m.ad_spend > 0 && m.ad_sales
            ? m.ad_sales / m.ad_spend
            : 0;
        const cpc =
          m.ad_spend && m.ad_clicks && m.ad_clicks > 0
            ? m.ad_spend / m.ad_clicks
            : 0;
        const ctr =
          m.ad_impressions && m.ad_impressions > 0 && m.ad_clicks
            ? (m.ad_clicks / m.ad_impressions) * 100
            : 0;
        const ad_conversion_rate =
          m.ad_clicks && m.ad_clicks > 0 && m.ad_orders
            ? (m.ad_orders / m.ad_clicks) * 100
            : 0;

        return {
          ...m,
          total_conversion_rate: parseFloat(
            total_conversion_rate_avg.toFixed(2),
          ),
          acos: parseFloat(acos.toFixed(2)),
          roas: parseFloat(roas.toFixed(2)),
          cpc: parseFloat(cpc.toFixed(2)),
          ctr: parseFloat(ctr.toFixed(2)),
          ad_conversion_rate: parseFloat(ad_conversion_rate.toFixed(2)),
        };
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) as DashboardMetrics[];
  };

  // --- Helper Components for Overview Tab Rendering ---

  const OverviewLoadingIndicator: React.FC<{ showMapperText: boolean }> = ({
    showMapperText,
  }) => (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          {showMapperText ? 'Loading Mapper...' : 'Processing data...'}
        </p>
      </CardContent>
    </Card>
  );

  const OverviewDataMapper: React.FC<{
    csvHeaders: string[];
    targetMetrics: typeof TARGET_METRICS_CONFIG;
    onMappingComplete: (mapping: CsvColumnMapping) => void;
    sampleDataRow?: Record<string, string>;
    onCancel: () => void;
  }> = ({
    csvHeaders,
    targetMetrics,
    onMappingComplete,
    sampleDataRow,
    onCancel,
  }) => (
    <GenericCsvDataMapper
      csvHeaders={csvHeaders}
      targetMetrics={targetMetrics}
      onMappingComplete={onMappingComplete}
      sampleDataRow={sampleDataRow}
      onCancel={onCancel}
      title="Map Report Columns"
      description="Match the columns from your uploaded Report CSV to the required dashboard fields. Required fields are needed for calculations."
      toolName="overview-dashboard"
    />
  );

  const OverviewErrorDisplay: React.FC<{
    error: string;
    onRetryUpload: () => void;
  }> = ({ error, onRetryUpload }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error}
        <Button
          variant="link"
          className="p-0 h-auto ml-2 text-destructive"
          onClick={onRetryUpload}
        >
          Try uploading again?
        </Button>
      </AlertDescription>
    </Alert>
  );

  // --- Helper functions for ComparisonKpiCard (defined outside to reduce parent complexity) ---
  const calculatePercentageChange = (
    current?: number,
    previous?: number,
  ): number | null => {
    if (typeof current !== 'number' || typeof previous !== 'number') {
      return null;
    }
    if (previous !== 0) {
      return ((current - previous) / Math.abs(previous)) * 100;
    }
    if (current !== 0) {
      return current > 0 ? Infinity : -Infinity;
    }
    return 0; // Both are 0
  };

  interface ChangeDisplayProps {
    text: string;
    color: string;
    Icon: React.ElementType;
  }

  const getChangeDisplayProperties = (
    percentageChange: number | null,
    higherIsBetter: boolean,
  ): ChangeDisplayProps => {
    if (percentageChange === null) {
      return {
        text: DEFAULT_CHANGE_TEXT,
        color: 'text-muted-foreground',
        Icon: Minus,
      };
    }

    const getIconAndColor = (
      isPositive: boolean,
    ): { Icon: React.ElementType; color: string } => {
      const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
      const color =
        higherIsBetter === isPositive ? 'text-green-600' : 'text-red-600';
      return { Icon, color };
    };

    if (percentageChange === Infinity) {
      return { text: POSITIVE_INFINITY_CHANGE_TEXT, ...getIconAndColor(true) };
    }

    if (percentageChange === -Infinity) {
      return { text: NEGATIVE_INFINITY_CHANGE_TEXT, ...getIconAndColor(false) };
    }

    if (percentageChange !== 0) {
      const isPositiveTrend = percentageChange > 0;
      const { Icon, color } = getIconAndColor(isPositiveTrend);
      return {
        text: `${isPositiveTrend ? '+' : ''}${percentageChange.toFixed(1)}% ${DEFAULT_CHANGE_TEXT}`,
        color,
        Icon,
      };
    }
    return {
      text: DEFAULT_CHANGE_TEXT,
      color: 'text-muted-foreground',
      Icon: Minus,
    };
  };

  // --- NEW Comparison KPI Card Component ---
  interface ComparisonKpiCardProps {
    title: string;
    currentValue?: number;
    previousValue?: number;
    unit?: '%' | '$' | ''; // Unit for the main value
    higherIsBetter?: boolean;
    isPercentage?: boolean; // If the value itself is a percentage (e.g. ACoS, Conversion Rate)
  }

  const ComparisonKpiCard: React.FC<ComparisonKpiCardProps> = ({
    title,
    currentValue,
    previousValue,
    unit = '',
    higherIsBetter = true,
    isPercentage = false,
  }) => {
    const percentageChange = calculatePercentageChange(
      currentValue,
      previousValue,
    );
    const {
      text: changeText,
      color: changeColor,
      Icon: ChangeIcon,
    } = getChangeDisplayProperties(percentageChange, higherIsBetter);

    const displayValue =
      typeof currentValue === 'number'
        ? `${unit === '$' ? '$' : ''}${currentValue.toLocaleString(undefined, { minimumFractionDigits: isPercentage ? 1 : 2, maximumFractionDigits: isPercentage ? 1 : 2 })}${unit === '%' ? '%' : ''}`
        : 'N/A';
    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </h4>
          <div className="text-2xl font-bold">{displayValue}</div>
          <div className={`text-xs flex items-center ${changeColor} mt-1`}>
            <ChangeIcon className="h-3 w-3 mr-1" /> {changeText}
          </div>
        </CardContent>
      </Card>
    );
  };

  const OverviewDataView: React.FC<{ metrics: DashboardMetrics[] }> = ({
    metrics,
  }) => {
    // Initial sort for raw daily data if needed, then aggregate
    const dailySortedMetrics = [...metrics].sort(
      (a, b) =>
        new Date(a.date as string).getTime() -
        new Date(b.date as string).getTime(),
    );
    const aggregatedAndSortedMetrics = aggregateMetricsByTime(
      dailySortedMetrics,
      timeGranularity,
    );

    return (
      <>
        {/* Time Granularity Selector - Moved up */}
        <div className="my-4 flex justify-end">
          <Select
            value={timeGranularity}
            onValueChange={(value) =>
              setTimeGranularity(value as typeof timeGranularity)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">
                Avg. Conversion Rate
              </h3>
              <div className="text-3xl font-bold text-blue-600">
                {(aggregatedAndSortedMetrics.length > 0 &&
                aggregatedAndSortedMetrics.every(
                  (m) => typeof m.total_conversion_rate === 'number',
                )
                  ? aggregatedAndSortedMetrics.reduce(
                      (sum, m) => sum + (m.total_conversion_rate || 0),
                      0,
                    ) / aggregatedAndSortedMetrics.length
                  : 0
                ).toFixed(2)}
                %
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Avg. (Orders/Sessions) from Report
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
              <div className="text-3xl font-bold text-green-600">
                $
                {aggregatedAndSortedMetrics
                  .reduce((sum, m) => sum + (m.total_sales || 0), 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Sum from Report Period
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Avg. Clicks</h3>
              <div className="text-3xl font-bold text-yellow-600">
                {(aggregatedAndSortedMetrics.length > 0 &&
                aggregatedAndSortedMetrics.every(
                  (m) => typeof m.ad_clicks === 'number',
                )
                  ? aggregatedAndSortedMetrics.reduce(
                      (sum, m) => sum + (m.ad_clicks || 0),
                      0,
                    ) / aggregatedAndSortedMetrics.length
                  : 0
                ).toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Average from Report
              </div>
            </CardContent>
          </Card>
        </div>
        {/* --- Period-over-Period Comparison Section --- */}
        {aggregatedAndSortedMetrics.length >= 2 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">
              Period-over-Period Comparison (
              {timeGranularity.charAt(0).toUpperCase() +
                timeGranularity.slice(1)}
              )
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ComparisonKpiCard
                title="Total Sales"
                currentValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 1
                  ]?.total_sales
                }
                previousValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 2
                  ]?.total_sales
                }
                unit="$"
              />
              <ComparisonKpiCard
                title="Total Orders"
                currentValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 1
                  ]?.total_orders
                }
                previousValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 2
                  ]?.total_orders
                }
              />
              <ComparisonKpiCard
                title="Conversion Rate"
                currentValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 1
                  ]?.total_conversion_rate
                }
                previousValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 2
                  ]?.total_conversion_rate
                }
                unit="%"
                isPercentage
              />
              <ComparisonKpiCard
                title="ACoS"
                currentValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 1
                  ]?.acos
                }
                previousValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 2
                  ]?.acos
                }
                unit="%"
                higherIsBetter={false}
                isPercentage
              />
              <ComparisonKpiCard
                title="RoAS"
                currentValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 1
                  ]?.roas
                }
                previousValue={
                  aggregatedAndSortedMetrics[
                    aggregatedAndSortedMetrics.length - 2
                  ]?.roas
                }
              />
            </div>
          </div>
        )}{' '}
        {/* This closing parenthesis ends the conditional block */}
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Trends Chart */}
          <SalesTrendsChart
            sortedMetrics={aggregatedAndSortedMetrics}
            granularity={timeGranularity}
          />
          {/* Clicks & Impressions Chart */}
          <ClicksImpressionsChart
            sortedMetrics={aggregatedAndSortedMetrics}
            granularity={timeGranularity}
          />
          {/* Orders & Sessions Chart */}
          <OrdersSessionsChart
            sortedMetrics={aggregatedAndSortedMetrics}
            granularity={timeGranularity}
          />
        </div>
      </>
    );
  };

  // Main render function for the Overview tab, now simplified
  const renderOverviewContent = () => {
    // Cognitive Complexity for this function will be reduced
    if (isParsing) {
      return <OverviewLoadingIndicator showMapperText={showMapper} />;
    }

    if (showMapper && csvHeaders.length > 0) {
      return (
        <OverviewDataMapper
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onMappingComplete={handleMappingComplete}
          sampleDataRow={firstCsvDataRow}
          onCancel={handleMappingCancel}
        />
      );
    }

    if (error && !isLoading) {
      return (
        <OverviewErrorDisplay error={error} onRetryUpload={handleUploadClick} />
      );
    }

    if (metrics.length > 0) {
      return <OverviewDataView metrics={metrics} />;
    }
    // --- Placeholder Content (Default) ---
    return (
      <div className="space-y-4">
        {/* Upload Area */}
        <div className="mb-4 p-4 border rounded-md bg-muted/40">
          <h4 className="text-lg font-medium mb-2">Load Overview Data</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Upload an Amazon Business Report CSV to visualize your key metrics.
            You&apos;ll be asked to map the columns after uploading.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
            id="csvFileInput"
          />
          <Button onClick={handleUploadClick} disabled={isParsing}>
            {isParsing ? 'Reading File...' : 'Choose Report File (.csv)'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadSampleCsv}
            className="ml-2"
          >
            <Download className="mr-2 h-4 w-4" /> Download Sample CSV
          </Button>
        </div>

        {/* Placeholder Cards & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <PlaceholderCard
            title="Avg. Conversion Rate"
            value={SAMPLE_CARD_DATA.total_conversion_rate}
            unit="%"
            description={DESC_SAMPLE_DATA}
            colorClass="text-blue-400"
          />
          <PlaceholderCard
            title="Total Sales"
            value={SAMPLE_CARD_DATA.total_sales_sample.toLocaleString(
              undefined,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
            description={DESC_SAMPLE_DATA}
            colorClass="text-green-400"
          />
          <PlaceholderCard
            title="Avg. Clicks"
            value={SAMPLE_CARD_DATA.avg_clicks}
            description={DESC_SAMPLE_DATA}
            colorClass="text-yellow-400"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlaceholderChartContainer title="Sales Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={SAMPLE_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke={PLACEHOLDER_AXIS_STROKE_COLOR} />
                <YAxis stroke={PLACEHOLDER_AXIS_STROKE_COLOR} />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_sales" // Updated to total_sales
                  stroke="#a3a0d8" // Muted color
                  name={SALES_LABEL}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </PlaceholderChartContainer>
          <PlaceholderChartContainer title="Clicks & Impressions">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SAMPLE_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke={PLACEHOLDER_AXIS_STROKE_COLOR} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke={PLACEHOLDER_AXIS_STROKE_COLOR}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={PLACEHOLDER_AXIS_STROKE_COLOR}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="ad_impressions" // Updated to ad_impressions
                  fill="#a3a0d8" // Muted color
                  name="Impressions"
                />
                <Bar
                  yAxisId="right"
                  dataKey="ad_clicks" // Updated to ad_clicks
                  fill="#a2cabd" // Muted color
                  name="Clicks"
                />
              </BarChart>
            </ResponsiveContainer>
          </PlaceholderChartContainer>
        </div>
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium text-primary dark:text-blue-300">
              While you&apos;re here, feel free to explore the other specialized
              tools available in the tabs above!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // --- Main Render ---

  // --- Individual Chart Components ---
  const formatTick = (tick: string, granularity: typeof timeGranularity) => {
    const date = new Date(tick);
    if (granularity === 'daily') return format(date, 'MMM d');
    if (granularity === 'weekly') return `W/o ${format(date, 'MMM d')}`;
    if (granularity === 'monthly') return format(date, 'MMM yyyy');
    if (granularity === 'quarterly') {
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      return `Q${quarter} ${format(date, 'yyyy')}`;
    }
    if (granularity === 'yearly') return format(date, 'yyyy');
    return tick;
  };

  const formatTooltipLabel = (
    label: string,
    granularity: typeof timeGranularity,
  ) => {
    const date = new Date(label);
    if (granularity === 'weekly') {
      const endDate = addDays(date, 6);
      return `${format(date, DATE_FORMAT_TOOLTIP_DEFAULT)} - ${format(endDate, DATE_FORMAT_TOOLTIP_DEFAULT)}`;
    }
    // For other granularities, a single date representation might be fine or could be expanded
    return format(date, DATE_FORMAT_TOOLTIP_DEFAULT);
  };

  const SalesTrendsChart: React.FC<{
    sortedMetrics: DashboardMetrics[];
    granularity: typeof timeGranularity;
  }> = ({ sortedMetrics, granularity }) => {
    const SALES_OR_DATE_NOT_AVAILABLE =
      'Total Sales or Date data not available for chart.';
    return (
      <Card>
        <CardContent className="p-4 h-[350px]">
          <h3 className="text-lg font-semibold mb-4">Total Sales Trends</h3>
          {sortedMetrics.length > 0 &&
          sortedMetrics[0]?.total_sales !== undefined &&
          sortedMetrics[0]?.date !== undefined ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sortedMetrics}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => formatTick(tick, granularity)}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    SALES_LABEL,
                  ]}
                  labelFormatter={(label) =>
                    formatTooltipLabel(label, granularity)
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_sales"
                  stroke="#8884d8"
                  name={SALES_LABEL}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
              {SALES_OR_DATE_NOT_AVAILABLE}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ClicksImpressionsChart: React.FC<{
    sortedMetrics: DashboardMetrics[];
    granularity: typeof timeGranularity;
  }> = ({ sortedMetrics, granularity }) => {
    const SALES_OR_DATE_NOT_AVAILABLE =
      'Ad Clicks, Ad Impressions or Date data not available for chart.';
    return (
      <Card>
        <CardContent className="p-4 h-[350px]">
          <h3 className="text-lg font-semibold mb-4">
            Ad Clicks & Ad Impressions
          </h3>
          {sortedMetrics.length > 0 &&
          sortedMetrics[0]?.ad_clicks !== undefined &&
          sortedMetrics[0]?.ad_impressions !== undefined &&
          sortedMetrics[0]?.date !== undefined ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedMetrics}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => formatTick(tick, granularity)}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  labelFormatter={(label) =>
                    formatTooltipLabel(label, granularity)
                  }
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="ad_impressions"
                  fill="#8884d8"
                  name="Ad Impressions"
                />
                <Bar
                  yAxisId="right"
                  dataKey="ad_clicks"
                  fill="#82ca9d"
                  name="Ad Clicks"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
              {SALES_OR_DATE_NOT_AVAILABLE}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const OrdersSessionsChart: React.FC<{
    sortedMetrics: DashboardMetrics[];
    granularity: typeof timeGranularity;
  }> = ({ sortedMetrics, granularity }) => {
    const SALES_OR_DATE_NOT_AVAILABLE =
      'Total Orders, Total Sessions or Date data not available for chart.';
    return (
      <Card>
        <CardContent className="p-4 h-[350px]">
          <h3 className="text-lg font-semibold mb-4">
            Total Orders & Total Sessions Over Time
          </h3>
          {sortedMetrics.length > 0 &&
          sortedMetrics[0]?.total_orders !== undefined &&
          sortedMetrics[0]?.total_sessions !== undefined &&
          sortedMetrics[0]?.date !== undefined ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedMetrics}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => formatTick(tick, granularity)}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'total_orders' ? 'Total Orders' : 'Total Sessions',
                  ]}
                  labelFormatter={(label) =>
                    formatTooltipLabel(label, granularity)
                  }
                />
                <Legend />
                <Bar
                  dataKey="total_orders"
                  fill="#ffc658"
                  name="Total Orders"
                />
                <Bar
                  dataKey="total_sessions"
                  fill="#fb8c00"
                  name="Total Sessions"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
              {SALES_OR_DATE_NOT_AVAILABLE}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold my-6 text-center">
        Amazon Seller Tools Dashboard
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Access a suite of tools designed to help Amazon sellers analyze data,
        optimize listings, and improve performance.
      </p>
      {/* Replaced UnifiedDashboardHeader component with its inline functionality */}
      <div className="mb-12" aria-live="polite">
        {/* Consistent bottom margin for the header block */}
        {/* Removed the empty h2 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Status Indicators (left side on sm+) */}
          <div className="flex items-center space-x-2 min-h-[24px]">
            {' '}
            {/* min-h to prevent layout shift */}
            {(isLoading || isParsing) && ( // Use combined loading state
              <div className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />{' '}
                {/* Use Loader2 from lucide-react */}
                <span className="text-sm text-muted-foreground">
                  {isParsing ? 'Processing file...' : 'Refreshing...'}{' '}
                  {/* More specific message */}
                </span>
              </div>
            )}
            {/* Show error only if not loading and not showing the mapper */}
            {error && !(isLoading || isParsing) && !showMapper && (
              <span className="text-sm text-red-500" role="alert">
                {error}
              </span>
            )}
          </div>

          {/* Action Buttons (right side on sm+) */}
          <div className="flex items-center space-x-2 flex-wrap justify-center">
            <Button
              variant="outline"
              onClick={handleRefresh} // Use the page's handleRefresh
              aria-label="Refresh Dashboard"
              disabled={isLoading || isParsing} // Disable while loading or parsing
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              aria-label="Export Data"
              disabled={metrics.length === 0 || isLoading || isParsing}
            >
              {' '}
              {/* Disable if no data or loading */}
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" asChild aria-label="View Documentation">
              <a
                href="https://wescode.vercel.app/blog/amazon-seller-tools"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Docs
              </a>
            </Button>
          </div>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="listing-optimization">
            Listing Optimization
          </TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="ppc-ads">PPC & Ads</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
        </TabsList>

        {/* --- Overview Tab --- */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Use the refactored rendering function */}
          {renderOverviewContent()}
        </TabsContent>

        {/* --- Other Tabs --- */}
        <TabsContent value="keywords">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Keyword Tools</h3>
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
                  <TabsTrigger value="deduplicator">Deduplicator</TabsTrigger>
                  <TabsTrigger value="trend">Trend Analyzer</TabsTrigger>
                </TabsList>
                <TabsContent value="analyzer">
                  <KeywordAnalyzer />
                </TabsContent>
                <TabsContent value="deduplicator">
                  <KeywordDeduplicator />
                </TabsContent>
                <TabsContent value="trend">
                  <KeywordTrendAnalyzer />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="listing-optimization">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">
                Listing Optimization Tools
              </h3>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">Description Editor</TabsTrigger>
                  <TabsTrigger value="quality">Quality Checker</TabsTrigger>
                  <TabsTrigger value="score">Score Calculator</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <DescriptionEditor />
                </TabsContent>
                <TabsContent value="quality">
                  <ListingQualityChecker />
                </TabsContent>
                <TabsContent value="score">
                  <ProductScoreCalculator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financials">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Financial Tools</h3>
              <Tabs defaultValue="fba" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="fba">FBA Calculator</TabsTrigger>
                  <TabsTrigger value="acos">ACoS Calculator</TabsTrigger>
                  <TabsTrigger value="profit">Profit Margin Calc</TabsTrigger>
                  <TabsTrigger value="price">Optimal Price Calc</TabsTrigger>
                </TabsList>
                <TabsContent value="fba">
                  <FbaCalculator />
                </TabsContent>
                <TabsContent value="acos">
                  <AcosCalculator />
                </TabsContent>
                <TabsContent value="profit">
                  <ProfitMarginCalculator />
                </TabsContent>
                <TabsContent value="price">
                  <OptimalPriceCalculator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ppc-ads">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">PPC & Ads Tools</h3>
              <Tabs defaultValue="auditor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="auditor">Campaign Auditor</TabsTrigger>
                  {/* Add more PPC tabs if needed */}
                </TabsList>
                <TabsContent value="auditor">
                  <PpcCampaignAuditor />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="competition">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Competition Tools</h3>
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">
                    Competitor Analyzer
                  </TabsTrigger>
                  <TabsTrigger value="estimator">Sales Estimator</TabsTrigger>
                </TabsList>
                <TabsContent value="analyzer">
                  <CompetitorAnalyzer />
                </TabsContent>
                <TabsContent value="estimator">
                  <SalesEstimator />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
