'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import Papa from 'papaparse';
import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  lazy,
  Suspense, // Import Suspense
} from 'react';
import { Download } from 'lucide-react';

// Import newly extracted components
import { OverviewLoadingIndicator } from '@/components/amazon-seller-tools/overview/OverviewLoadingIndicator';
import { OverviewErrorDisplay } from '@/components/amazon-seller-tools/overview/OverviewErrorDisplay';
import { OverviewDataMapper } from '@/components/amazon-seller-tools/overview/OverviewDataMapper';
import { PlaceholderCard } from '@/components/amazon-seller-tools/overview/PlaceholderCard';
import { PlaceholderChartContainer } from '@/components/amazon-seller-tools/overview/PlaceholderChartContainer';
import { OverviewDataView } from '@/components/amazon-seller-tools/overview/OverviewDataView'; // Moved to top with other imports

// Import newly extracted chart components and OverviewDataView
// Convert chart imports to lazy imports with named export handling
const SalesTrendsChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/SalesTrendsChart').then(
    (module) => ({ default: module.SalesTrendsChart }),
  ),
);
const ClicksImpressionsChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/ClicksImpressionsChart').then(
    (module) => ({ default: module.ClicksImpressionsChart }),
  ),
);
const OrdersSessionsChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/OrdersSessionsChart').then(
    (module) => ({ default: module.OrdersSessionsChart }),
  ),
);
const AdSpendSalesChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/AdSpendSalesChart').then(
    (module) => ({ default: module.AdSpendSalesChart }),
  ),
);
const ProfitTrendChart = lazy(() =>
  import('@/components/amazon-seller-tools/charts/ProfitTrendChart').then(
    (module) => ({ default: module.ProfitTrendChart }),
  ),
);
const KeywordVsAdSalesDonutChart = lazy(
  () =>
    import(
      '@/components/amazon-seller-tools/charts/KeywordVsAdSalesDonutChart'
    ),
);
const TableChart = lazy(
  () => import('@/components/amazon-seller-tools/charts/TableChart'),
) as React.LazyExoticComponent<
  React.FC<TableChartProps<AggregatedProductMetrics>>
>; // Lazy load TableChart with explicit type

import {
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
} from '@/config/amazon-tools-config';
import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation'; // Import aggregation utility
import {
  transformCsvRow,
  TransformationError, // Import TransformationError
  CsvRowTransformationResult, // Import CsvRowTransformationResult
} from '@/lib/utils/amazon/data-transformation'; // Import data transformation utilities
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import KeywordPerformanceOverviewTable from './KeywordPerformanceOverviewTable';
import { useToast } from '@/hooks/use-toast.ts'; // Import useToast hook

import type { CsvColumnMapping } from '@/types/data-mapping';
import type { TableChartProps } from '@/components/amazon-seller-tools/charts/TableChart'; // Import TableChartProps
import {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page';
import { getItem, setItem } from '@/lib/indexeddb-service'; // Import IndexedDB service
import DataCard from './DataCard';

// Define a new interface for aggregated product metrics
interface AggregatedProductMetrics {
  unique_identifier: string;
  total_sales: number;
  ad_sales: number;
  acos: number;
  profit: number;
  inventory_level: number;
  count: number;
  total_ad_spend: number;
  total_ad_sales: number;
}

interface OverviewTabProps {
  metrics: DashboardMetrics[];
  setMetrics: React.Dispatch<React.SetStateAction<DashboardMetrics[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isParsing: boolean;
  setIsParsing: React.Dispatch<React.SetStateAction<boolean>>;
  isUploading: boolean; // Prop indicating if parent considers it uploading
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>; // Setter from parent
  isMapping: boolean; // Prop indicating if parent considers it mapping
  setIsMapping: React.Dispatch<React.SetStateAction<boolean>>; // Setter from parent
  isProcessing: boolean; // Prop indicating if parent considers it processing
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>; // Setter from parent
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  TARGET_METRICS_CONFIG: TargetMetricConfig[];
  searchTerm: string; // Add searchTerm prop
}

const DESC_SAMPLE_DATA = 'Sample Data';
const SHOW_KEYWORD_TABLE_DEFAULT = false;

const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  setMetrics,
  isLoading,
  setIsLoading,
  isParsing,
  setIsParsing,
  isUploading,
  setIsUploading,
  isMapping,
  setIsMapping,
  isProcessing,
  setIsProcessing,
  error,
  setError,
  TARGET_METRICS_CONFIG,
  searchTerm,
}) => {
  const [showMapper, setShowMapper] = useState(false);
  const [showKeywordPerformanceTable, setShowKeywordPerformanceTable] =
    useState(SHOW_KEYWORD_TABLE_DEFAULT);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstCsvDataRow, setFirstCsvDataRow] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [timeGranularity, setTimeGranularity] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('daily');
  const [overviewDataMapperKey, setOverviewDataMapperKey] = useState(0);
  const [savedMapping, setSavedMapping] = useState<CsvColumnMapping | null>(
    null,
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [parsingErrors, setParsingErrors] = useState<TransformationError[]>([]); // New state for parsing errors
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalRowsRef = useRef(0); // Ref to store total rows from CSV
  const processedRowsRef = useRef(0); // Ref to store count of rows processed
  const { toast } = useToast(); // Initialize useToast hook

  useEffect(() => {
    const loadSavedMapping = async () => {
      const storedMapping = await getItem<CsvColumnMapping>('last_csv_mapping');
      if (storedMapping) {
        setSavedMapping(storedMapping);
        console.log('Loaded saved mapping:', storedMapping);
      }
    };
    loadSavedMapping();
  }, []);

  useEffect(() => {
    // Also load selectedMetrics from IndexedDB on component mount
    const loadSelectedMetrics = async () => {
      const storedSelectedMetrics = await getItem<string[]>('selectedMetrics');
      if (storedSelectedMetrics) {
        setSelectedMetrics(storedSelectedMetrics);
      }
    };
    loadSelectedMetrics();
  }, []);

  const handleRefresh = useCallback(async () => {
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]); // Clear parsing errors on refresh
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsLoading(true);
    totalRowsRef.current = 0; // Reset row counts
    processedRowsRef.current = 0; // Reset row counts
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    // Clear saved mapping on refresh
    await setItem('last_csv_mapping', null);
    setSavedMapping(null); // Also clear from state
  }, [
    setIsLoading,
    setError,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setMetrics,
    setOverviewDataMapperKey,
  ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please choose a CSV file to upload.',
        variant: 'warning',
      });
      return;
    }

    setIsUploading(true); // Start uploading indicator
    setIsParsing(true); // Start parsing indicator
    setIsLoading(true); // Set isLoading to true when starting file processing
    setError(null);
    setParsingErrors([]); // Clear previous errors
    setMetrics([]);
    setShowMapper(false); // Hide mapper initially
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setIsMapping(false); // Ensure mapping is false
    setIsProcessing(false); // Ensure processing is false
    totalRowsRef.current = 0; // Reset on new file selection
    processedRowsRef.current = 0; // Reset on new file selection

    toast({
      title: 'CSV Upload Started',
      description: 'Uploading and parsing your CSV file...',
      variant: 'info',
      duration: 3000,
    });

    Papa.parse<Record<string, string>>(file, {
      header: true,
      preview: 2,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const headers = results.meta.fields;
        const sampleRow = results.data[0] as Record<string, string> | undefined;
        if (!headers || headers.length === 0) {
          setError('Could not read headers from the CSV file. Is it valid?');
          toast({
            title: 'Upload Failed',
            description:
              'Could not read headers from the CSV file. Is it valid?',
            variant: 'destructive',
          });
          setIsParsing(false);
          setIsUploading(false);
          setIsLoading(false); // Set isLoading to false on error
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        setCsvHeaders(headers);
        setFirstCsvDataRow(sampleRow);
        setSelectedFile(file);
        setShowMapper(true); // Show mapper after parsing headers
        setIsParsing(false); // Parsing headers is complete
        setIsUploading(false); // Uploading is complete
        setIsLoading(false); // Set isLoading to false after successful header parsing
        setIsMapping(true); // Now user is in mapping stage
        toast({
          title: 'CSV Uploaded Successfully',
          description: 'Now mapping your data columns.',
          variant: 'success',
          duration: 3000,
        });
      },
      error: (error: Error, file: File) => {
        // Corrected type signature
        setError(`Failed to read file headers: ${error.message}`);
        toast({
          title: 'Upload Error',
          description: `Failed to read file headers: ${error.message}`,
          variant: 'destructive',
        });
        setIsParsing(false);
        setIsUploading(false);
        setIsLoading(false); // Set isLoading to false on error
        setIsMapping(false); // Ensure mapping is false on error
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const processCsvData = async (
    file: File,
    mapping: CsvColumnMapping,
  ): Promise<{
    validMetrics: DashboardMetrics[];
    collectedErrors: TransformationError[];
    totalRows: number;
  }> => {
    const allRows: Record<string, string>[] = [];
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        step: (rowParseResult, parser) => {
          if (rowParseResult.data) {
            allRows.push(rowParseResult.data);
          }
          processedRowsRef.current = allRows.length; // Live update during step
        },
        complete: () => {
          totalRowsRef.current = allRows.length; // Final total rows count
          const validMetrics: DashboardMetrics[] = [];
          const collectedErrors: TransformationError[] = [];

          allRows.forEach((row, i) => {
            const result: CsvRowTransformationResult = transformCsvRow(
              row,
              mapping,
              i, // row number
              TARGET_METRICS_CONFIG,
            );
            if (result.data) {
              validMetrics.push(result.data);
            }
            collectedErrors.push(...result.errors);
          });
          resolve({ validMetrics, collectedErrors, totalRows: allRows.length });
        },
        error: (error: Error, file: File) => reject(error), // Corrected type signature
      });
    });
  };

  // Add these helper functions before handleMappingComplete
  const generateProcessingStatus = (
    validMetrics: DashboardMetrics[],
    totalRows: number,
    collectedErrors: TransformationError[],
  ): {
    message: string;
    variant: 'success' | 'warning' | 'destructive' | 'info';
    title: string;
  } => {
    let statusMessage = '';
    let toastVariant: 'success' | 'warning' | 'destructive' | 'info' = 'info';
    let toastTitle = 'Data Processing Complete';

    if (validMetrics.length > 0) {
      statusMessage = `Successfully processed ${validMetrics.length} of ${totalRows} rows.`;
      toastVariant = 'success';
    } else {
      statusMessage = `No valid data extracted from ${totalRows} rows.`;
      toastVariant = 'warning';
    }

    const skippedRows = totalRows - validMetrics.length;
    if (skippedRows > 0) {
      statusMessage += ` ${skippedRows} row(s) were skipped due to critical errors.`;
      toastVariant = 'warning';
    }

    const errorCount = collectedErrors.filter((e) => e.type === 'error').length;
    const warningCount = collectedErrors.filter(
      (e) => e.type === 'warning',
    ).length;

    if (errorCount > 0) {
      statusMessage += ` Found ${errorCount} transformation error(s).`;
      toastVariant = 'destructive';
      toastTitle = 'Data Processing with Errors';
    }
    if (warningCount > 0) {
      statusMessage += ` Found ${warningCount} warning(s).`;
      if (toastVariant !== 'destructive') {
        toastVariant = 'warning';
        toastTitle = 'Data Processing with Warnings';
      }
    }

    return { message: statusMessage, variant: toastVariant, title: toastTitle };
  };

  const handleMappingComplete = async (mapping: CsvColumnMapping) => {
    if (!selectedFile) {
      setError('No file selected for processing.');
      setShowMapper(false);
      setIsMapping(false);
      return;
    }

    setShowMapper(false);
    setIsMapping(false);
    setIsProcessing(true);
    setError(null);
    setParsingErrors([]);
    setMetrics([]);
    totalRowsRef.current = 0;
    processedRowsRef.current = 0;

    try {
      const { validMetrics, collectedErrors, totalRows } = await processCsvData(
        selectedFile,
        mapping,
      );

      setMetrics(validMetrics);
      setParsingErrors(collectedErrors);
      totalRowsRef.current = totalRows;

      const { message, variant, title } = generateProcessingStatus(
        validMetrics,
        totalRows,
        collectedErrors,
      );

      setError(message || null);
      toast({
        title,
        description: message,
        variant,
        duration: 5000,
      });

      await setItem('last_csv_mapping', mapping);
      console.log('Valid Metrics:', validMetrics);
      console.log('Collected Errors/Warnings:', collectedErrors);
      console.log('Mapping saved to IndexedDB.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to parse file: ${errorMessage}`);
      setParsingErrors([
        {
          rowNumber: -1,
          column: 'File',
          message: `General CSV parsing error: ${errorMessage}`,
          type: 'error',
        },
      ]);
      toast({
        title: 'Processing Error',
        description: `Failed to process CSV data: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      totalRowsRef.current = 0;
      processedRowsRef.current = 0;
    }
  };

  const handleMappingCancel = () => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]); // Clear errors on cancel
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsParsing(false);
    setIsLoading(false); // Set isLoading to false on cancel
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Mapping cancelled.');
  };

  const handleDownloadSampleCsv = async () => {
    const fileName = 'sample_amazon_data.csv';
    const filePath = `/samples/${fileName}`;
    console.log('Attempting to download file from:', filePath);

    try {
      const link = document.createElement('a');
      link.href = filePath;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download initiated successfully.');
    } catch (err: unknown) {
      console.error('Error downloading sample CSV:', err);
      setError(
        `Download failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleUploadClick = () => {
    setMetrics([]);
    setError(null);
    setParsingErrors([]); // Clear errors on new upload
    setShowKeywordPerformanceTable(SHOW_KEYWORD_TABLE_DEFAULT); // Hide table on new upload
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    totalRowsRef.current = 0; // Reset on new upload
    processedRowsRef.current = 0; // Reset on new upload
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

  const dailySortedMetrics = useMemo(
    () =>
      [...metrics].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Handle invalid dates gracefully
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          // You might want a more sophisticated error handling or default behavior here
          // For now, treat invalid dates as equal for sorting purposes or push them to the end
          return 0; // Or return 1 or -1 to push them to end/beginning
        }

        return dateA.getTime() - dateB.getTime();
      }),
    [metrics],
  );

  const aggregatedAndSortedMetrics = useMemo(
    () => aggregateMetricsByTime(dailySortedMetrics, timeGranularity),
    [dailySortedMetrics, timeGranularity],
  );

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
      'total_conversion_rate',
    ];
    return TARGET_METRICS_CONFIG.filter((config) =>
      aggregatedKeys.includes(config.key),
    );
  }, [TARGET_METRICS_CONFIG]);

  useEffect(() => {
    console.log(
      'OverviewTab - aggregatedTableMetricsConfig:',
      JSON.stringify(aggregatedTableMetricsConfig, null, 2),
    );
  }, [aggregatedTableMetricsConfig]);

  // Helper function to filter metrics based on search term
  const filterMetricsBySearchTerm = useCallback(
    (allMetrics: DashboardMetrics[], term: string) => {
      const searchTermLower = term.toLowerCase();
      if (!searchTermLower) {
        return allMetrics;
      }
      return allMetrics.filter((metric) => {
        const fieldsToSearch = [
          metric.asin,
          metric.unique_identifier,
          metric.targeted_keyword,
          metric.keyword,
        ];
        return fieldsToSearch.some((fieldValue) =>
          (fieldValue || '').toLowerCase().includes(searchTermLower),
        );
      });
    },
    [],
  );

  // Helper function to initialize an aggregated product metric
  const initializeAggregatedMetric = (
    id: string,
  ): AggregatedProductMetrics => ({
    unique_identifier: id,
    total_sales: 0,
    ad_sales: 0,
    acos: 0,
    profit: 0,
    inventory_level: 0,
    count: 0,
    total_ad_spend: 0,
    total_ad_sales: 0,
  });

  // Helper function to calculate final product metrics (e.g., ACoS, average inventory)
  const calculateFinalProductMetrics = (
    item: AggregatedProductMetrics,
  ): AggregatedProductMetrics => ({
    ...item,
    acos:
      item.total_ad_sales > 0
        ? (item.total_ad_spend / item.total_ad_sales) * 100
        : 0,
    inventory_level: item.count > 0 ? item.inventory_level / item.count : 0,
  });

  // Helper function to aggregate product metrics
  const aggregateProductMetrics = useCallback(
    (filteredMetrics: DashboardMetrics[]) => {
      const aggregatedData: { [key: string]: AggregatedProductMetrics } = {};

      filteredMetrics.forEach((metric) => {
        const id = metric.unique_identifier;
        if (!id) return;

        if (!aggregatedData[id]) {
          aggregatedData[id] = initializeAggregatedMetric(id);
        }

        const currentAgg = aggregatedData[id];
        currentAgg.total_sales += metric.total_sales || 0;
        currentAgg.ad_sales += metric.ad_sales || 0;
        currentAgg.total_ad_spend += metric.ad_spend || 0;
        currentAgg.total_ad_sales += metric.ad_sales || 0;
        currentAgg.profit += metric.profit || 0;
        currentAgg.inventory_level += metric.inventory_level || 0;
        currentAgg.count++;
      });

      return Object.values(aggregatedData).map(calculateFinalProductMetrics);
    },
    [],
  );

  // Memoized product performance data using the new helper functions
  const productPerformanceData = useMemo(() => {
    if (metrics.length === 0) {
      return []; // Return empty array if no metrics
    }
    const filtered = filterMetricsBySearchTerm(metrics, searchTerm);
    return aggregateProductMetrics(filtered);
  }, [metrics, searchTerm, filterMetricsBySearchTerm, aggregateProductMetrics]);

  // Memoize rowIdAccessor for Product Performance TableChart
  const productPerformanceRowIdAccessor = useCallback(
    (row: AggregatedProductMetrics) => row.unique_identifier,
    [],
  );

  // Memoize columns for Product Performance TableChart
  const productPerformanceTableColumns = useMemo(
    () => [
      { accessorKey: 'unique_identifier', header: 'ASIN/SKU' },
      { accessorKey: 'total_sales', header: 'Total Sales' },
      { accessorKey: 'ad_sales', header: 'Ad Sales' },
      { accessorKey: 'acos', header: 'ACoS' },
      { accessorKey: 'profit', header: 'Profit' },
      { accessorKey: 'inventory_level', header: 'Inventory Level' },
    ],
    [],
  );

  const handleAddEvent = () => {
    // Implement save logic here
    console.log('Event saved!');
    // You would typically send this data to a parent component or a global state management system
    // For now, just close the modal
    // setOpen(false); // This would be called from the modal's internal state
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 border rounded-md bg-muted/40">
        <h3 className="text-lg font-semibold mb-2">Load Overview Data</h3>{' '}
        {/* Changed h4 to h3 */}
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
          onClick={() =>
            setShowKeywordPerformanceTable(!showKeywordPerformanceTable)
          }
          className="ml-2"
        >
          {showKeywordPerformanceTable ? 'Hide' : 'Show'} Keyword Table
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadSampleCsv}
          className="ml-2"
        >
          <Download className="mr-2 h-4 w-4" /> Download Sample CSV
        </Button>
      </div>
      {isUploading || isParsing || isProcessing ? (
        <OverviewLoadingIndicator
          isUploading={isUploading}
          isParsing={isParsing}
          isProcessing={isProcessing}
          showMapperText={showMapper}
          totalRows={totalRowsRef.current}
          processedRows={processedRowsRef.current}
          parsingErrorCount={parsingErrors.length}
        />
      ) : showMapper && csvHeaders.length > 0 ? (
        <OverviewDataMapper
          key={overviewDataMapperKey}
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onApplyMapping={handleMappingComplete}
          sampleDataRow={firstCsvDataRow}
          onCancel={handleMappingCancel}
          initialMapping={savedMapping || undefined}
        />
      ) : (error || parsingErrors.length > 0) &&
        !isLoading &&
        metrics.length === 0 ? (
        <OverviewErrorDisplay
          error={error}
          onRetryUpload={handleUploadClick}
          parsingErrors={parsingErrors} // Pass detailed parsing errors
        />
      ) : metrics.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {selectedMetrics.map((metric) => {
              const metricConfig = TARGET_METRICS_CONFIG.find(
                (config) => config.key === metric,
              );

              if (!metricConfig) {
                return null;
              }

              const metricValue =
                metrics.length > 0
                  ? metrics[metrics.length - 1][metricConfig.key]
                  : null;

              return (
                <DataCard
                  key={metricConfig.key}
                  title={metricConfig.label}
                  value={
                    metricValue !== null && typeof metricValue === 'number'
                      ? metricConfig.expectedType === 'number'
                        ? metricValue.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'USD',
                          })
                        : String(metricValue) // Fallback for other number types
                      : 'N/A'
                  }
                  unit={
                    metricConfig.key === 'total_conversion_rate'
                      ? '%'
                      : undefined
                  } // Add unit for conversion rate
                  description="Based on latest data"
                  colorClass="text-blue-400" // Consider dynamic color based on metric type or value
                />
              );
            })}
          </div>
          <OverviewDataView
            metrics={metrics}
            aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
            targetMetricsConfig={TARGET_METRICS_CONFIG}
            timeGranularity={timeGranularity}
            setTimeGranularity={setTimeGranularity}
            onDeleteMetric={onDeleteMetric}
          />
        </>
      ) : (
        // Default to placeholders if no metrics
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <PlaceholderChartContainer title="Sales Trends">
              <Suspense fallback={<div>Loading chart...</div>}>
                <SalesTrendsChart
                  sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                  granularity="daily"
                />
              </Suspense>
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Clicks & Impressions">
              <Suspense fallback={<div>Loading chart...</div>}>
                <ClicksImpressionsChart
                  sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                  granularity="daily"
                />
              </Suspense>
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Orders & Sessions">
              <Suspense fallback={<div>Loading chart...</div>}>
                <OrdersSessionsChart
                  sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                  granularity="daily"
                />
              </Suspense>
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Ad Spend vs. Ad Sales">
              <Suspense fallback={<div>Loading chart...</div>}>
                <AdSpendSalesChart
                  sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                  granularity="daily"
                />
              </Suspense>
            </PlaceholderChartContainer>
            <PlaceholderChartContainer title="Profit Trend">
              <Suspense fallback={<div>Loading chart...</div>}>
                <ProfitTrendChart
                  sortedMetrics={SAMPLE_CHART_DATA as DashboardMetrics[]}
                  granularity="daily"
                />
              </Suspense>
            </PlaceholderChartContainer>
          </div>
          {/* Placeholder KPI Cards now above */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <DataCard
              title="Avg. Conversion Rate"
              value={SAMPLE_CARD_DATA.total_conversion_rate.toFixed(2)}
              unit="%"
              description={DESC_SAMPLE_DATA}
              colorClass="text-blue-400"
            />
            <DataCard
              title="Total Sales"
              value={SAMPLE_CARD_DATA.total_sales_sample.toLocaleString(
                undefined,
                { style: 'currency', currency: 'USD' },
              )}
              description={DESC_SAMPLE_DATA}
              colorClass="text-green-400"
            />
            <DataCard
              title="Avg. Clicks"
              value={SAMPLE_CARD_DATA.avg_clicks.toFixed(1)}
              description={DESC_SAMPLE_DATA}
              colorClass="text-yellow-400"
            />
          </div>
        </>
      )}

      {/* Remove AddEventModal and its related logic */}
      {/* Product Performance Overview Table (Always rendered, data conditional) */}
      <div className="mb-4 p-4 border rounded-md bg-muted/40">
        <h3 className="text-lg font-semibold mb-2">
          Product Performance Overview
        </h3>
        <Suspense
          fallback={<div className="p-4 text-center">Loading table...</div>}
        >
          <TableChart
            columns={productPerformanceTableColumns}
            data={productPerformanceData}
            rowIdAccessor={productPerformanceRowIdAccessor}
          />
        </Suspense>
      </div>

      {/* Keyword Performance Overview Table (Conditionally rendered) */}
      {showKeywordPerformanceTable && metrics.length > 0 && (
        <div className="mb-4 p-4 border rounded-md bg-muted/40">
          <h3 className="text-lg font-semibold mb-2">
            Keyword Performance Overview
          </h3>
          <KeywordPerformanceOverviewTable
            metrics={metrics}
            searchTerm={searchTerm}
          />
        </div>
      )}

      {/* Existing card below */}
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
