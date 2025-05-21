// c:\Users\johnw\portfolio\src\app\amazon-seller-tools\page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
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

// Import newly extracted components
import { OverviewLoadingIndicator } from '@/components/amazon-seller-tools/overview/OverviewLoadingIndicator';
import { OverviewErrorDisplay } from '@/components/amazon-seller-tools/overview/OverviewErrorDisplay';
import { OverviewDataMapper } from '@/components/amazon-seller-tools/overview/OverviewDataMapper';
import {
  ComparisonKpiCard,
  ComparisonKpiCardProps,
} from '@/components/amazon-seller-tools/overview/ComparisonKpiCard';
import { PlaceholderCard } from '@/components/amazon-seller-tools/overview/PlaceholderCard';
import { PlaceholderChartContainer } from '@/components/amazon-seller-tools/overview/PlaceholderChartContainer';
// Import newly extracted chart components and OverviewDataView
import { SalesTrendsChart } from '@/components/amazon-seller-tools/charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '@/components/amazon-seller-tools/charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '@/components/amazon-seller-tools/charts/OrdersSessionsChart';
import { AdSpendSalesChart } from '@/components/amazon-seller-tools/charts/AdSpendSalesChart';
import { ProfitTrendChart } from '@/components/amazon-seller-tools/charts/ProfitTrendChart';
import { OverviewDataView } from '@/components/amazon-seller-tools/overview/OverviewDataView';
import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation'; // Import aggregation utility
// Import chart formatters (if not already imported by the chart components themselves)
import {
  getDateFromRow,
  getStringValueFromRow,
  getNumericValueFromRow,
  transformCsvRow, // Import data transformation utilities
} from '@/lib/utils/amazon/data-transformation';
import {
  TARGET_METRICS_CONFIG_RAW,
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
  // GROUP_FINANCIALS is also in config, can be used from there or kept here if used differently
} from '@/config/amazon-tools-config';
// import { formatTick, formatTooltipLabel } from '@/lib/utils/amazon/chart-formatters';

// --- Interface ---
// Define DashboardMetrics interface ONCE
export interface DashboardMetrics {
  date: string; // YYYY-MM-DD
  unique_identifier?: string; // ASIN, SKU, etc.
  total_sales?: number;
  total_orders?: number;
  total_sessions?: number;
  total_page_views?: number;
  total_conversion_rate?: number;
  ad_impressions?: number;
  ad_clicks?: number;
  ad_spend?: number;
  ad_sales?: number;
  ad_orders?: number;
  acos?: number;
  roas?: number;
  cpc?: number;
  ctr?: number;
  ad_conversion_rate?: number;
  profit?: number;
  inventory_level?: number;
  review_rating?: number;
  cac?: number;
  ltv?: number;
  [key: string]: unknown;
}

// Constants for repeated strings
const GROUP_FINANCIALS = 'Financials'; // This is also in config, decide if you want to import or keep local
const DESC_SAMPLE_DATA = 'Sample Data';

import type { CsvColumnMapping } from '@/types/data-mapping';

// --- Target Metrics for Mapper ---
export interface TargetMetricConfig {
  key: keyof DashboardMetrics;
  label: string;
  required: boolean;
  expectedType: 'string' | 'number' | 'date' | 'boolean';
  hint?: string;
  group?: string;
}

const TARGET_METRICS_CONFIG = TARGET_METRICS_CONFIG_RAW;

// --- Helper Functions for Data Processing ---
export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstCsvDataRow, setFirstCsvDataRow] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [timeGranularity, setTimeGranularity] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('daily');
  const [overviewDataMapperKey, setOverviewDataMapperKey] = useState(0);

  const SALES_LABEL = 'Sales';
  const PLACEHOLDER_AXIS_STROKE_COLOR = '#a0a0a0';

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setMetrics([]);
    setOverviewDataMapperKey((prev) => prev + 1);
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);

    Papa.parse(file, {
      header: true,
      preview: 2,
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
        setSelectedFile(file);
        setShowMapper(true);
        setIsParsing(false);
      },
      error: (error: Error) => {
        console.error('Error pre-parsing CSV:', error);
        setError(`Failed to read file headers: ${error.message}`);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const handleMappingComplete = (mapping: CsvColumnMapping) => {
    console.log('Mapping confirmed:', mapping);
    if (!selectedFile) {
      setError('No file selected for processing.');
      setShowMapper(false);
      return;
    }

    setShowMapper(false);
    setIsParsing(true);
    setError(null);
    setMetrics([]);

    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Parsed Full CSV Data:', results.data);
        try {
          const transformedMetrics = results.data
            .map((row) => transformCsvRow(row, mapping))
            .filter((metric): metric is DashboardMetrics => metric !== null);
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
            setError(null);
          }
        } catch (transformError: unknown) {
          console.error('Error transforming data:', transformError);
          setError(
            `Error processing report data: ${(transformError as Error).message}`,
          );
          setMetrics([]);
        } finally {
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setSelectedFile(null);
        }
      },
      error: (error: Error) => {
        console.error('Error parsing full CSV:', error);
        setError(`Failed to parse file: ${error.message}`);
        setMetrics([]);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null);
      },
    });
  };

  const handleMappingCancel = () => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Mapping cancelled.');
  };

  const handleDownloadSampleCsv = async () => {
    const fileName = 'sample_amazon_data.csv';
    const filePath = `/samples/${fileName}`;
    console.log('Attempting to download file from:', filePath); // Log the file path

    try {
      const link = document.createElement('a');
      link.href = filePath;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download initiated successfully.'); // Log success
    } catch (error: unknown) {
      console.error('Error downloading sample CSV:', error); // Log the error
      setError(
        `Download failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  

  const handleUploadClick = () => {
    setMetrics([]);
    setError(null);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const onDeleteMetric = useCallback(
    (metricDate: string, metricIdentifier?: string) => {
      setMetrics((prevMetrics) =>
        prevMetrics.filter(
          (metric) =>
            metric.date !== metricDate ||
            (metricIdentifier && metric.unique_identifier !== metricIdentifier),
        ),
      );
    },
    [],
  );

  const renderOverviewContent = () => {
    if (isParsing)
      return <OverviewLoadingIndicator showMapperText={showMapper} />;
    if (showMapper && csvHeaders.length > 0) {
      return (
        <OverviewDataMapper
          key={overviewDataMapperKey}
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onApplyMapping={handleMappingComplete}
          sampleDataRow={firstCsvDataRow}
          onCancel={handleMappingCancel}
        />
      );
    }
    if (error && !isLoading)
      return (
        <OverviewErrorDisplay error={error} onRetryUpload={handleUploadClick} />
      );
    if (metrics.length > 0) {
      return (
        <OverviewDataView
          metrics={metrics}
          targetMetricsConfig={TARGET_METRICS_CONFIG}
          timeGranularity={timeGranularity}
          setTimeGranularity={setTimeGranularity}
          onDeleteMetric={onDeleteMetric}
        />
      );
    }
    return (
      <div className="space-y-4">
        <div className="mb-4 p-4 border rounded-md bg-muted/40">
          <h4 className="text-lg font-medium mb-2">Load Overview Data</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Upload an Amazon Reports CSV to visualize your key metrics.
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
          <Button onClick={handleUploadClick} disabled={isParsing || isLoading}>
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
              { style: 'currency', currency: 'USD' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <PlaceholderChartContainer title="Sales Trends">
            <SalesTrendsChart
              sortedMetrics={SAMPLE_CHART_DATA}
              granularity="daily"
            />
          </PlaceholderChartContainer>
          <PlaceholderChartContainer title="Clicks & Impressions">
            <ClicksImpressionsChart
              sortedMetrics={SAMPLE_CHART_DATA}
              granularity="daily"
            />
          </PlaceholderChartContainer>
          <PlaceholderChartContainer title="Orders & Sessions">
            <OrdersSessionsChart
              sortedMetrics={SAMPLE_CHART_DATA}
              granularity="daily"
            />
          </PlaceholderChartContainer>
          <PlaceholderChartContainer title="Ad Spend vs. Ad Sales">
            <AdSpendSalesChart
              sortedMetrics={SAMPLE_CHART_DATA}
              granularity="daily"
            />
          </PlaceholderChartContainer>
          {/* ProfitTrendChart can be added here if SAMPLE_CHART_DATA includes profit and it fits the layout */}
          {/* For a 2-column layout, 5 charts might be uneven, consider placement or if all are essential for placeholder */}
          <PlaceholderChartContainer title="Profit Trend">
            <ProfitTrendChart
              sortedMetrics={SAMPLE_CHART_DATA}
              granularity="daily"
            />
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

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold my-6 text-center">
        Amazon Seller Tools Dashboard
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Access a suite of tools designed to help Amazon sellers analyze data,
        optimize listings, and improve performance.
      </p>
      <div className="mb-12" aria-live="polite">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 min-h-[24px]">
            {(isLoading || isParsing) && (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {isParsing ? 'Processing file...' : 'Refreshing...'}
                </span>
              </div>
            )}
            {error && !(isLoading || isParsing) && !showMapper && (
              <span className="text-sm text-red-500" role="alert">
                {error}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-wrap justify-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              aria-label="Refresh Dashboard"
              disabled={isLoading || isParsing}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              aria-label="Export Data"
              disabled={metrics.length === 0 || isLoading || isParsing}
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" asChild aria-label="View Documentation">
              <a
                href="https://wescode.vercel.app/blog/amazon-seller-tools"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Docs
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
        <TabsContent value="overview" className="space-y-4 mt-4">
          {renderOverviewContent()}
        </TabsContent>
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
