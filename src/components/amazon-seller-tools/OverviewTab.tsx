'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  // SelectValue, // No longer directly used here, but OverviewDataView uses it
} from '@/components/ui/select';
import Papa from 'papaparse';
import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { Download } from 'lucide-react';

// Import newly extracted components
import { OverviewLoadingIndicator } from '@/components/amazon-seller-tools/overview/OverviewLoadingIndicator';
import { OverviewErrorDisplay } from '@/components/amazon-seller-tools/overview/OverviewErrorDisplay';
import { OverviewDataMapper } from '@/components/amazon-seller-tools/overview/OverviewDataMapper';
import { PlaceholderCard } from '@/components/amazon-seller-tools/overview/PlaceholderCard';
import { PlaceholderChartContainer } from '@/components/amazon-seller-tools/overview/PlaceholderChartContainer';
// Import newly extracted chart components and OverviewDataView
import { SalesTrendsChart } from '@/components/amazon-seller-tools/charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '@/components/amazon-seller-tools/charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '@/components/amazon-seller-tools/charts/OrdersSessionsChart';
import { AdSpendSalesChart } from '@/components/amazon-seller-tools/charts/AdSpendSalesChart';
import { ProfitTrendChart } from '@/components/amazon-seller-tools/charts/ProfitTrendChart';
import { OverviewDataView } from '@/components/amazon-seller-tools/overview/OverviewDataView';
import { OverviewDataTable } from '@/components/amazon-seller-tools/overview/OverviewDataTable'; // Import the new OverviewDataTable
import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation'; // Import aggregation utility
import { transformCsvRow } from '@/lib/utils/amazon/data-transformation'; // Import data transformation utilities
import {
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
} from '@/config/amazon-tools-config';

import type { CsvColumnMapping } from '@/types/data-mapping';
import {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page';

interface OverviewTabProps {
  metrics: DashboardMetrics[];
  setMetrics: React.Dispatch<React.SetStateAction<DashboardMetrics[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isParsing: boolean;
  setIsParsing: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  TARGET_METRICS_CONFIG: TargetMetricConfig[];
}

const DESC_SAMPLE_DATA = 'Sample Data';

const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  setMetrics,
  isLoading,
  setIsLoading,
  isParsing,
  setIsParsing,
  error,
  setError,
  TARGET_METRICS_CONFIG,
}) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = useCallback(async () => {
    // Resetting metrics and related states
    setMetrics([]); // Clear existing metrics
    setShowMapper(false); // Hide mapper
    setCsvHeaders([]); // Clear CSV headers
    setSelectedFile(null); // Clear selected file
    setFirstCsvDataRow(undefined); // Clear first data row
    setError(null); // Clear any errors
    // Reset timeGranularity to default if needed, or keep current
    // setTimeGranularity('daily');
    setOverviewDataMapperKey((prev) => prev + 1); // Force re-render of mapper if it was open

    setIsLoading(true);
    setError(null);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setMetrics([]);
    // setOverviewDataMapperKey((prev) => prev + 1); // Already called above
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  }, [
    setIsLoading,
    setError,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setMetrics,
    setOverviewDataMapperKey,
  ]); // Added setMetrics to dependency array

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
    [setMetrics],
  );

  // Calculate aggregatedAndSortedMetrics in OverviewTab
  const dailySortedMetrics = React.useMemo(
    () =>
      [...metrics].sort(
        (a, b) =>
          new Date(a.date as string).getTime() -
          new Date(b.date as string).getTime(),
      ),
    [metrics],
  );

  const aggregatedAndSortedMetrics = React.useMemo(
    () => aggregateMetricsByTime(dailySortedMetrics, timeGranularity),
    [dailySortedMetrics, timeGranularity],
  );

  // Define a focused configuration for the OverviewDataTable based on likely aggregated fields
  // Adjust this list based on what your `aggregateMetricsByTime` function actually produces
  const aggregatedTableMetricsConfig: TargetMetricConfig[] = useMemo(() => {
    const aggregatedKeys: (keyof DashboardMetrics)[] = [
      'date',
      'total_sales',
      'total_orders',
      'total_sessions',
      'ad_spend',
      'ad_sales',
      'acos',
      'roas',
      'profit',
      'ad_impressions',
      'ad_clicks',
      'total_conversion_rate', // Add other keys present in aggregated data
    ];
    return TARGET_METRICS_CONFIG.filter((config) =>
      aggregatedKeys.includes(config.key),
    );
  }, [TARGET_METRICS_CONFIG]);

  // For debugging the new config
  useEffect(() => {
    console.log(
      'OverviewTab - aggregatedTableMetricsConfig:',
      JSON.stringify(aggregatedTableMetricsConfig, null, 2),
    );
  }, [aggregatedTableMetricsConfig]);

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 border rounded-md bg-muted/40">
        <h4 className="text-lg font-medium mb-2">Load Overview Data</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Upload an Amazon Reports CSV to visualize your key metrics. You'll be
          asked to map the columns after uploading.
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
      {isParsing ? (
        <OverviewLoadingIndicator showMapperText={showMapper} />
      ) : showMapper && csvHeaders.length > 0 ? (
        <OverviewDataMapper
          key={overviewDataMapperKey}
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onApplyMapping={handleMappingComplete}
          sampleDataRow={firstCsvDataRow}
          onCancel={handleMappingCancel}
        />
      ) : error && !isLoading && metrics.length === 0 ? (
        <OverviewErrorDisplay error={error} onRetryUpload={handleUploadClick} />
      ) : metrics.length > 0 ? (
        <>
          <OverviewDataView
            metrics={metrics}
            aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
            targetMetricsConfig={TARGET_METRICS_CONFIG}
            timeGranularity={timeGranularity}
            setTimeGranularity={setTimeGranularity}
            onDeleteMetric={onDeleteMetric}
          />
          {/* Console logs to inspect props */}
          {console.log(
            'OverviewTab - metrics:',
            JSON.stringify(metrics, null, 2),
          )}
          {console.log(
            'OverviewTab - targetMetricsConfig:',
            JSON.stringify(TARGET_METRICS_CONFIG, null, 2),
          )}
          {/* Replace KeywordPerformanceTable with OverviewDataTable */}
          <OverviewDataTable
            metrics={aggregatedAndSortedMetrics}
            targetMetricsConfig={aggregatedTableMetricsConfig}
            isLoading={isLoading || isParsing} // Pass loading state
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <PlaceholderCard
              title="Avg. Conversion Rate"
              value={SAMPLE_CARD_DATA.total_conversion_rate.toFixed(2)}
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
              value={SAMPLE_CARD_DATA.avg_clicks.toFixed(1)}
              description={DESC_SAMPLE_DATA}
              colorClass="text-yellow-400"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <PlaceholderChartContainer title="Sales Trends">
              <SalesTrendsChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Clicks & Impressions">
              <ClicksImpressionsChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Orders & Sessions">
              <OrdersSessionsChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Ad Spend vs. Ad Sales">
              <AdSpendSalesChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
            {/* ProfitTrendChart can be added here if SAMPLE_CHART_DATA includes profit and it fits the layout */}
            {/* For a 2-column layout, 5 charts might be uneven, consider placement or if all are essential for placeholder */}
            <PlaceholderChartContainer title="Profit Trend">
              <ProfitTrendChart
                sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                granularity="daily"
              />
            </PlaceholderChartContainer>
          </div>
        </>
      )}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium text-primary dark:text-blue-300">
            While you're here, feel free to explore the other specialized tools
            available in the tabs above!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
