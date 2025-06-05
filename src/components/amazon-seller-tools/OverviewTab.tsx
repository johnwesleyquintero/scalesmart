'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Papa from 'papaparse';
import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  lazy,
  Suspense,
} from 'react';
import { Download } from 'lucide-react';
import useDebounce from '@/hooks/use-debounce.ts';

// Import newly extracted components
import { OverviewLoadingIndicator } from '@/components/amazon-seller-tools/overview/OverviewLoadingIndicator';
import { OverviewErrorDisplay } from '@/components/amazon-seller-tools/overview/OverviewErrorDisplay';
import { OverviewDataMapper } from '@/components/amazon-seller-tools/overview/OverviewDataMapper';
import { PlaceholderCard } from '@/components/amazon-seller-tools/overview/PlaceholderCard';
import { PlaceholderChartContainer } from '@/components/amazon-seller-tools/overview/PlaceholderChartContainer';
import { OverviewDataView } from '@/components/amazon-seller-tools/overview/OverviewDataView';
import OverviewDataLoader from '@/components/amazon-seller-tools/overview/OverviewDataLoader';

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
>;
const KeywordPerformanceOverviewTable = lazy(
  () => import('./KeywordPerformanceOverviewTable'),
);

import {
  SAMPLE_CARD_DATA,
  SAMPLE_CHART_DATA,
} from '@/data/amazon-tools-sample-data/amazon-dashboard-sample-data';
import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation';
import {
  transformCsvRow,
  TransformationError,
  CsvRowTransformationResult,
} from '@/lib/utils/amazon/data-transformation';
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
import { useToast } from '@/hooks/use-toast.ts';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import type { CsvColumnMapping } from '@/types/data-mapping';
import type { TableChartProps } from '@/components/amazon-seller-tools/charts/TableChart';
import {
  DashboardMetrics,
  DashboardViewPreferences,
  TimeRange,
  TargetMetricConfig,
  MetricKey,
} from '@/lib/amazon-tools/types';
import {
  INDEXED_DB_OVERVIEW_TAB_SELECTED_METRICS_KEY,
  INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY,
} from '@/lib/constants';
import { getItem, setItem } from '@/lib/indexeddb-service';
import DataCard from './DataCard';

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
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  isMapping: boolean;
  setIsMapping: React.Dispatch<React.SetStateAction<boolean>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  TARGET_METRICS_CONFIG: readonly TargetMetricConfig[];
  searchTerm: string;
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

  const OverviewTabContentDisplay: React.FC<{
    isUploading: boolean;
    isParsing: boolean;
    isProcessing: boolean;
    showMapperFlag: boolean;
    csvHeaders: string[];
    error: string | null;
    parsingErrors: TransformationError[];
    isLoading: boolean;
    metrics: DashboardMetrics[];
    overviewDataMapperKey: number;
    TARGET_METRICS_CONFIG: readonly TargetMetricConfig[];
    handleMappingComplete: (mapping: CsvColumnMapping) => Promise<void>;
    firstCsvDataRow?: Record<string, string>;
    handleMappingCancel: () => void;
    savedMapping: CsvColumnMapping | null;
    handleUploadClick: () => void;
    selectedMetricsForDataView: string[];
    aggregatedAndSortedMetrics: DashboardMetrics[];
    timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    setTimeGranularity: (
      granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    ) => void;
    onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void;
    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;
    customDateRange: { from: Date | undefined; to: Date | undefined };
    setCustomDateRange: React.Dispatch<
      React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>
    >;
    totalRows: number;
    processedRows: number;
  }> = ({
    isUploading,
    isParsing,
    isProcessing,
    showMapperFlag,
    csvHeaders,
    error,
    parsingErrors,
    isLoading,
    metrics,
    overviewDataMapperKey,
    TARGET_METRICS_CONFIG,
    handleMappingComplete,
    firstCsvDataRow,
    handleMappingCancel,
    savedMapping,
    handleUploadClick,
    selectedMetricsForDataView,
    aggregatedAndSortedMetrics,
    onDeleteMetric,
    totalRows,
    processedRows,
    timeGranularity,
    setTimeGranularity,
    timeRange,
    setTimeRange,
    customDateRange,
    setCustomDateRange,
  }) => {
    if (isUploading || isParsing || isProcessing) {
      return (
        <OverviewLoadingIndicator
          isUploading={isUploading}
          isParsing={isParsing}
          isProcessing={isProcessing}
          showMapperText={showMapperFlag}
          totalRows={totalRows}
          processedRows={processedRows}
          parsingErrorCount={parsingErrors.length}
        />
      );
    }

    if (showMapperFlag && csvHeaders.length > 0) {
      return (
        <OverviewDataMapper
          key={overviewDataMapperKey}
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onApplyMapping={handleMappingComplete}
          sampleDataRow={firstCsvDataRow}
          onCancel={handleMappingCancel}
          initialMapping={savedMapping || undefined}
        />
      );
    }

    if (
      (error || parsingErrors.length > 0) &&
      !isLoading &&
      metrics.length === 0
    ) {
      return (
        <OverviewErrorDisplay
          error={error}
          onRetryUpload={handleUploadClick}
          parsingErrors={parsingErrors}
        />
      );
    }

    if (metrics.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {selectedMetricsForDataView.map((metricKey) => {
              const metricConfig = TARGET_METRICS_CONFIG.find(
                (config) => config.key === metricKey,
              );
              if (!metricConfig) return null;
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
                        : String(metricValue)
                      : 'N/A'
                  }
                  unit={metricKey === 'total_conversion_rate' ? '%' : undefined}
                  description="Based on latest data"
                  colorClass="text-blue-400"
                />
              );
            })}
          </div>
          <OverviewDataView
            metrics={metrics}
            aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
            targetMetricsConfig={TARGET_METRICS_CONFIG}
            onDeleteMetric={onDeleteMetric}
            timeGranularity={timeGranularity}
          />
        </>
      );
    }

    return (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <DataCard
            title="Avg. Conversion Rate"
            value={SAMPLE_CARD_DATA.total_conversion_rate.toFixed(2)}
            unit="%"
            description="Based on latest data"
            colorClass="text-blue-400"
          />
          <DataCard
            title="Total Sales"
            value={SAMPLE_CARD_DATA.total_sales_sample.toLocaleString(
              undefined,
              { style: 'currency', currency: 'USD' },
            )}
            description="Based on latest data"
            colorClass="text-green-400"
          />
          <DataCard
            title="Avg. Clicks"
            value={SAMPLE_CARD_DATA.avg_clicks.toFixed(1)}
            description="Based on latest data"
            colorClass="text-yellow-400"
          />
        </div>
      </>
    );
  };

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
  const [timeRange, setTimeRange] = useState<TimeRange>('custom');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const [overviewDataMapperKey, setOverviewDataMapperKey] = useState(0);
  const [savedMapping, setSavedMapping] = useState<CsvColumnMapping | null>(
    null,
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [parsingErrors, setParsingErrors] = useState<TransformationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalRowsRef = useRef(0);
  const processedRowsRef = useRef(0);
  const { toast } = useToast();

  const debouncedTimeRange = useDebounce(timeRange, 500);
  const debouncedTimeGranularity = useDebounce(timeGranularity, 500);
  const debouncedCustomDateRange = useDebounce(customDateRange, 500);

  useEffect(() => {
    const loadPreferences = async () => {
      const storedPreferences = await getItem<DashboardViewPreferences>(
        INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY,
      );
      if (storedPreferences) {
        setTimeGranularity(storedPreferences.timeGranularity);
        setTimeRange(storedPreferences.timeRange);
        setCustomDateRange(
          storedPreferences.customDateRange || {
            from: undefined,
            to: undefined,
          },
        );
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    const savePreferences = async () => {
      await setItem(INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY, {
        timeGranularity: debouncedTimeGranularity,
        timeRange: debouncedTimeRange,
        customDateRange: debouncedCustomDateRange,
      });
      console.log('Dashboard view preferences saved to IndexedDB.');
    };
    savePreferences();
  }, [debouncedTimeGranularity, debouncedTimeRange, debouncedCustomDateRange]);

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
      const storedSelectedMetrics = await getItem<string[]>(
        INDEXED_DB_OVERVIEW_TAB_SELECTED_METRICS_KEY,
      );
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
    setParsingErrors([]);
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsLoading(true);
    totalRowsRef.current = 0;
    processedRowsRef.current = 0;
    setTimeGranularity('daily');
    setTimeRange('custom');
    setCustomDateRange({ from: undefined, to: undefined });
    await setItem(INDEXED_DB_DASHBOARD_VIEW_PREFERENCES_KEY, null);

    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    await setItem('last_csv_mapping', null);
    setSavedMapping(null);
  }, [
    setIsLoading,
    setError,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setMetrics,
    setOverviewDataMapperKey,
    setTimeGranularity,
    setTimeRange,
    setCustomDateRange,
    setSavedMapping,
  ]);

  const handleLoadSampleData = useCallback(() => {
    setIsLoading(true);
    setMetrics(SAMPLE_CHART_DATA as DashboardMetrics[]);
    setError(null);
    setParsingErrors([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    totalRowsRef.current = SAMPLE_CHART_DATA.length;
    processedRowsRef.current = SAMPLE_CHART_DATA.length;

    setTimeRange('custom');
    setCustomDateRange({ from: undefined, to: undefined });

    toast({
      title: 'Sample Data Loaded',
      description: `Loaded ${SAMPLE_CHART_DATA.length} rows of sample data.`,
      variant: 'success',
      duration: 3000,
    });

    setTimeout(() => setIsLoading(false), 500);
  }, [
    setIsLoading,
    setMetrics,
    setError,
    setParsingErrors,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setTimeRange,
    setCustomDateRange,
    toast,
  ]);

  const handleUploadClick = useCallback(() => {
    setMetrics([]);
    setError(null);
    setParsingErrors([]);
    setShowKeywordPerformanceTable(SHOW_KEYWORD_TABLE_DEFAULT);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    totalRowsRef.current = 0;
    processedRowsRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  }, [
    setMetrics,
    setError,
    setParsingErrors,
    setShowKeywordPerformanceTable,
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
  ]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: 'No file selected',
          description: 'Please choose a CSV file to upload.',
          variant: 'warning',
        });
        return;
      }

      setIsUploading(true);
      setIsParsing(true);
      setIsLoading(true);
      setError(null);
      setParsingErrors([]);
      setMetrics([]);
      setShowMapper(false);
      setCsvHeaders([]);
      setSelectedFile(null);
      setFirstCsvDataRow(undefined);
      setIsMapping(false);
      setIsProcessing(false);
      totalRowsRef.current = 0;
      processedRowsRef.current = 0;

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
          const sampleRow = results.data[0] as
            | Record<string, string>
            | undefined;
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
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          setCsvHeaders(headers);
          setFirstCsvDataRow(sampleRow);
          setSelectedFile(file);
          setShowMapper(true);
          setIsParsing(false);
          setIsUploading(false);
          setIsLoading(false);
          setIsMapping(true);
          toast({
            title: 'CSV Uploaded Successfully',
            description: 'Now mapping your data columns.',
            variant: 'success',
            duration: 3000,
          });
        },
        error: (error: Error) => {
          setError(`Failed to read file headers: ${error.message}`);
          toast({
            title: 'Upload Error',
            description: `Failed to read file headers: ${error.message}`,
            variant: 'destructive',
          });
          setIsParsing(false);
          setIsUploading(false);
          setIsLoading(false);
          setIsMapping(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      });
    },
    [
      toast,
      setError,
      setParsingErrors,
      setMetrics,
      setShowMapper,
      setCsvHeaders,
      setSelectedFile,
      setFirstCsvDataRow,
      setIsUploading,
      setIsParsing,
      setIsLoading,
      setIsMapping,
      setIsProcessing,
    ],
  );

  const handleMappingComplete = useCallback(
    async (mapping: CsvColumnMapping) => {
      // Define processCsvData inside useCallback to ensure it's stable
      const processCsvData = async (
        file: File,
        currentMapping: CsvColumnMapping,
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
            step: (rowParseResult) => {
              if (rowParseResult.data) {
                allRows.push(rowParseResult.data);
              }
              processedRowsRef.current = allRows.length;
            },
            complete: () => {
              totalRowsRef.current = allRows.length;
              const validMetrics: DashboardMetrics[] = [];
              const collectedErrors: TransformationError[] = [];

              allRows.forEach((row, i) => {
                const result: CsvRowTransformationResult = transformCsvRow(
                  row,
                  currentMapping,
                  i,
                  TARGET_METRICS_CONFIG,
                );
                if (result.data) {
                  validMetrics.push(result.data);
                }
                collectedErrors.push(...result.errors);
              });
              resolve({
                validMetrics,
                collectedErrors,
                totalRows: allRows.length,
              });
            },
            error: (error: Error) => reject(error),
          });
        });
      };

      // Define generateProcessingStatus inside useCallback to ensure it's stable
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
        let toastVariant: 'success' | 'warning' | 'destructive' | 'info' =
          'info';
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

        const errorCount = collectedErrors.filter(
          (e) => e.type === 'error',
        ).length;
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

        return {
          message: statusMessage,
          variant: toastVariant,
          title: toastTitle,
        };
      };

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
        const { validMetrics, collectedErrors, totalRows } =
          await processCsvData(selectedFile, mapping);

        setMetrics(validMetrics);
        setParsingErrors(collectedErrors);
        totalRowsRef.current = totalRows;

        const { message, variant, title } = generateProcessingStatus(
          validMetrics,
          totalRows,
          collectedErrors,
        );

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
    },
    [
      setError,
      setShowMapper,
      setIsMapping,
      setIsProcessing,
      setParsingErrors,
      setMetrics,
      toast,
      fileInputRef,
      selectedFile,
      TARGET_METRICS_CONFIG, // Add TARGET_METRICS_CONFIG as a dependency
    ],
  );

  const handleMappingCancel = useCallback(() => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setFirstCsvDataRow(undefined);
    setError(null);
    setParsingErrors([]);
    setOverviewDataMapperKey((prev) => prev + 1);
    setIsParsing(false);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Mapping cancelled.');
  }, [
    setShowMapper,
    setCsvHeaders,
    setSelectedFile,
    setFirstCsvDataRow,
    setError,
    setParsingErrors,
    setOverviewDataMapperKey,
    setIsParsing,
    setIsLoading,
  ]);

  const handleDownloadSampleCsv = useCallback(async () => {
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
  }, [setError]);

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

        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }

        return dateA.getTime() - dateB.getTime();
      }),
    [metrics],
  );

  const filterAndAggregateMetricsByTimeRange = useCallback(
    (
      dataToFilter: DashboardMetrics[],
      range: TimeRange,
      customRange: { from: Date | undefined; to: Date | undefined },
    ) => {
      const validDateMetrics = dataToFilter.filter((m) => {
        if (!m.date || typeof m.date !== 'string') {
          return false;
        }
        const d = new Date(m.date);
        return !isNaN(d.getTime());
      });

      let filtered = validDateMetrics;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      switch (range) {
        case 'last_7_days':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >=
              new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          );
          break;
        case 'last_30_days':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >=
              new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          );
          break;
        case 'month_to_date':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >= startOfMonth &&
              new Date(m.date) <= endOfMonth,
          );
          break;
        case 'year_to_date':
          filtered = validDateMetrics.filter(
            (m) =>
              new Date(m.date) >= startOfYear && new Date(m.date) <= endOfYear,
          );
          break;
        case 'custom':
          if (customRange.from && customRange.to) {
            filtered = validDateMetrics.filter(
              (m) =>
                new Date(m.date) >= customRange.from! &&
                new Date(m.date) <= customRange.to!,
            );
          }
          break;
        case 'all_time':
        default:
          break;
      }
      return aggregateMetricsByTime(filtered, timeGranularity);
    },
    [timeGranularity],
  );

  const aggregatedAndSortedMetrics = useMemo(
    () =>
      filterAndAggregateMetricsByTimeRange(
        dailySortedMetrics,
        timeRange,
        customDateRange,
      ),
    [
      dailySortedMetrics,
      timeRange,
      customDateRange,
      filterAndAggregateMetricsByTimeRange,
    ],
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

  const productPerformanceData = useMemo(() => {
    if (metrics.length === 0) {
      return [];
    }
    const filtered = filterMetricsBySearchTerm(metrics, searchTerm);
    return aggregateProductMetrics(filtered);
  }, [metrics, searchTerm, filterMetricsBySearchTerm, aggregateProductMetrics]);

  const productPerformanceRowIdAccessor = useCallback(
    (row: AggregatedProductMetrics) => row.unique_identifier,
    [],
  );

  const productPerformanceTableColumns = useMemo(
    () => [
      {
        accessorKey: 'unique_identifier',
        header: 'ASIN/SKU',
        copyable: true,
        analyzeInTool: { toolName: 'competition', paramName: 'asin' },
      },
      { accessorKey: 'total_sales', header: 'Total Sales' },
      { accessorKey: 'ad_sales', header: 'Ad Sales' },
      { accessorKey: 'acos', header: 'ACoS' },
      { accessorKey: 'profit', header: 'Profit' },
      { accessorKey: 'inventory_level', header: 'Inventory Level' },
    ],
    [],
  );

  return (
    <div className="space-y-4 text-gray-900 dark:text-gray-100">
      <OverviewDataLoader
        isParsing={isParsing}
        isLoading={isLoading}
        handleUploadClick={handleUploadClick}
        handleFileChange={handleFileChange}
        fileInputRef={fileInputRef}
        handleLoadSampleData={handleLoadSampleData}
        handleDownloadSampleCsv={handleDownloadSampleCsv}
        hasMetrics={metrics.length > 0}
      />

      {metrics.length > 0 && (
        <div className="mt-4 p-4 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="time-range-select"
              className="text-gray-700 dark:text-gray-300"
            >
              Time Range:
            </Label>
            <Select
              value={timeRange}
              onValueChange={(value: TimeRange) => setTimeRange(value)}
            >
              <SelectTrigger
                id="time-range-select"
                className="w-[180px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                {timeRange === 'last_7_days' && 'Last 7 Days'}
                {timeRange === 'last_30_days' && 'Last 30 Days'}
                {timeRange === 'month_to_date' && 'Month to Date'}
                {timeRange === 'year_to_date' && 'Year to Date'}
                {timeRange === 'all_time' && 'All Time'}
                {timeRange === 'custom' && 'Custom Range'}
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                <SelectItem
                  value="last_7_days"
                  label="Last 7 Days"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Last 7 Days
                </SelectItem>
                <SelectItem
                  value="last_30_days"
                  label="Last 30 Days"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Last 30 Days
                </SelectItem>
                <SelectItem
                  value="month_to_date"
                  label="Month to Date"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Month to Date
                </SelectItem>
                <SelectItem
                  value="year_to_date"
                  label="Year to Date"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Year to Date
                </SelectItem>
                <SelectItem
                  value="all_time"
                  label="All Time"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  All Time
                </SelectItem>
                <SelectItem
                  value="custom"
                  label="Custom Range"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Custom Range
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timeRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[280px] justify-start text-left font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                      !customDateRange.from &&
                        'text-muted-foreground dark:text-gray-400',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, 'PPP')} -{' '}
                          {format(customDateRange.to, 'PPP')}
                        </>
                      ) : (
                        format(customDateRange.from, 'PPP')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  align="start"
                >
                  <Calendar
                    mode="range"
                    selected={customDateRange}
                    onSelect={(range) => {
                      if (range) {
                        setCustomDateRange({
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
                    numberOfMonths={2}
                    initialFocus
                    className="text-gray-900 dark:text-gray-100"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="time-granularity-select"
              className="text-gray-700 dark:text-gray-300"
            >
              Granularity:
            </Label>
            <Select
              value={timeGranularity}
              onValueChange={(value: string) =>
                setTimeGranularity(value as typeof timeGranularity)
              }
            >
              <SelectTrigger
                id="time-granularity-select"
                className="w-[180px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                <SelectValue placeholder="Select Time Granularity" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                <SelectItem
                  value="daily"
                  label="Daily"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Daily
                </SelectItem>
                <SelectItem
                  value="weekly"
                  label="Weekly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Weekly
                </SelectItem>
                <SelectItem
                  value="monthly"
                  label="Monthly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Monthly
                </SelectItem>
                <SelectItem
                  value="quarterly"
                  label="Quarterly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Quarterly
                </SelectItem>
                <SelectItem
                  value="yearly"
                  label="Yearly"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Yearly
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <OverviewTabContentDisplay
        isUploading={isUploading}
        isParsing={isParsing}
        isProcessing={isProcessing}
        showMapperFlag={showMapper}
        csvHeaders={csvHeaders}
        error={error}
        parsingErrors={parsingErrors}
        isLoading={isLoading}
        metrics={metrics}
        overviewDataMapperKey={overviewDataMapperKey}
        TARGET_METRICS_CONFIG={TARGET_METRICS_CONFIG}
        handleMappingComplete={handleMappingComplete}
        firstCsvDataRow={firstCsvDataRow}
        handleMappingCancel={handleMappingCancel}
        savedMapping={savedMapping}
        handleUploadClick={handleUploadClick}
        selectedMetricsForDataView={selectedMetrics}
        aggregatedAndSortedMetrics={aggregatedAndSortedMetrics}
        timeGranularity={timeGranularity}
        setTimeGranularity={setTimeGranularity}
        onDeleteMetric={onDeleteMetric}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        totalRows={totalRowsRef.current}
        processedRows={processedRowsRef.current}
      />

      <div className="mb-4 p-4 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Product Performance Overview
        </h2>
        <Suspense
          fallback={
            <div className="p-4 text-center text-gray-700 dark:text-gray-300">
              Loading table...
            </div>
          }
        >
          <TableChart
            columns={productPerformanceTableColumns}
            data={productPerformanceData}
            rowIdAccessor={productPerformanceRowIdAccessor}
          />
        </Suspense>
      </div>

      {showKeywordPerformanceTable && metrics.length > 0 && (
        <div className="mb-4 p-4 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Keyword Performance Overview
          </h2>
          <Suspense
            fallback={
              <div className="text-gray-700 dark:text-gray-300">
                Loading keyword table...
              </div>
            }
          >
            <KeywordPerformanceOverviewTable
              metrics={metrics}
              searchTerm={searchTerm}
            />
          </Suspense>
        </div>
      )}

      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-gray-200 dark:border-gray-700">
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

export default OverviewTab;
