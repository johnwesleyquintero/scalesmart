// src/components/amazon-seller-tools/unified-dashboard.tsx
'use client';

import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
// ... other imports: Card, Tabs, Charts, Header, Tool Components ...
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { UnifiedDashboardHeader } from './UnifiedDashboardHeader';

// Tool Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import CsvDataMapper from './CsvDataMapper'; // <--- IMPORT CsvDataMapper
import AcosCalculator from './acos-calculator';
import { CompetitorAnalyzer } from './competitor-analyzer';
import DescriptionEditor from './description-editor';
import FbaCalculator from './fba-calculator';
import KeywordAnalyzer from './keyword-analyzer';
import KeywordDeduplicator from './keyword-deduplicator';
import KeywordTrendAnalyzer from './keyword-trend-analyzer';
import ListingQualityChecker from './listing-quality-checker';
import OptimalPriceCalculator from './optimal-price-calculator';
import PpcCampaignAuditor from './ppc-campaign-auditor';
import ProductScoreCalculator from './product-score-calculator';
import ProfitMarginCalculator from './profit-margin-calculator';
import SalesEstimator from './sales-estimator';

// --- Interface ---
// Define DashboardMetrics interface ONCE
interface DashboardMetrics {
  date: string;
  sales: number;
  profit: number;
  acos: number;
  impressions: number;
  clicks: number;
  conversion_rate: number;
  inventory_level: number;
  review_rating: number;
  orders?: number;
  sessions?: number;
  // Add index signature to satisfy Record<string, unknown> constraint
  [key: string]: unknown;
}

// --- Target Metrics for Mapper ---
// Define the structure and requirements for mapping
const TARGET_METRICS_CONFIG: {
  key: keyof DashboardMetrics;
  label: string;
  required: boolean;
}[] = [
  { key: 'date', label: 'Date/Period', required: true },
  { key: 'sales', label: 'Sales ($)', required: true },
  { key: 'impressions', label: 'Impressions', required: false }, // Make optional if not always needed for initial view
  { key: 'clicks', label: 'Clicks', required: false }, // Make optional
  { key: 'orders', label: 'Orders/Units', required: true }, // Required for Conversion Rate
  { key: 'sessions', label: 'Sessions/Views', required: true }, // Required for Conversion Rate
  // Add other optional metrics if needed for direct mapping
  // { key: 'profit', label: 'Profit ($)', required: false },
  // { key: 'acos', label: 'ACoS (%)', required: false },
  // { key: 'inventory_level', label: 'Inventory Level', required: false },
  // { key: 'review_rating', label: 'Review Rating', required: false },
];

// --- Sample Data ---
const SAMPLE_CARD_DATA = {
  conversion_rate: 5.21,
  total_sales: 12345.67,
  avg_clicks: 152.3,
};

const SAMPLE_CHART_DATA: DashboardMetrics[] = [
  {
    date: 'Jan',
    sales: 8500,
    clicks: 120,
    impressions: 15000,
    conversion_rate: 4.5,
    profit: 0,
    acos: 0,
    inventory_level: 0,
    review_rating: 0,
    orders: 5,
    sessions: 111,
  },
  {
    date: 'Feb',
    sales: 9200,
    clicks: 135,
    impressions: 16500,
    conversion_rate: 5.0,
    profit: 0,
    acos: 0,
    inventory_level: 0,
    review_rating: 0,
    orders: 7,
    sessions: 140,
  },
  {
    date: 'Mar',
    sales: 11500,
    clicks: 160,
    impressions: 18000,
    conversion_rate: 5.5,
    profit: 0,
    acos: 0,
    inventory_level: 0,
    review_rating: 0,
    orders: 9,
    sessions: 164,
  },
  {
    date: 'Apr',
    sales: 10800,
    clicks: 150,
    impressions: 17500,
    conversion_rate: 5.3,
    profit: 0,
    acos: 0,
    inventory_level: 0,
    review_rating: 0,
    orders: 8,
    sessions: 151,
  },
  {
    date: 'May',
    sales: 12500,
    clicks: 175,
    impressions: 19000,
    conversion_rate: 5.8,
    profit: 0,
    acos: 0,
    inventory_level: 0,
    review_rating: 0,
    orders: 10,
    sessions: 172,
  },
  {
    date: 'Jun',
    sales: 13100,
    clicks: 180,
    impressions: 20000,
    conversion_rate: 6.0,
    profit: 0,
    acos: 0,
    inventory_level: 0,
    review_rating: 0,
    orders: 11,
    sessions: 183,
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
        {title} <span className="text-sm font-normal">(Sample Data)</span>
      </h3>
      {children}
    </CardContent>
  </Card>
);

// --- Helper Functions for Data Processing ---

// Define getDateFromRow ONCE
const getDateFromRow = (
  row: Record<string, string>,
  mappedHeader: string | null,
): string => {
  const potentialHeaders = [
    mappedHeader,
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

// Define getNumericValueFromRow ONCE
const getNumericValueFromRow = (
  row: Record<string, string>,
  mappedHeader: string | null,
  fallbackHeaders: string[] = [],
): number => {
  const headersToCheck = [mappedHeader, ...fallbackHeaders].filter(
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
  mapping: Record<keyof DashboardMetrics, string | null>,
): DashboardMetrics | null => {
  const date = getDateFromRow(row, mapping.date);
  if (date === 'Unknown') {
    return null; // Skip rows where date cannot be determined
  }

  const sales = getNumericValueFromRow(row, mapping.sales, [
    'Ordered product sales',
    'Gross Sales',
  ]);
  const impressions = getNumericValueFromRow(row, mapping.impressions, [
    'Impressions',
  ]);
  const clicks = getNumericValueFromRow(row, mapping.clicks, ['Clicks']);
  const orders = getNumericValueFromRow(row, mapping.orders, [
    'Total order items',
    'Units Ordered',
  ]);
  const sessions = getNumericValueFromRow(row, mapping.sessions, [
    'Sessions',
    'Page Views',
  ]);

  const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;
  const conversion_rate = parseFloat(conversionRate.toFixed(2));

  return {
    date: date,
    sales: sales,
    profit: 0, // Placeholder
    acos: 0, // Placeholder
    impressions: impressions,
    clicks: clicks,
    conversion_rate: isNaN(conversion_rate) ? 0 : conversion_rate,
    inventory_level: 0, // Placeholder
    review_rating: 0, // Placeholder
    orders: orders,
    sessions: sessions,
  };
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
  // --- End NEW State ---

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowMapper(false); // Ensure mapper is hidden on refresh
    setCsvHeaders([]);
    setSelectedFile(null);
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

    // Pre-parse to get headers
    Papa.parse(file, {
      header: true,
      preview: 1, // Only parse the first row after the header
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields;
        if (!headers || headers.length === 0) {
          setError('Could not read headers from the CSV file. Is it valid?');
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        console.log('Detected CSV Headers:', headers);
        setCsvHeaders(headers);
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
  const handleMappingComplete = (
    mapping: Record<keyof DashboardMetrics, string | null>,
  ) => {
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
        } catch (transformError: any) {
          console.error('Error transforming data:', transformError);
          setError(`Error processing report data: ${transformError.message}`);
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
    setError(null); // Clear any errors from pre-parsing
    setIsParsing(false);
    // Reset file input if user cancels mapping
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Mapping cancelled.');
  };

  const handleUploadClick = () => {
    // Reset state before triggering upload to ensure clean slate
    setMetrics([]);
    setError(null);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
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
    } catch (err) {
      setError(
        `Failed to export data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }, [metrics]);

  // --- Refactored Rendering Logic for Overview Tab ---
  const renderOverviewContent = () => {
    if (isParsing) {
      // --- Processing State ---
      return (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">
              {showMapper ? 'Loading Mapper...' : 'Processing data...'}
            </p>
          </CardContent>
        </Card>
      );
    }

    if (showMapper && csvHeaders.length > 0) {
      // --- Show Mapper ---
      return (
        <CsvDataMapper<DashboardMetrics> // Specify the generic type
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
          title="Map Business Report Columns"
          description="Match the columns from your uploaded Business Report CSV to the required dashboard fields. Required fields are needed for calculations."
        />
      );
    }

    if (error && !isLoading) {
      // --- Error State ---
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="p-0 h-auto ml-2 text-destructive"
              onClick={handleUploadClick} // Use the modified upload click handler
            >
              Try uploading again?
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (metrics.length > 0) {
      // --- Real Data Display ---
      return (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  Avg. Conversion Rate
                </h3>
                <div className="text-3xl font-bold text-blue-600">
                  {(metrics.length > 0
                    ? metrics.reduce((sum, m) => sum + m.conversion_rate, 0) /
                      metrics.length
                    : 0
                  ).toFixed(2) ?? 'N/A'}
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
                  {metrics
                    .reduce((sum, m) => sum + m.sales, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) ?? 'N/A'}
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
                  {(metrics.length > 0
                    ? metrics.reduce((sum, m) => sum + m.clicks, 0) /
                      metrics.length
                    : 0
                  ).toFixed(1) ?? 'N/A'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Average from Report
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Sales Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      name="Sales"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Clicks & Impressions
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="impressions"
                      fill="#8884d8"
                      name="Impressions"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="clicks"
                      fill="#82ca9d"
                      name="Clicks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      );
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
        </div>

        {/* Placeholder Cards & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <PlaceholderCard
            title="Avg. Conversion Rate"
            value={SAMPLE_CARD_DATA.conversion_rate}
            unit="%"
            description="Sample Data"
            colorClass="text-blue-400"
          />
          <PlaceholderCard
            title="Total Sales"
            value={SAMPLE_CARD_DATA.total_sales.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
            })}
            description="Sample Data"
            colorClass="text-green-400"
          />
          <PlaceholderCard
            title="Avg. Clicks"
            value={SAMPLE_CARD_DATA.avg_clicks}
            description="Sample Data"
            colorClass="text-yellow-400"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlaceholderChartContainer title="Sales Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={SAMPLE_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#a3a0d8" // Muted color
                  name="Sales"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </PlaceholderChartContainer>
          <PlaceholderChartContainer title="Clicks & Impressions">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SAMPLE_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#a0a0a0" />
                <YAxis yAxisId="left" orientation="left" stroke="#a0a0a0" />
                <YAxis yAxisId="right" orientation="right" stroke="#a0a0a0" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="impressions"
                  fill="#a3a0d8" // Muted color
                  name="Impressions"
                />
                <Bar
                  yAxisId="right"
                  dataKey="clicks"
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
  return (
    <div className="container mx-auto p-4 space-y-4">
      <UnifiedDashboardHeader
        isLoading={isLoading || isParsing} // Show loading for general refresh or parsing/processing
        error={error && !showMapper ? error : null} // Don't show processing errors while mapping
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

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

// Removed duplicated code blocks from line 921 onwards
